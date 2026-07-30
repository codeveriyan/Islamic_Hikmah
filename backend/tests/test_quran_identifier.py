import base64

from fastapi.testclient import TestClient

import server
from learn_quran.asr import AsrTranscript
from quran_identify_matcher import NoConfidentMatchError, find_best_match


client = TestClient(server.app)
DUMMY_AUDIO = b"fake-audio-bytes"
DUMMY_AUDIO_B64 = base64.b64encode(DUMMY_AUDIO).decode("ascii")


def test_identify_requires_audio_payload():
    response = client.post(
        "/api/quran/identify",
        json={"audio_format": "wav", "sample_rate": 16000},
    )

    assert response.status_code == 422
    assert "audio" in response.json()["detail"].lower()


def test_identify_rejects_invalid_base64():
    response = client.post(
        "/api/quran/identify",
        json={"audio_b64": "this-is-not-base64!", "audio_format": "webm"},
    )

    assert response.status_code == 422
    assert "base64" in response.json()["detail"].lower()


def test_identify_fails_closed_when_asr_is_disabled(monkeypatch):
    monkeypatch.setenv("LEARN_QURAN_ASR_ENABLED", "false")

    response = client.post(
        "/api/quran/identify",
        json={"audio_b64": DUMMY_AUDIO_B64, "audio_format": "webm"},
    )

    assert response.status_code == 503
    assert "not ready" in response.json()["detail"].lower()


def test_identify_returns_real_match_without_guessing_reciter(monkeypatch):
    class FakeAsrService:
        def transcribe(self, audio_bytes: bytes) -> AsrTranscript:
            assert audio_bytes == DUMMY_AUDIO
            return AsrTranscript(
                text="قل هو الله احد الله الصمد",
                model_name="fake-quran-asr",
                model_revision="test-revision",
                processing_time_ms=42,
            )

    monkeypatch.setattr(server, "get_quran_asr_service", FakeAsrService)
    data_url = f"data:audio/webm;base64,{DUMMY_AUDIO_B64}"

    response = client.post(
        "/api/quran/identify",
        json={"audio_b64": data_url, "audio_format": "webm"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["source"] == "model"
    assert data["surah_number"] == 112
    assert data["verse_start"] == 1
    assert data["verse_end"] == 2
    assert 0.65 <= data["confidence"] <= 1.0
    assert data["reciter_name"] is None
    assert data["reciter_status"] == "not_available"
    assert data["modelName"] == "fake-quran-asr"


def test_identify_reports_no_match_honestly(monkeypatch):
    class FakeAsrService:
        def transcribe(self, _audio_bytes: bytes) -> AsrTranscript:
            return AsrTranscript(
                text="نص عربي غير كاف",
                model_name="fake-quran-asr",
                model_revision="test-revision",
                processing_time_ms=42,
            )

    def no_match(_transcript: AsrTranscript):
        raise NoConfidentMatchError("Recite a longer passage.")

    monkeypatch.setattr(server, "get_quran_asr_service", FakeAsrService)
    monkeypatch.setattr(server, "identify_from_transcript", no_match)

    response = client.post(
        "/api/quran/identify",
        json={"audio_b64": DUMMY_AUDIO_B64, "audio_format": "webm"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "no_match",
        "message": "Recite a longer passage.",
        "transcript": "نص عربي غير كاف",
    }


def test_matcher_handles_fragment_of_a_long_ayah():
    match = find_best_match(
        "تبارك الذي بيده الملك وهو على كل شيء قدير"
    )

    assert match.surah_number == 67
    assert match.ayah_start == 1
    assert match.ayah_end == 1
    assert match.confidence >= 0.9


def test_matcher_supports_custom_min_confidence():
    # Verify custom min_confidence parameter overrides default threshold
    import pytest
    with pytest.raises(NoConfidentMatchError):
        find_best_match("قل هو الله احد", min_confidence=1.01)

    match = find_best_match("قل هو الله احد", min_confidence=0.50)
    assert match.surah_number == 112


def test_identify_text_route_success():
    response = client.post(
        "/api/quran/identify-text",
        json={"arabic_text": "قل هو الله احد الله الصمد"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["surah_number"] == 112
    assert data["source"] == "text"


def test_identify_text_route_requires_exactly_one_input():
    # Both inputs -> 422
    res1 = client.post(
        "/api/quran/identify-text",
        json={"arabic_text": "اختبار", "image_b64": "fake"},
    )
    assert res1.status_code == 422

    # Neither input -> 422
    res2 = client.post(
        "/api/quran/identify-text",
        json={},
    )
    assert res2.status_code == 422
