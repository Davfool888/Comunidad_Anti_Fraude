"""Cámara del comercio afectado y notificaciones push."""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services import camera

MOD = {"X-Moderator-Token": "token-de-prueba"}
NET, COM = "kennedy", "kennedy-1"


def jpeg(color="red") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (80, 60), color).save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def make_merchant(client, name: str) -> tuple[int, dict]:
    created = client.post("/api/merchants", json={"name": name, "business": "Tienda", "network_id": NET, "community_id": COM}).json()
    code = client.patch(f"/api/moderation/merchants/{created['id']}", json={"status": "verificado"}, headers=MOD).json()["access_code"]
    return created["id"], {"X-Merchant-Code": code}


def test_device_camera_requires_consent(client):
    _, headers = make_merchant(client, "Tienda Consentimiento")
    denied = client.put("/api/merchants/me/camera", json={"mode": "dispositivo", "enabled": True}, headers=headers)
    assert denied.status_code == 422
    ok = client.put("/api/merchants/me/camera", json={"mode": "dispositivo", "enabled": True, "consent": True}, headers=headers)
    assert ok.json()["enabled"] is True
    assert client.get("/api/merchants/me", headers=headers).json()["camera"]["mode"] == "dispositivo"


def test_frames_need_device_mode_and_real_images(client):
    _, headers = make_merchant(client, "Tienda Sin Cámara")
    files = {"image": ("f.jpg", jpeg(), "image/jpeg")}
    assert client.post("/api/merchants/me/camera/frame", files=files, headers=headers).status_code == 409
    client.put("/api/merchants/me/camera", json={"mode": "dispositivo", "enabled": True, "consent": True}, headers=headers)
    fake = {"image": ("f.jpg", b"no soy imagen", "image/jpeg")}
    assert client.post("/api/merchants/me/camera/frame", files=fake, headers=headers).status_code == 415
    assert client.post("/api/merchants/me/camera/frame", files=files).status_code == 401


def test_alert_shows_affected_camera_and_saves_evidence(client):
    merchant_id, headers = make_merchant(client, "Droguería La 13")
    client.put("/api/merchants/me/camera", json={"mode": "dispositivo", "enabled": True, "consent": True}, headers=headers)
    assert client.post("/api/merchants/me/camera/frame", files={"image": ("f.jpg", jpeg(), "image/jpeg")}, headers=headers).status_code == 204

    alert = client.post(
        "/api/alerts",
        data={"network_id": NET, "community_id": COM, "title": "Robo en la caja", "description": "Dos hombres se llevaron la caja registradora", "level": "danger"},
        headers=headers,
    ).json()
    assert alert["affected_merchant"]["id"] == merchant_id
    assert alert["camera"]["available"] is True and alert["camera"]["online"] is True
    assert alert["camera"]["evidence"] == 1

    frame = client.get(f"/api/alerts/{alert['id']}/camera/frame")
    assert frame.status_code == 200 and frame.headers["content-type"] == "image/jpeg"
    evidence = client.get(f"/api/alerts/{alert['id']}/evidence").json()
    assert client.get(evidence[0]["url"]).status_code == 200

    listed = next(item for item in client.get("/api/alerts", params={"network_id": NET}).json() if item["id"] == alert["id"])
    assert listed["camera"]["available"] is True
    assert "camera_url" not in str(listed)


def test_neighbor_can_choose_affected_merchant(client):
    merchant_id, headers = make_merchant(client, "Panadería Afectada")
    client.put("/api/merchants/me/camera", json={"mode": "dispositivo", "enabled": True, "consent": True}, headers=headers)
    alert = client.post(
        "/api/alerts",
        data={"network_id": NET, "title": "Fraude con QR", "description": "Cambiaron el QR de la panadería", "affected_merchant_id": merchant_id},
    ).json()
    assert alert["affected_merchant"]["name"] == "Panadería Afectada"
    assert alert["merchant_verified"] is False  # quien reporta sigue siendo un vecino


def test_camera_window_expires(client):
    _, headers = make_merchant(client, "Tienda Ventana")
    client.put("/api/merchants/me/camera", json={"mode": "dispositivo", "enabled": True, "consent": True}, headers=headers)
    client.post("/api/merchants/me/camera/frame", files={"image": ("f.jpg", jpeg(), "image/jpeg")}, headers=headers)
    alert = client.post("/api/alerts", data={"network_id": NET, "title": "Hurto", "description": "Se llevaron mercancía del estante"}, headers=headers).json()
    from app.db import session

    with session() as conn:
        conn.execute("UPDATE alerts SET created_at = '2020-01-01T00:00:00+00:00' WHERE id = ?", (alert["id"],))
    assert client.get(f"/api/alerts/{alert['id']}/camera/frame").status_code == 410
    assert client.get(f"/api/alerts/{alert['id']}/camera").json()["camera"]["available"] is False


def test_ip_camera_is_validated_and_needs_approval(client, monkeypatch):
    merchant_id, headers = make_merchant(client, "Ferretería IP")
    blocked = client.put("/api/merchants/me/camera", json={"mode": "ip", "enabled": True, "consent": True, "url": "http://127.0.0.1:8000/api/status"}, headers=headers)
    assert blocked.status_code == 422
    with_password = client.put("/api/merchants/me/camera", json={"mode": "ip", "enabled": True, "consent": True, "url": "http://admin:1234@192.168.1.50/snap.jpg"}, headers=headers)
    assert with_password.status_code == 422

    pending = client.put("/api/merchants/me/camera", json={"mode": "ip", "enabled": True, "consent": True, "url": "http://192.168.1.50/snap.jpg"}, headers=headers).json()
    assert pending["ip_status"] == "pendiente"
    alert = client.post("/api/alerts", data={"network_id": NET, "title": "Intento de robo", "description": "Forcejearon la reja del local"}, headers=headers).json()
    assert alert["camera"]["available"] is False  # aún sin aprobar

    client.patch(f"/api/moderation/merchants/{merchant_id}/camera", json={"approved": True}, headers=MOD)
    monkeypatch.setattr(camera, "fetch_ip_frame", lambda url: jpeg("blue"))
    alert = client.post("/api/alerts", data={"network_id": NET, "title": "Robo", "description": "Robo a mano armada en el local"}, headers=headers).json()
    assert alert["camera"]["available"] is True
    assert client.get(f"/api/alerts/{alert['id']}/camera/frame").status_code == 200


def test_mjpeg_frame_extraction():
    data = jpeg()
    chunks = [b"--frame\r\nContent-Type: image/jpeg\r\n\r\n", data[:50], data[50:], b"\r\n--frame\r\n"]
    assert camera._jpeg_from_mjpeg(iter(chunks)) == data


def test_push_key_and_subscription(client):
    key = client.get("/api/push/key").json()["key"]
    assert len(key) > 60
    bad = client.post("/api/push/subscribe", json={"endpoint": "http://evil", "keys": {"p256dh": "x", "auth": "y"}, "network_id": NET})
    assert bad.status_code == 422
    ok = client.post(
        "/api/push/subscribe",
        json={"endpoint": "https://push.example/abc", "keys": {"p256dh": "x", "auth": "y"}, "network_id": NET, "community_id": COM},
    )
    assert ok.status_code == 201
    assert client.post("/api/push/unsubscribe", json={"endpoint": "https://push.example/abc"}).json()["ok"] is True
