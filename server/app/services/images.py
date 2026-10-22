"""Tratamiento seguro de imágenes subidas.

- Se valida que el archivo sea realmente una imagen (no basta la extensión).
- Antes de borrar los metadatos se leen las pistas de edición (campo
  «Software» del EXIF): sirven para detectar comprobantes retocados.
- Se vuelve a codificar sin EXIF, así no se publica la ubicación GPS ni el
  modelo del teléfono de quien reporta.
"""

from __future__ import annotations

import base64
import io
from dataclasses import dataclass, field

from PIL import ExifTags, Image, UnidentifiedImageError

EDITING_SOFTWARE = (
    "photoshop", "picsart", "snapseed", "canva", "gimp", "lightroom", "pixlr", "facetune", "fotor", "polarr",
)
MAX_SIDE = 1600


class InvalidImage(ValueError):
    pass


@dataclass
class CleanImage:
    data: bytes
    media_type: str
    width: int
    height: int
    editing_hints: list[str] = field(default_factory=list)

    @property
    def b64(self) -> str:
        return base64.standard_b64encode(self.data).decode("ascii")


def _editing_hints(image: Image.Image) -> list[str]:
    hints: list[str] = []
    try:
        exif = image.getexif()
    except Exception:  # noqa: BLE001 - un EXIF corrupto no debe tumbar el análisis
        return hints
    tags = {ExifTags.TAGS.get(key, key): value for key, value in exif.items()}
    software = str(tags.get("Software", "")).lower()
    for name in EDITING_SOFTWARE:
        if name in software:
            hints.append(f"La imagen fue procesada con {name.title()}.")
    if tags.get("DateTime") and tags.get("DateTimeOriginal") and tags["DateTime"] != tags["DateTimeOriginal"]:
        hints.append("La imagen se modificó después de ser capturada.")
    return hints


def sanitize_image(raw: bytes) -> CleanImage:
    try:
        image = Image.open(io.BytesIO(raw))
        image.verify()
        image = Image.open(io.BytesIO(raw))
    except (UnidentifiedImageError, OSError, SyntaxError) as error:
        raise InvalidImage("El archivo no es una imagen válida.") from error

    hints = _editing_hints(image)

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    image.thumbnail((MAX_SIDE, MAX_SIDE))

    output = io.BytesIO()
    image.save(output, format="JPEG", quality=88, optimize=True)  # sin exif=…: se descartan los metadatos
    return CleanImage(output.getvalue(), "image/jpeg", image.width, image.height, hints)
