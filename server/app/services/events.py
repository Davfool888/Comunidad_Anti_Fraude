"""Difusión de alertas en tiempo real (Server-Sent Events).

Cada cliente conectado a `/api/alerts/stream` recibe una cola; publicar una
alerta la copia en todas las colas. Es suficiente para un solo proceso; con
varios procesos se sustituiría por Redis pub/sub.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any


class Broadcaster:
    def __init__(self) -> None:
        self._queues: set[asyncio.Queue[str]] = set()

    def subscribe(self) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=100)
        self._queues.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[str]) -> None:
        self._queues.discard(queue)

    def publish(self, event: str, data: dict[str, Any]) -> None:
        message = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        for queue in list(self._queues):
            try:
                queue.put_nowait(message)
            except asyncio.QueueFull:
                # cliente lento: se descarta para no bloquear a los demás
                self._queues.discard(queue)

    @property
    def listeners(self) -> int:
        return len(self._queues)


broadcaster = Broadcaster()
