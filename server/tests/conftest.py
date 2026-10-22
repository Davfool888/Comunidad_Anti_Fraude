"""Entorno aislado para las pruebas: se fija antes de importar la aplicación,
así no se lee el `server/.env` local ni se toca la base de datos real."""

import os
import tempfile
from pathlib import Path

_tmp = Path(tempfile.mkdtemp())
os.environ["DATABASE_PATH"] = str(_tmp / "test.db")
os.environ["UPLOADS_DIR"] = str(_tmp / "uploads")
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["ANTHROPIC_AUTH_TOKEN"] = ""
os.environ["GEMINI_API_KEY"] = ""  # nunca llamar a la IA real ni gastar la cuota
os.environ["AI_PROVIDER"] = "auto"
os.environ["MODERATOR_TOKEN"] = "token-de-prueba"
os.environ["RATE_LIMIT_PER_MINUTE"] = "1000"
os.environ["ALERTS_AUTO_PUBLISH"] = "true"
