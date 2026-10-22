"""Configuración del backend, leída de variables de entorno (`server/.env`)."""

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

SERVER_DIR = Path(__file__).resolve().parent.parent
load_dotenv(SERVER_DIR / ".env")


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "si", "sí"}


def _path(name: str, default: str) -> Path:
    raw = Path(os.getenv(name) or default)
    return raw if raw.is_absolute() else SERVER_DIR / raw


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", "").strip())
    anthropic_model: str = field(default_factory=lambda: os.getenv("ANTHROPIC_MODEL", "claude-opus-5-5").strip())
    anthropic_effort: str = field(default_factory=lambda: os.getenv("ANTHROPIC_EFFORT", "medium").strip())
    gemini_api_key: str = field(default_factory=lambda: os.getenv("GEMINI_API_KEY", "").strip())
    gemini_model: str = field(default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip())
    # Modelos de respaldo, en orden, si el principal está saturado (503), agotó su
    # cuota gratuita (429) o fue retirado (404)
    gemini_fallback_models: list[str] = field(
        default_factory=lambda: [
            model.strip()
            for model in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-3.5-flash-lite,gemini-3.8-flash").split(",")
            if model.strip()
        ]
    )
    # auto | claude | gemini | local
    ai_provider_setting: str = field(default_factory=lambda: os.getenv("AI_PROVIDER", "auto").strip().lower())
    moderator_token: str = field(
        default_factory=lambda: os.getenv("MODERATOR_TOKEN", "").strip() or secrets.token_urlsafe(18)
    )
    moderator_token_generated: bool = field(default_factory=lambda: not os.getenv("MODERATOR_TOKEN", "").strip())
    alerts_auto_publish: bool = field(default_factory=lambda: _bool("ALERTS_AUTO_PUBLISH", True))
    database_path: Path = field(default_factory=lambda: _path("DATABASE_PATH", "data/red_segura.db"))
    uploads_dir: Path = field(default_factory=lambda: _path("UPLOADS_DIR", "data/uploads"))
    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
            if origin.strip()
        ]
    )
    rate_limit_per_minute: int = field(default_factory=lambda: int(os.getenv("RATE_LIMIT_PER_MINUTE", "30")))
    hash_salt: str = field(default_factory=lambda: os.getenv("HASH_SALT", "cambia-esta-sal"))
    whisper_model: str = field(default_factory=lambda: os.getenv("WHISPER_MODEL", "base"))

    # Límites de entrada
    max_text_chars: int = 8000
    max_image_bytes: int = 8 * 1024 * 1024
    max_audio_bytes: int = 16 * 1024 * 1024
    max_files: int = 5

    @property
    def has_claude(self) -> bool:
        return bool(self.anthropic_api_key or os.getenv("ANTHROPIC_AUTH_TOKEN", "").strip())

    @property
    def ai_provider(self) -> str:
        """Motor de IA efectivo: `claude`, `gemini` o `local` (sin IA)."""
        choice = self.ai_provider_setting
        if choice == "claude":
            return "claude" if self.has_claude else "local"
        if choice == "gemini":
            return "gemini" if self.gemini_api_key else "local"
        if choice == "local":
            return "local"
        # auto: Claude si hay credenciales, si no Gemini, si no el motor local
        return "claude" if self.has_claude else "gemini" if self.gemini_api_key else "local"

    @property
    def ai_enabled(self) -> bool:
        return self.ai_provider != "local"

    @property
    def ai_model(self) -> str | None:
        return {"claude": self.anthropic_model, "gemini": self.gemini_model}.get(self.ai_provider)


settings = Settings()
