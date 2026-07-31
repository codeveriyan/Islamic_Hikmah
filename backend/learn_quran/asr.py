import logging
import os
from pathlib import Path
import shutil
import subprocess
import threading
import time
from dataclasses import dataclass
from typing import Any, Optional


logger = logging.getLogger(__name__)

DEFAULT_MODEL_NAME = "tarteel-ai/whisper-base-ar-quran"
DEFAULT_MODEL_REVISION = "5c3c53fdf9272c4f6ee0bee09a1e5a4a615ee25c"


class AsrUnavailableError(RuntimeError):
    pass


class AsrTranscriptionError(RuntimeError):
    pass


class NoArabicSpeechError(ValueError):
    pass


@dataclass(frozen=True)
class AsrTranscript:
    text: str
    model_name: str
    model_revision: str
    processing_time_ms: int


class QuranAsrService:
    """Lazy, process-local Quran Whisper inference service."""

    def __init__(self) -> None:
        self._pipeline: Optional[Any] = None
        self._load_error: Optional[str] = None
        self._loading = False
        self._load_lock = threading.Lock()
        self._inference_lock = threading.Lock()
        self._device = "not_loaded"
        self._ffmpeg_executable: Optional[str] = None

    @property
    def enabled(self) -> bool:
        return os.environ.get("LEARN_QURAN_ASR_ENABLED", "false").lower() == "true"

    @property
    def model_name(self) -> str:
        return os.environ.get("LEARN_QURAN_ASR_MODEL", DEFAULT_MODEL_NAME)

    @property
    def model_revision(self) -> str:
        return os.environ.get("LEARN_QURAN_ASR_REVISION", DEFAULT_MODEL_REVISION)

    @property
    def local_files_only(self) -> bool:
        return (
            os.environ.get("LEARN_QURAN_ASR_LOCAL_FILES_ONLY", "false").lower()
            == "true"
        )

    def status(self) -> dict[str, Any]:
        if not self.enabled:
            state = "disabled"
        elif self._pipeline is not None:
            state = "ready"
        elif self._loading:
            state = "loading"
        elif self._load_error:
            state = "error"
        else:
            state = "not_loaded"
        return {
            "enabled": self.enabled,
            "state": state,
            "model": self.model_name,
            "revision": self.model_revision,
            "device": self._device,
            "localFilesOnly": self.local_files_only,
            "error": self._load_error,
        }

    def ensure_loaded(self) -> None:
        if not self.enabled:
            raise AsrUnavailableError(
                "Quran ASR is disabled. Set LEARN_QURAN_ASR_ENABLED=true on the backend."
            )
        if self._pipeline is not None:
            return
        if self._load_error:
            raise AsrUnavailableError(self._load_error)

        with self._load_lock:
            if self._pipeline is not None:
                return
            if self._load_error:
                raise AsrUnavailableError(self._load_error)
            self._loading = True
            try:
                self._ffmpeg_executable = self._resolve_ffmpeg_executable()
                if self._ffmpeg_executable is None:
                    raise AsrUnavailableError(
                        "FFmpeg is required to decode phone recordings. Install "
                        "imageio-ffmpeg or make ffmpeg available on PATH."
                    )

                import torch
                from transformers import pipeline

                requested_device = os.environ.get("LEARN_QURAN_ASR_DEVICE", "auto").lower()
                use_cuda = requested_device != "cpu" and torch.cuda.is_available()
                device = 0 if use_cuda else -1
                torch_dtype = torch.float16 if use_cuda else torch.float32
                self._device = "cuda" if use_cuda else "cpu"
                logger.info(
                    "Loading Quran ASR model %s at %s on %s",
                    self.model_name,
                    self.model_revision,
                    self._device,
                )
                self._pipeline = pipeline(
                    task="automatic-speech-recognition",
                    model=self.model_name,
                    revision=self.model_revision,
                    device=device,
                    dtype=torch_dtype,
                    trust_remote_code=False,
                    model_kwargs={"local_files_only": self.local_files_only},
                )
                logger.info("Quran ASR model is ready")
            except AsrUnavailableError as exc:
                self._load_error = str(exc)
                raise
            except (ImportError, OSError, RuntimeError) as exc:
                logger.exception("Quran ASR model failed to load")
                self._load_error = (
                    "Quran ASR could not be loaded. Install the ASR requirements, "
                    "confirm model access, and restart the backend."
                )
                raise AsrUnavailableError(self._load_error) from exc
            finally:
                self._loading = False

    @staticmethod
    def _resolve_ffmpeg_executable() -> Optional[str]:
        system_ffmpeg = shutil.which("ffmpeg")
        if system_ffmpeg:
            return system_ffmpeg

        try:
            import imageio_ffmpeg
        except ImportError:
            return None

        bundled_ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        return bundled_ffmpeg if Path(bundled_ffmpeg).is_file() else None

    def _decode_audio(self, audio_bytes: bytes):
        """Decode uploads to the 16 kHz mono float waveform Whisper expects."""

        if self._ffmpeg_executable is None:
            raise AsrUnavailableError("The FFmpeg audio decoder is not available.")

        process = subprocess.run(
            [
                self._ffmpeg_executable,
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                "-f",
                "f32le",
                "-ac",
                "1",
                "-ar",
                "16000",
                "pipe:1",
            ],
            input=audio_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if process.returncode != 0 or not process.stdout:
            decoder_error = process.stderr.decode("utf-8", errors="replace").strip()
            logger.warning("FFmpeg could not decode a recitation: %s", decoder_error)
            raise AsrTranscriptionError(
                "The recording could not be decoded. Please record the ayah again."
            )

        import numpy as np

        array = np.frombuffer(process.stdout, dtype=np.float32).copy()
        duration_sec = len(array) / 16000.0
        if duration_sec > 30.0:
            raise AsrTranscriptionError(
                f"The audio recording duration ({duration_sec:.1f}s) exceeds the 30-second limit."
            )
        return array

    def transcribe(self, audio_bytes: bytes) -> AsrTranscript:
        self.ensure_loaded()
        if not audio_bytes:
            raise AsrTranscriptionError("The uploaded recording is empty.")

        started = time.perf_counter()
        try:
            waveform = self._decode_audio(audio_bytes)
            with self._inference_lock:
                # This Quran checkpoint predates generation_config.json. Passing
                # modern Whisper language/task arguments makes current
                # Transformers reject its legacy configuration, so use the
                # checkpoint's own learned decoder setup as its model card does.
                output = self._pipeline(waveform)
        except (OSError, RuntimeError, ValueError) as exc:
            logger.exception("Quran ASR inference failed")
            raise AsrTranscriptionError(
                "The recording could not be decoded or transcribed."
            ) from exc

        text = str(output.get("text", "") if isinstance(output, dict) else "").strip()
        arabic_letters = sum(
            1
            for character in text
            if "\u0621" <= character <= "\u063a" or "\u0641" <= character <= "\u064a"
        )
        if not text or arabic_letters == 0:
            raise NoArabicSpeechError(
                "No Arabic recitation was detected. No score was generated."
            )

        return AsrTranscript(
            text=text,
            model_name=self.model_name,
            model_revision=self.model_revision,
            processing_time_ms=round((time.perf_counter() - started) * 1000),
        )


_SERVICE = QuranAsrService()


def get_quran_asr_service() -> QuranAsrService:
    return _SERVICE
