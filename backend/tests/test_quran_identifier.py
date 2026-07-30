import pytest
from fastapi.testclient import TestClient
import server

client = TestClient(server.app)

def test_quran_identify_endpoint():
    response = client.post(
        "/api/quran/identify",
        json={"audio_format": "wav", "sample_rate": 16000}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "surah_number" in data
    assert "reciter_name" in data
    assert "matched_text_arabic" in data
