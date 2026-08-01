# 25. WebSockets and Server-Sent Events (SSE)

## Introduction: "polling once a second killed the API"

A dashboard polled `GET /notifications` every second — 10k tabs meant 10k RPS for mostly empty responses. **Push** takes that load away: **WebSocket** is a bidirectional channel; **SSE** is a one-way stream from the server over plain HTTP. FastAPI (Starlette) supports both without a separate server.

For edge proxy configuration and timeouts on long-lived connections, see [`nginx-basic`](../nginx-basic/08-upstream.md) (`proxy_read_timeout`).

## What you'll learn

- **WebSocket** endpoints: connect, send, disconnect.
- **StreamingResponse** with `text/event-stream` for SSE.
- Authenticating realtime channels.
- When to pick WS vs SSE vs polling.

---

## WebSocket in FastAPI

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: str):
        for ws in self.active:
            await ws.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/chat")
async def chat(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(f"echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(ws)
```

| Method | Purpose |
|-------|------------|
| `await ws.accept()` | 101 Switching Protocols handshake |
| `receive_text` / `receive_json` | read from the client |
| `send_text` / `send_json` | send to the client |
| `WebSocketDisconnect` | client closed the tab |

Connecting from the host (after the lab in [26-lab-realtime](26-lab-realtime.md)):

```bash
# websocat / wscat
wscat -c ws://localhost:8090/ws/chat
```

---

## WebSocket authentication

Bearer token in the handshake:

```python
@router.websocket("/ws/notifications")
async def notifications(ws: WebSocket, token: str = Query(...)):
    try:
        payload = decode_token(token, settings.JWT_SECRET)
    except JWTError:
        await ws.close(code=1008)
        return
    await ws.accept()
    ...
```

| Approach | Pros / cons |
|--------|----------------|
| Query `?token=` | simple; token ends up in access logs — be careful |
| Cookie (HttpOnly) | less exposure in the URL; needs same-site |
| First-message auth | more complex protocol |

Don't log the full token in nginx ([22-security-checklist](22-security-checklist.md)).

---

## SSE: StreamingResponse

```python
import asyncio
import json
from fastapi import Request
from starlette.responses import StreamingResponse

async def event_generator(request: Request):
    counter = 0
    while True:
        if await request.is_disconnected():
            break
        counter += 1
        payload = json.dumps({"count": counter, "ts": time.time()})
        yield f"data: {payload}\n\n"
        await asyncio.sleep(1)

@router.get("/events")
async def sse(request: Request):
    return StreamingResponse(
        event_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # nginx: don't buffer
        },
    )
```

Client (browser):

```javascript
const es = new EventSource("http://localhost:8090/api/v1/events");
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

| SSE field | Meaning |
|----------|--------|
| `data:` | event body |
| `event:` | type (optional) |
| `id:` | last-event-id for reconnect |
| blank line | end of event |

---

## WebSocket vs SSE vs polling

| | WebSocket | SSE | Long polling |
|---|-----------|-----|--------------|
| Direction | bidirectional | server → client | request-response |
| Protocol | WS | HTTP | HTTP |
| Proxy/firewall | sometimes trickier | easier | easiest |
| Binary data | yes | no (text only) | yes |
| Auto-reconnect | manual | built into EventSource | N/A |

**SSE** — status feeds, progress, notifications. **WebSocket** — chat, games, collaborative editing.

---

## Scaling (preview)

An in-memory `ConnectionManager` only works within a **single** process. With multiple replicas you need:

- **Redis Pub/Sub** — broadcast across instances ([28-redis-cache](28-redis-cache.md)).
- Sticky sessions on nginx — a workaround, not a real strategy.

```python
# pseudocode
async def on_message(channel, message):
    await manager.broadcast_local(message)
```

---

## On the test stand

```bash
curl -sN http://localhost:8090/api/v1/events | head -5
```

`-N` disables curl's buffering. OpenAPI doesn't document WS as richly as REST — test with wscat/EventSource instead.

---

## Common mistakes

| Mistake | Consequence | Fix |
|--------|-------------|---------|
| No `is_disconnected()` check in SSE | goroutine leak | break the loop |
| nginx buffers SSE | client sees delayed events | `X-Accel-Buffering: no` |
| Blocking code in the WS loop | all clients hang | await only |
| Global WS list with no limit | memory DoS | max connections, auth |

---

## Summary

**WebSocket** is interactive full duplex; **SSE** is a simple HTTP-based push. Both need correct **proxy timeouts** and **auth** at handshake time. For multi-instance setups, use Redis pub/sub. Hands-on practice: [26-lab-realtime](26-lab-realtime.md).

## Checklist

- When is SSE preferable to WebSocket?
- Why `X-Accel-Buffering: no`?
- How do you pass a JWT to a WebSocket more safely than via a query string?

Next: [26-lab-realtime](26-lab-realtime.md).
