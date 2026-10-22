"""Aplicación FastAPI de la Red Segura de Comercios.

Arranque en desarrollo (desde `server/`):
    .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db
from .routers import alerts, analyze, community, moderation

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("red_segura")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    log.info("IA: %s", f"{settings.ai_provider} ({settings.ai_model})" if settings.ai_enabled else "motor local (sin claves de IA)")
    if settings.moderator_token_generated:
        log.warning("MODERATOR_TOKEN no configurado. Token temporal de esta sesión: %s", settings.moderator_token)
    yield


app = FastAPI(
    title="Red Segura de Comercios — API",
    description="Análisis de fraude con IA, red comunitaria de alertas y centro de aprendizaje.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-Moderator-Token"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "camera=(), geolocation=(), microphone=()")
    if request.url.path.startswith("/api/") and "Cache-Control" not in response.headers:
        response.headers["Cache-Control"] = "no-store"
    return response


app.include_router(analyze.router)
app.include_router(alerts.router)
app.include_router(community.router)
app.include_router(moderation.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
