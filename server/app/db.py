"""Base de datos SQLite: esquema, conexión y datos iniciales.

Se usa `sqlite3` de la biblioteca estándar, sin ORM. Cada petición abre su
propia conexión (`get_db`), así no se comparten cursores entre hilos.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime

from .config import settings
from .seed import SEED_MODALITIES

SCHEMA = """
CREATE TABLE IF NOT EXISTS alerts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    network_id    TEXT NOT NULL,
    community_id  TEXT,
    business_name TEXT,
    lat           REAL,
    lng           REAL,
    level         TEXT NOT NULL CHECK (level IN ('danger', 'warning', 'info')),
    category      TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    entities      TEXT NOT NULL DEFAULT '[]',
    image_path    TEXT,
    threat        TEXT,
    status        TEXT NOT NULL DEFAULT 'sin_verificar'
                  CHECK (status IN ('pendiente', 'sin_verificar', 'verificada', 'rechazada')),
    confirmations INTEGER NOT NULL DEFAULT 0,
    reporter_hash TEXT,
    created_at    TEXT NOT NULL,
    reviewed_at   TEXT,
    review_note   TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_network ON alerts (network_id, created_at);

CREATE TABLE IF NOT EXISTS alert_confirmations (
    alert_id      INTEGER NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    reporter_hash TEXT NOT NULL,
    PRIMARY KEY (alert_id, reporter_hash)
);

-- Identificadores reportados (teléfonos, cuentas, enlaces, correos).
-- Se guarda el hash del valor normalizado para buscarlo y una versión
-- enmascarada para mostrarla.
CREATE TABLE IF NOT EXISTS reported_entities (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    kind       TEXT NOT NULL CHECK (kind IN ('telefono', 'cuenta', 'enlace', 'correo')),
    value_hash TEXT NOT NULL,
    masked     TEXT NOT NULL,
    domain     TEXT,
    category   TEXT,
    alert_id   INTEGER REFERENCES alerts (id) ON DELETE SET NULL,
    network_id TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entities_hash ON reported_entities (value_hash);
CREATE INDEX IF NOT EXISTS idx_entities_domain ON reported_entities (domain);

-- Registro anónimo de análisis: sólo metadatos para las tendencias, nunca
-- el contenido del mensaje.
CREATE TABLE IF NOT EXISTS analyses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    verdict    TEXT NOT NULL,
    score      INTEGER NOT NULL,
    category   TEXT NOT NULL,
    source     TEXT NOT NULL,
    engine     TEXT NOT NULL,
    network_id TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS merchants (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    business     TEXT NOT NULL,
    nit          TEXT,
    contact      TEXT,
    network_id   TEXT NOT NULL,
    community_id TEXT,
    status       TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente', 'verificado', 'rechazado')),
    created_at   TEXT NOT NULL,
    reviewed_at  TEXT,
    -- HMAC del código de acceso que se entrega al comercio al verificarlo
    access_code_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_merchants_code ON merchants (access_code_hash);

-- Chat del barrio: mensajes reales entre comercios y vecinos.
CREATE TABLE IF NOT EXISTS chat_messages (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    network_id    TEXT NOT NULL,
    community_id  TEXT NOT NULL,
    author        TEXT NOT NULL,
    merchant_id   INTEGER REFERENCES merchants (id) ON DELETE SET NULL,
    text          TEXT NOT NULL,
    risky_links   TEXT NOT NULL DEFAULT '[]',
    hidden        INTEGER NOT NULL DEFAULT 0,
    reporter_hash TEXT,
    created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_community ON chat_messages (community_id, created_at);

-- Imágenes de la cámara del comercio guardadas como evidencia de una alerta.
CREATE TABLE IF NOT EXISTS alert_evidence (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id    INTEGER NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    file        TEXT NOT NULL UNIQUE,
    captured_at TEXT NOT NULL
);

-- Suscripciones Web Push: avisos aunque la página esté cerrada.
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint     TEXT NOT NULL UNIQUE,
    p256dh       TEXT NOT NULL,
    auth         TEXT NOT NULL,
    network_id   TEXT NOT NULL,
    community_id TEXT,
    merchant_id  INTEGER REFERENCES merchants (id) ON DELETE CASCADE,
    created_at   TEXT NOT NULL
);

-- Modalidades de fraude del Centro de aprendizaje, con su reto.
CREATE TABLE IF NOT EXISTS modalities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    channel     TEXT NOT NULL,
    summary     TEXT NOT NULL,
    red_flags   TEXT NOT NULL,
    protect     TEXT NOT NULL,
    challenge   TEXT NOT NULL,
    origin      TEXT NOT NULL DEFAULT 'curada' CHECK (origin IN ('curada', 'comunidad-ia', 'comunidad')),
    reports     INTEGER NOT NULL DEFAULT 0,
    published   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL
);
"""


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def connect() -> sqlite3.Connection:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.database_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


@contextmanager
def session() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db() -> Iterator[sqlite3.Connection]:
    """Dependencia de FastAPI: una conexión por petición."""
    with session() as conn:
        yield conn


# Columnas añadidas después de la primera versión: se agregan a las bases ya creadas.
MIGRATIONS: tuple[tuple[str, str, str], ...] = (
    ("merchants", "access_code_hash", "TEXT"),
    ("alerts", "merchant_id", "INTEGER REFERENCES merchants (id) ON DELETE SET NULL"),
    # comercio afectado por la alerta (su cámara se muestra mientras dura)
    ("alerts", "affected_merchant_id", "INTEGER REFERENCES merchants (id) ON DELETE SET NULL"),
    # cámara del comercio: 'ninguna' | 'dispositivo' | 'ip'
    ("merchants", "camera_mode", "TEXT NOT NULL DEFAULT 'ninguna'"),
    ("merchants", "camera_enabled", "INTEGER NOT NULL DEFAULT 0"),
    # dirección de la cámara IP: nunca se envía al navegador
    ("merchants", "camera_url", "TEXT"),
    # 'pendiente' | 'aprobada' | 'rechazada' (la cámara IP la aprueba un moderador)
    ("merchants", "camera_url_status", "TEXT"),
    ("merchants", "camera_consent_at", "TEXT"),
)


def _migrate(conn: sqlite3.Connection) -> None:
    for table, column, definition in MIGRATIONS:
        columns = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
        if column not in columns:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def init_db() -> None:
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    with session() as conn:
        # Las tablas nuevas primero; luego las columnas nuevas de las tablas viejas
        # (el índice de access_code_hash necesita la columna, por eso se reintenta).
        try:
            conn.executescript(SCHEMA)
        except sqlite3.OperationalError:
            _migrate(conn)
            conn.executescript(SCHEMA)
        _migrate(conn)
        count = conn.execute("SELECT COUNT(*) FROM modalities").fetchone()[0]
        if count == 0:
            for item in SEED_MODALITIES:
                conn.execute(
                    """INSERT INTO modalities
                       (slug, title, category, channel, summary, red_flags, protect, challenge, origin, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'curada', ?)""",
                    (
                        item["slug"],
                        item["title"],
                        item["category"],
                        item["channel"],
                        item["summary"],
                        json.dumps(item["red_flags"], ensure_ascii=False),
                        json.dumps(item["protect"], ensure_ascii=False),
                        json.dumps(item["challenge"], ensure_ascii=False),
                        item.get("created_at", now_iso()),
                    ),
                )


def row_to_dict(row: sqlite3.Row, json_fields: tuple[str, ...] = ()) -> dict:
    data = dict(row)
    for key in json_fields:
        if data.get(key):
            data[key] = json.loads(data[key])
    return data
