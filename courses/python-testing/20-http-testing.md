# 20. HTTP testing: responses, httpx, respx

## Введение: «integration test бьёт в prod CDN»

Live HTTP в unit — **flaky** и **медленный**. Библиотеки **responses** (requests/httpx hook) и **respx** (httpx-native) перехватывают HTTP на уровне socket.

## Что вы узнаете

- **`responses`** для [`UserService`](examples/src/shop/users.py).
- **httpx** `MockTransport`.
- **Live tests** против [`deploy/python-async`](../../deploy/python-async/README.md) `:8095`.
- Когда integration **live** vs mock.

---

## responses (sync httpx)

```python
import responses
import httpx
from shop.users import UserService


@responses.activate
def test_get_user_responses():
    responses.add(
        responses.GET,
        "http://api.test/users/1",
        json={"id": 1, "email": "a@b.c", "active": True},
        status=200,
    )
    svc = UserService("http://api.test")
    user = svc.get_user(1)
    assert user.email == "a@b.c"
```

`@responses.activate` — декоратор **обязателен**.

---

## MockTransport (httpx)

```python
import httpx


def test_mock_transport():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"id": 1, "email": "x@y.z", "active": True})

    transport = httpx.MockTransport(handler)
    client = httpx.Client(transport=transport, base_url="http://api.test")
    svc = UserService("http://api.test", client=client)
    user = svc.get_user(1)
    assert user.id == 1
```

Без patch — явный transport.

---

## Live integration

```python
import httpx
import pytest


@pytest.mark.integration
def test_gateway_json(live_base_url):
    r = httpx.get(f"{live_base_url}/json", params={"size": 3}, timeout=5.0)
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
```

Стенд:

```bash
cd deploy/python-async && docker compose up -d
```

---

## sequential vs parallel endpoint

Gateway exposes:

- `/aggregate` — sequential fan-out
- `/aggregate-parallel` — concurrent

Integration test может сравнить **structure** (not timing in CI):

```python
@pytest.mark.integration
def test_aggregate_modes_match(live_base_url):
    seq = httpx.get(f"{live_base_url}/aggregate", timeout=30).json()
    par = httpx.get(f"{live_base_url}/aggregate-parallel", timeout=30).json()
    assert len(seq["results"]) == len(par["results"]) == 3
```

---

## Выбор инструмента

| Tool | Client |
|------|--------|
| responses | requests, httpx sync |
| respx | httpx async/sync |
| MockTransport | httpx |
| inject MagicMock | any |

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| Live HTTP in unit | flaky | mock/responses |
| URL mismatch trailing slash | 404 | normalize base_url |
| forget @responses.activate | real network | decorator |
| assert timing in CI | flaky | assert structure only |

## На собеседовании

- Как тестировать HTTP **без** network?
- Unit vs integration HTTP?

## Резюме

responses/MockTransport для unit HTTP. live_base_url + marker для gateway. Не assert latency в CI — structure и status.

Далее: [21-lab-http-mocks](21-lab-http-mocks.md).
