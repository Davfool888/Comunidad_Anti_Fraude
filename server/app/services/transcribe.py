"""Transcripción de notas de voz en el servidor (opcional).

Usa `faster-whisper` si está instalado. Si no, el frontend sigue pudiendo
transcribir en vivo con el reconocimiento de voz del navegador.
"""

from __future__ import annotations

import tempfile
from functools import lru_cache
from pathlib import Path

from ..config import settings


@lru_cache(maxsize=1)
def _model():
    from faster_whisper import WhisperModel  # import diferido: dependencia opcional

    return WhisperModel(settings.whisper_model, device="cpu", compute_type="int8")


def available() -> bool:
    try:
        import faster_whisper  # noqa: F401
    except ImportError:
        return False
    return True


def transcribe(data: bytes, filename: str) -> str:
    suffix = Path(filename).suffix or ".ogg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
        handle.write(data)
        path = handle.name
    try:
        segments, _ = _model().transcribe(path, language="es", vad_filter=True)
        return " ".join(segment.text.strip() for segment in segments).strip()
    finally:
        Path(path).unlink(missing_ok=True)
