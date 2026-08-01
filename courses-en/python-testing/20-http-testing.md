# 20. HTTP testing: responses, httpx, respx

## Intro: "an integration test hits the prod CDN"

Live HTTP in a unit test is **flaky** and **slow**. The **responses** (requests/httpx hook) and **respx** (httpx-native) libraries intercept HTTP at the socket level.

## What you'll learn

- **`responses`** for [`UserService`](examples/src/shop/users.py).
- **httpx** `MockTransport`.
- **Live tests** against [`deploy/python-async`](../../deploy/python-async/README.md) `:8095`.
- When integration should be **live** vs mock.

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

`@responses.activate` — the decorator is **mandatory**.

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

No patch — an explicit transport.

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

The stand:

```bash
cd deploy/python-async && docker compose up -d
```

---

## sequential vs parallel endpoint

The gateway exposes:

- `/aggregate` — sequential fan-out
- `/aggregate-parallel` — concurrent

An integration test can compare the **structure** (not timing in CI):

```python
@pytest.mark.integration
def test_aggregate_modes_match(live_base_url):
    seq = httpx.get(f"{live_base_url}/aggregate", timeout=30).json()
    par = httpx.get(f"{live_base_url}/aggregate-parallel", timeout=30).json()
    assert len(seq["results"]) == len(par["results"]) == 3
```

---

## Choosing a tool

| Tool | Client |
|------|--------|
| responses | requests, httpx sync |
| respx | httpx async/sync |
| MockTransport | httpx |
| inject MagicMock | any |

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| Live HTTP in unit | flaky | mock/responses |
| URL mismatch trailing slash | 404 | normalize base_url |
| forget @responses.activate | real network | decorator |
| assert timing in CI | flaky | assert structure only |

## Interview questions

- How to test HTTP **without** the network?
- Unit vs integration HTTP?

## Summary

responses/MockTransport for unit HTTP. live_base_url + marker for the gateway. Don't assert latency in CI — structure and status.

Next: [21-lab-http-mocks](21-lab-http-mocks.md).
