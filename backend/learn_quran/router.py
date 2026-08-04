from collections.abc import Callable
import asyncio
import os
from typing import Any, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from .alignment import align_transcript
from .asr import (
    AsrTranscriptionError,
    AsrTranscript,
    AsrUnavailableError,
    NoArabicSpeechError,
    get_quran_asr_service,
)
from .schemas import ScoreResponse, WordResult


MAX_AUDIO_BYTES = 10 * 1024 * 1024
ALLOW_MOCK_SCORING = (
    os.environ.get("LEARN_QURAN_ALLOW_MOCK_SCORING", "false").lower() == "true"
)
ALLOWED_AUDIO_TYPES = {
    "application/octet-stream",
    "audio/aac",
    "audio/3gpp",
    "audio/m4a",
    "audio/mp4",
    "audio/mpeg",
    "audio/webm",
    "audio/x-m4a",
}

# A deliberately small pilot corpus. The production scorer will read canonical
# Quran text from a versioned server-side source; the client is never trusted
# to supply the text that it is scored against.
PILOT_AYAHS: dict[tuple[int, int], str] = {
    (1, 1): "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
    (1, 2): "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
    (1, 3): "ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
    (1, 4): "مَٰلِكِ يَوۡمِ ٱلدِّينِ",
    (1, 5): "إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ",
    (1, 6): "ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ",
    (1, 7): "صِرَٰطَ ٱلَّذِينَ أَنۡعَمۡتَ عَلَيۡهِمۡ غَيۡرِ ٱلۡمَغۡضُوبِ عَلَيۡهِمۡ وَلَا ٱلضَّآلِّينَ",
}

MOCK_DISCLAIMER = (
    "Prototype feedback only. The speech model is not connected yet, so these "
    "statuses demonstrate the interface and must not be treated as Tajweed guidance."
)
MODEL_DISCLAIMER = (
    "AI transcript matching only. This result compares recognized words with "
    "the selected ayah; it does not assess Tajweed, makhraj, or vowel quality."
)
SCORER_VERSION = "quran-word-aligner-v1"


def build_mock_score(
    *,
    audio_size: int,
    surah_id: int,
    ayah_id: int,
    word_index: Optional[int] = None,
) -> ScoreResponse:
    expected_text = PILOT_AYAHS.get((surah_id, ayah_id))
    if expected_text is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The prototype scorer currently supports Surah Al-Fatihah only.",
        )

    words = expected_text.split()
    indexed_words = list(enumerate(words))
    if word_index is not None:
        if word_index < 0 or word_index >= len(words):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The selected word is outside this ayah.",
            )
        indexed_words = [(word_index, words[word_index])]

    results: list[WordResult] = []
    for index, word in indexed_words:
        # Deterministic demo variation makes the UI testable without pretending
        # that the uploaded audio was understood.
        selector = (audio_size + surah_id + ayah_id + index) % 11
        if selector == 0:
            word_status = "incorrect"
            heard_text = None
        elif selector in {1, 2}:
            word_status = "minor_issue"
            heard_text = word
        else:
            word_status = "correct"
            heard_text = word
        results.append(
            WordResult(
                wordIndex=index,
                expectedText=word,
                heardText=heard_text,
                status=word_status,
            )
        )

    score_values = {
        "correct": 1.0,
        "minor_issue": 0.65,
        "incorrect": 0.0,
    }
    overall_score = round(
        sum(score_values[result.status] for result in results) / len(results) * 100
    )

    return ScoreResponse(
        attemptId=str(uuid4()),
        surahId=surah_id,
        ayahId=ayah_id,
        overallScore=overall_score,
        wordResults=results,
        source="mock",
        disclaimer=MOCK_DISCLAIMER,
    )


