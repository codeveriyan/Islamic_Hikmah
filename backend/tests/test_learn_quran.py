import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server  # noqa: E402
import learn_quran.router as learn_router  # noqa: E402
from learn_quran.alignment import align_transcript, normalize_arabic_word  # noqa: E402
from learn_quran.asr import AsrTranscript  # noqa: E402
from learn_quran.router import (  # noqa: E402
    MOCK_DISCLAIMER,
    build_mock_score,
    build_model_score,
)


@pytest.fixture(autouse=True)
def disable_real_asr_by_default(monkeypatch):
    monkeypatch.setenv("LEARN_QURAN_ASR_ENABLED", "false")


def test_learn_score_route_is_mounted_under_existing_api_router():
    paths = {route.path for route in server.app.routes}
    assert "/api/learn/score" in paths
    assert "/api/learn/status" in paths


def test_localhost_web_origin_can_preflight_scoring_upload():
    client = TestClient(server.app)
    response = client.options(
        "/api/learn/score",
        headers={
            "Origin": "http://localhost:8080",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8080"


def test_mock_score_is_explicit_and_uses_server_owned_quran_text():
    result = build_mock_score(audio_size=2048, surah_id=1, ayah_id=1)

    assert result.source == "mock"
    assert result.disclaimer == MOCK_DISCLAIMER
    assert 0 <= result.overallScore <= 100
    assert [word.expectedText for word in result.wordResults] == [
        "بِسۡمِ",
        "ٱللَّهِ",
        "ٱلرَّحۡمَٰنِ",
        "ٱلرَّحِيمِ",
    ]


def test_mock_score_can_focus_on_one_word():
    result = build_mock_score(
        audio_size=1024,
        surah_id=1,
        ayah_id=5,
        word_index=2,
    )

    assert len(result.wordResults) == 1
    assert result.wordResults[0].wordIndex == 2
    assert result.wordResults[0].expectedText == "وَإِيَّاكَ"


def test_mock_score_rejects_non_pilot_ayahs():
    with pytest.raises(HTTPException) as error:
        build_mock_score(audio_size=1024, surah_id=2, ayah_id=1)

    assert error.value.status_code == 422


def test_audio_upload_contract_requires_authentication():
    client = TestClient(server.app)
    response = client.post(
        "/api/learn/score",
        data={"surah_id": "1", "ayah_id": "1"},
        files={"audio": ("recitation.m4a", b"prototype-audio", "audio/m4a")},
    )

    assert response.status_code == 401


def test_authenticated_audio_upload_fails_closed_without_real_scorer():
    client = TestClient(server.app)
    server.app.dependency_overrides[server.get_current_user_profile] = lambda: {
        "id": "firebase-uid-1",
        "tier": "premium",
    }
    try:
        response = client.post(
            "/api/learn/score",
            data={"surah_id": "1", "ayah_id": "1"},
            files={"audio": ("recitation.m4a", b"prototype-audio", "audio/m4a")},
        )
    finally:
        server.app.dependency_overrides.clear()

    assert response.status_code == 503
    payload = response.json()
    assert "disabled" in payload["detail"]


def test_mock_upload_requires_explicit_development_switch(monkeypatch):
    client = TestClient(server.app)
    server.app.dependency_overrides[server.get_current_user_profile] = lambda: {
        "id": "firebase-uid-1",
        "tier": "premium",
    }
    monkeypatch.setattr(learn_router, "ALLOW_MOCK_SCORING", True)
    try:
        response = client.post(
            "/api/learn/score",
            data={"surah_id": "1", "ayah_id": "1"},
            files={"audio": ("recitation.m4a", b"prototype-audio", "audio/m4a")},
        )
    finally:
        server.app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["source"] == "mock"


def test_quranic_marks_and_plain_asr_arabic_normalize_to_same_word():
    assert normalize_arabic_word("ٱلۡحَمۡدُ") == normalize_arabic_word("الحمد")
    assert normalize_arabic_word("إِيَّاكَ") == normalize_arabic_word("اياك")


def test_word_alignment_does_not_shift_after_an_omission():
    result = align_transcript(
        ["ٱلۡحَمۡدُ", "لِلَّهِ", "رَبِّ", "ٱلۡعَٰلَمِينَ"],
        "الحمد لله العالمين",
    )

    assert [word.status for word in result.words] == [
        "correct",
        "correct",
        "incorrect",
        "correct",
    ]
    assert result.words[2].heard_text is None


def test_completely_different_transcript_receives_zero():
    result = align_transcript(
        ["ٱلۡحَمۡدُ", "لِلَّهِ", "رَبِّ", "ٱلۡعَٰلَمِينَ"],
        "هذا كلام مختلف",
    )

    assert result.score == 0
    assert all(word.status == "incorrect" for word in result.words)


def test_model_score_is_transparent_and_not_labelled_as_tajweed():
    score = build_model_score(
        transcript=AsrTranscript(
            text="الحمد لله رب العالمين",
            model_name="test-quran-asr",
            model_revision="fixed-revision",
            processing_time_ms=321,
        ),
        surah_id=1,
        ayah_id=2,
    )

    assert score.source == "model"
    assert score.overallScore == 100
    assert score.transcript == "الحمد لله رب العالمين"
    assert score.modelName == "test-quran-asr"
    assert score.modelRevision == "fixed-revision"
    assert score.processingTimeMs == 321
    assert "does not assess Tajweed" in score.disclaimer


def test_authenticated_upload_uses_real_transcript_service(monkeypatch):
    class FakeAsrService:
        enabled = True

        def transcribe(self, audio_bytes):
            assert audio_bytes == b"real-audio-bytes"
            return AsrTranscript(
                text="بسم الله الرحمن الرحيم",
                model_name="fake-quran-asr",
                model_revision="test",
                processing_time_ms=50,
            )

        def status(self):
            return {"enabled": True, "state": "ready"}

    monkeypatch.setattr(
        learn_router,
        "get_quran_asr_service",
        lambda: FakeAsrService(),
    )
    client = TestClient(server.app)
    server.app.dependency_overrides[server.get_current_user_profile] = lambda: {
        "id": "firebase-uid-1",
        "tier": "premium",
    }
    try:
        response = client.post(
            "/api/learn/score",
            data={"surah_id": "1", "ayah_id": "1"},
            files={"audio": ("recitation.m4a", b"real-audio-bytes", "audio/m4a")},
        )
    finally:
        server.app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["source"] == "model"
    assert response.json()["overallScore"] == 100
