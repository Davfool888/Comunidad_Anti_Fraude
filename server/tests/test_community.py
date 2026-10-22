"""Red comunitaria: comercios verificados, chat real, confirmaciones y estadísticas."""

from __future__ import annotations

import sqlite3

import pytest
from fastapi.testclient import TestClient

from app.db import _migrate
from app.main import app

MOD = {"X-Moderator-Token": "token-de-prueba"}
NET, COM = "usaquen", "usaquen-1"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def merchant_code(client):
    created = client.post(
        "/api/merchants",
        json={"name": "Panadería La Espiga", "business": "Panadería", "network_id": NET, "community_id": COM},
    ).json()
    approved = client.patch(f"/api/moderation/merchants/{created['id']}", json={"status": "verificado"}, headers=MOD).json()
    assert approved["access_code"].startswith("RS-")
    assert "access_code_hash" not in approved
    return approved["access_code"]


def test_merchant_session(client, merchant_code):
    ok = client.post("/api/merchants/session", json={"code": merchant_code.lower().replace("-", " ")})
    assert ok.status_code == 200
    assert ok.json()["name"] == "Panadería La Espiga"
    assert client.post("/api/merchants/session", json={"code": "RS-AAAA-AAAA"}).status_code == 401


def test_alert_name_comes_only_from_code(client, merchant_code):
    data = {"network_id": NET, "community_id": COM, "title": "Billete falso", "description": "Pagaron con un billete de 50 mil falso"}
    verified = client.post("/api/alerts", data=data, headers={"X-Merchant-Code": merchant_code}).json()
    assert verified["merchant_verified"] is True
    assert verified["business_name"] == "Panadería La Espiga"

    # sin código no se puede firmar como un comercio, aunque se envíe el nombre
    anon = client.post("/api/alerts", data={**data, "business_name": "Panadería La Espiga"}).json()
    assert anon["merchant_verified"] is False
    assert anon["business_name"] is None


def test_confirmations_are_remembered(client):
    alert = client.post(
        "/api/alerts", data={"network_id": NET, "title": "Llamadas raras", "description": "Llaman pidiendo datos del local"}
    ).json()
    assert alert["confirmed_by_me"] is False
    first = client.post(f"/api/alerts/{alert['id']}/confirm").json()
    second = client.post(f"/api/alerts/{alert['id']}/confirm").json()
    assert first["confirmations"] == second["confirmations"] == 1
    listed = next(item for item in client.get("/api/alerts", params={"network_id": NET}).json() if item["id"] == alert["id"])
    assert listed["confirmed_by_me"] is True


def test_chat_flow(client, merchant_code):
    post = lambda body, **kw: client.post("/api/chat", json={"network_id": NET, "community_id": COM, **body}, **kw)  # noqa: E731

    neighbor = post({"author": "Doña Marta", "text": "Buenos días, ¿alguien recibió llamadas de Nequi hoy?"})
    assert neighbor.status_code == 201
    assert neighbor.json()["verified"] is False

    fake_network = post({"author": "Red Segura - Soporte", "text": "Hola"}).json()
    assert fake_network["author"] == "Vecino"

    shop = post({"author": "otro nombre", "text": "Sí, colgué"}, headers={"X-Merchant-Code": merchant_code}).json()
    assert shop["verified"] is True and shop["author"] == "Panadería La Espiga"

    phishing = post({"text": "Reclamen el bono en https://nequi-bonos.xyz/registro y mi cédula 1.020.304.050"}).json()
    assert phishing["risky_links"][0]["domain"] == "nequi-bonos.xyz"
    assert "[documento oculto]" in phishing["text"]

    messages = client.get("/api/chat", params={"community_id": COM}).json()
    assert [m["id"] for m in messages][-1] == phishing["id"]

    hidden = client.patch(f"/api/moderation/chat/{phishing['id']}", json={"hidden": True}, headers=MOD)
    assert hidden.status_code == 200
    assert all(m["id"] != phishing["id"] for m in client.get("/api/chat", params={"community_id": COM}).json())


def test_rejecting_merchant_revokes_code(client):
    created = client.post(
        "/api/merchants", json={"name": "Farmacia Prueba", "business": "Farmacia", "network_id": NET}
    ).json()
    code = client.patch(f"/api/moderation/merchants/{created['id']}", json={"status": "verificado"}, headers=MOD).json()["access_code"]
    assert client.post("/api/merchants/session", json={"code": code}).status_code == 200
    client.patch(f"/api/moderation/merchants/{created['id']}", json={"status": "rechazado"}, headers=MOD)
    assert client.post("/api/merchants/session", json={"code": code}).status_code == 401


def test_community_stats(client, merchant_code):
    stats = client.get("/api/stats/community", params={"network_id": NET, "community_id": COM}).json()
    assert stats["alerts"] >= 2
    assert stats["verified_merchants"] >= 1
    assert stats["confirmations"] >= 1


def test_migration_adds_new_columns_to_old_databases():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("CREATE TABLE merchants (id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("CREATE TABLE alerts (id INTEGER PRIMARY KEY, title TEXT)")
    _migrate(conn)
    assert "access_code_hash" in {row["name"] for row in conn.execute("PRAGMA table_info(merchants)")}
    assert "merchant_id" in {row["name"] for row in conn.execute("PRAGMA table_info(alerts)")}