def build_model_score(
    *,
    transcript: AsrTranscript,
    surah_id: int,
    ayah_id: int,
    word_index: Optional[int] = None,
) -> ScoreResponse:
    expected_text = PILOT_AYAHS.get((surah_id, ayah_id))
    if expected_text is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The AI recitation pilot currently supports Surah Al-Fatihah only.",
        )

    all_words = expected_text.split()
    if word_index is None:
        expected_words = all_words
        expected_indices = list(range(len(all_words)))
    else:
        if word_index < 0 or word_index >= len(all_words):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The selected word is outside this ayah.",
            )
        expected_words = [all_words[word_index]]
        expected_indices = [word_index]

    alignment = align_transcript(
        expected_words,
        transcript.text,
        expected_indices=expected_indices,
    )
    return ScoreResponse(
        attemptId=str(uuid4()),
        surahId=surah_id,
        ayahId=ayah_id,
        overallScore=alignment.score,
        wordResults=[
            WordResult(
                wordIndex=word.expected_index,
                expectedText=word.expected_text,
                heardText=word.heard_text,
                status=word.status,
            )
            for word in alignment.words
        ],
        source="model",
        disclaimer=MODEL_DISCLAIMER,
        transcript=transcript.text,
        modelName=transcript.model_name,
        modelRevision=transcript.model_revision,
        scorerVersion=SCORER_VERSION,
        processingTimeMs=transcript.processing_time_ms,
    )


def create_learn_quran_router(
    database: Any,
    auth_dependency: Callable[..., Any],
) -> APIRouter:
    del database  # Reserved for attempt persistence in the validated-model phase.
    router = APIRouter(prefix="/learn", tags=["learn_quran"])
    inference_slots = asyncio.Semaphore(
        max(1, int(os.environ.get("LEARN_QURAN_ASR_CONCURRENCY", "1")))
    )

    @router.get("/status")
    async def scorer_status() -> dict[str, Any]:
        service_status = get_quran_asr_service().status()
        return {
            **service_status,
            "scope": "Al-Fatihah pilot",
            "capability": "word_transcript_matching",
            "tajweedAssessment": False,
        }

    @router.post("/score", response_model=ScoreResponse)
    async def score_recitation(
        audio: UploadFile = File(...),
        surah_id: int = Form(..., ge=1, le=114),
        ayah_id: int = Form(..., ge=1),
        word_index: Optional[int] = Form(default=None, ge=0),
        current_user: dict = Depends(auth_dependency),
    ) -> ScoreResponse:
        # Authentication is intentionally resolved before any model or upload
        # work. Future premium enforcement can use current_user["tier"] here.
        if not current_user.get("id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="A signed-in account is required for recitation scoring.",
            )
        if current_user.get("tier") != "premium" and not current_user.get("trial_active"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Premium access is required for recitation scoring.",
            )

        asr_service = get_quran_asr_service()
        if not asr_service.enabled and not ALLOW_MOCK_SCORING:
            await audio.close()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Quran ASR is disabled on the backend. The recording was not "
                    "scored and no result was saved."
                ),
            )

        content_type = (audio.content_type or "application/octet-stream").lower()
        if content_type not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Upload an AAC, M4A, MP3, 3GP, or WebM audio recording.",
            )

        audio_bytes = await audio.read(MAX_AUDIO_BYTES + 1)
        await audio.close()
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded recording is empty.",
            )
        if len(audio_bytes) > MAX_AUDIO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="The recording is larger than the 10 MB prototype limit.",
            )

        if not asr_service.enabled:
            return build_mock_score(
                audio_size=len(audio_bytes),
                surah_id=surah_id,
                ayah_id=ayah_id,
                word_index=word_index,
            )

        try:
            async with inference_slots:
                transcript = await run_in_threadpool(asr_service.transcribe, audio_bytes)
        except AsrUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        except NoArabicSpeechError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
        except AsrTranscriptionError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        return build_model_score(
            transcript=transcript,
            surah_id=surah_id,
            ayah_id=ayah_id,
            word_index=word_index,
        )

    return router
