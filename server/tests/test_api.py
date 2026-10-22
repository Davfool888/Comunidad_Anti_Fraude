"""Pruebas del backend con el motor local (sin llamar a la IA ni a internet)."""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services import links

MOD = {"X-Moderator-Token": "token-de-prueba"}


@pytest.fixture(autouse=True)
def no_rdap(monkeypatch):
    monkeypatch.setattr(links, "domain_age_days", lambda _domain: None)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_status_local_engine(client):
    data = client.get("/api/status").json()
    assert data["ai_enabled"] is False


def test_otp_request_is_fraud(client):
    response = client.post(
        "/api/analyze",
        data={"text": "Hola, soy asesor del banco. Por favor pásame el código que te llegó por SMS, es urgente"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "fraude"
    assert data["engine"] == "local"
    assert data["category"] in {"codigo_otp", "suplantacion_entidad"}


def test_clean_message(client):
    data = client.post(
        "/api/analyze", data={"text": "Buenos días, ¿a qué hora abren la panadería mañana domingo?"}
    ).json()
    assert data["verdict"] == "limpio"


def test_impersonating_link(client):
    data = client.post(
        "/api/analyze",
        data={"text": "Su cuenta será bloqueada. Valide sus datos en https://bancolombia-seguridad.xyz/login"},
    ).json()
    assert data["verdict"] == "fraude"
    link = data["links"][0]
    assert link["risk"] == "alto"
    assert link["impersonates"] == "Bancolombia"


def test_official_link_is_safe(client):
    data = client.get("/api/links/check", params={"url": "https://www.bancolombia.com/personas"}).json()
    assert data["risk"] == "bajo"
    assert data["official"] == "Bancolombia"


def test_lookalike_domain(client):
    data = client.get("/api/links/check", params={"url": "http://nequl.com.co/premio"}).json()
    assert data["risk"] == "alto"


def test_image_requests_client_ocr(client):
    buffer = io.BytesIO()
    Image.new("RGB", (40, 40), "white").save(buffer, format="PNG")
    response = client.post(
        "/api/analyze",
        data={"text": ""},
        files=[("files", ("captura.png", buffer.getvalue(), "image/png"))],
    )
    assert response.status_code == 200
    assert response.json()["client_ocr_requested"] is True


def test_rejects_fake_image(client):
    response = client.post(
        "/api/analyze",
        data={"text": "mira"},
        files=[("files", ("captura.png", b"no soy una imagen", "image/png"))],
    )
    assert response.status_code == 415


def test_alert_flow_and_community_lookup(client):
    created = client.post(
        "/api/alerts",
        data={
            "network_id": "chapinero",
            "community_id": "chapinero-1",
            "title": "Llamada pidiendo código",
            "description": "Llamaron del 3001234567 diciendo ser de Nequi. Mi cédula 1.020.304.050 la pidieron.",
            "identifiers": "3001234567",
            "category": "codigo_otp",
            "level": "danger",
        },
    )
    assert created.status_code == 201
    alert = created.json()
    assert "[documento oculto]" in alert["description"]
    assert alert["entities"][0]["masked"] == "300 *** 4567"

    lookup = client.get("/api/reports/lookup", params={"value": "300 123 4567"}).json()
    assert lookup["results"][0]["reports"] >= 1

    analysis = client.post("/api/analyze", data={"text": "Me escribió el 300-123-4567 para un pago"}).json()
    assert any(signal["id"].startswith("reportado-") for signal in analysis["signals"])

    # rechazarla retira el número de la base de reportes
    review = client.patch(f"/api/moderation/alerts/{alert['id']}", json={"status": "rechazada"}, headers=MOD)
    assert review.status_code == 200
    lookup = client.get("/api/reports/lookup", params={"value": "3001234567"}).json()
    assert lookup["results"][0]["reports"] == 0
    assert all(item["id"] != alert["id"] for item in client.get("/api/alerts").json())


def test_alert_image_strips_metadata_and_weapon_sets_danger(client):
    buffer = io.BytesIO()
    image = Image.new("RGB", (64, 64), "gray")
    exif = image.getexif()
    exif[0x0131] = "Photoshop"  # Software
    image.save(buffer, format="JPEG", exif=exif)
    response = client.post(
        "/api/alerts",
        data={
            "network_id": "chapinero",
            "title": "Hombre con cuchillo",
            "description": "Un hombre amenazó al cajero con un cuchillo en la tienda",
            "level": "warning",
            "category": "hurto_violento",
            "client_threats": '{"items": [{"label": "cuchillo", "confidence": "alta"}], "summary": "cuchillo"}',
        },
        files={"image": ("foto.jpg", buffer.getvalue(), "image/jpeg")},
    )
    assert response.status_code == 201
    alert = response.json()
    assert alert["level"] == "danger"
    served = client.get(alert["image_url"])
    assert served.status_code == 200
    assert Image.open(io.BytesIO(served.content)).getexif().get(0x0131) is None


def test_upload_path_traversal_blocked(client):
    assert client.get("/api/uploads/..%2Fred_segura.db").status_code == 404


def test_moderation_requires_token(client):
    assert client.get("/api/moderation/alerts").status_code == 401
    assert client.get("/api/moderation/alerts", headers={"X-Moderator-Token": "malo"}).status_code == 401
    assert client.get("/api/moderation/alerts", headers=MOD).status_code == 200


def test_modalities_seeded_and_generated(client):
    seeded = client.get("/api/education/modalities").json()
    assert len(seeded) >= 10
    for _ in range(2):
        client.post(
            "/api/alerts",
            data={
                "network_id": "suba",
                "title": "QR cambiado en la caja",
                "description": "Pegaron un QR encima del nuestro y los pagos no llegaron",
                "category": "qr_fraudulento",
            },
        )
    result = client.post("/api/moderation/modalities/generate", headers=MOD).json()
    assert any(item["category"] == "qr_fraudulento" for item in result["created"])


def test_trends(client):
    data = client.get("/api/stats/trends").json()
    assert data["by_category"]
    assert "fraude" in data["verdicts"]


@pytest.mark.parametrize(
    ("question", "expected"),
    [
        ("¿Qué puedes hacer?", "Puedo ayudarle"),
        ("hola", "Soy el asistente"),
        ("¿Qué es el SIM swap?", "SIM"),
        ("¿Cómo me protejo del phishing?", "phishing"),
        ("¿Dónde denuncio una estafa?", "adenunciar"),
        ("Ya le di el código a un señor que me llamó", "línea oficial"),
        ("¿Cuál es la receta del ajiaco?", "sólo puedo ayudarle"),
    ],
)
def test_local_conversation(client, question, expected):
    data = client.post("/api/analyze", data={"text": question}).json()
    assert data["intent"] == "conversacion", data
    assert expected.lower() in data["reply"].lower()


def test_questions_with_risk_are_still_analyzed(client):
    data = client.post(
        "/api/analyze", data={"text": "¿Es normal que el banco me pida el código de verificación por WhatsApp?"}
    ).json()
    assert data["intent"] == "analisis"
    assert data["verdict"] != "limpio"


def test_status_reports_provider(client):
    data = client.get("/api/status").json()
    assert data["provider"] == "local"


@pytest.mark.parametrize(
    "text",
    [
        "Me escribieron de Nequi pidiendo el código que me llegó por SMS",
        "Me llamaron del banco y me preguntaron la clave",
        "Un señor me está solicitando el código que me llegó al celular",
    ],
)
def test_code_requests_are_flagged(client, text):
    data = client.post("/api/analyze", data={"text": text}).json()
    assert data["intent"] == "analisis"
    assert data["verdict"] == "fraude", data["signals"]
