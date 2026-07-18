from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from shop.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_ping_queues_task():
    mock = MagicMock(id="test-task-id")
    with patch("shop.main.ping.delay", return_value=mock):
        r = client.post("/tasks/ping/")
    assert r.status_code == 200
    assert r.json()["task_id"] == "test-task-id"
