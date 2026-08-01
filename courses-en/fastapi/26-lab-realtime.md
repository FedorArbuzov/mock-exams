# 26. Lab: WebSocket and background tasks

## Lab goal

Add to the API in [`deploy/fastapi`](../../deploy/fastapi/README.md): a **WebSocket** endpoint `/ws/items` that broadcasts on item creation, an **SSE** endpoint `/api/v1/events/ping`, and a **BackgroundTasks** call that simulates a notification. Verify on port **8090**.

Theory: [24-lifespan-background](24-lifespan-background.md), [25-websockets-sse](25-websockets-sse.md).

---

## Before you start

```bash
cd deploy/fastapi
docker compose up -d --build
curl -s http://localhost:8090/health
```

Install a WS client (optional):

```bash
npm install -g wscat
# or: pip install websockets
```

---

## Task 1. ConnectionManager

`app/realtime/manager.py`:

```python
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self._connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self._connections:
            self._connections.remove(websocket)

    async def broadcast_json(self, data: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()
```

Register `manager` on `app.state` in **lifespan** ([24-lifespan-background](24-lifespan-background.md)):

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.ws_manager = manager
    yield
```

---

## Task 2. WebSocket endpoint

`app/routers/realtime.py`:

```python
import json
import time
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["realtime"])

@router.websocket("/ws/items")
async def items_ws(websocket: WebSocket, request: Request):
    mgr = request.app.state.ws_manager
    await mgr.connect(websocket)
    try:
        await websocket.send_json({"type": "connected", "ts": time.time()})
        while True:
            msg = await websocket.receive_text()
            await mgr.broadcast_json({"type": "message", "text": msg})
    except WebSocketDisconnect:
        mgr.disconnect(websocket)
```

Mount the router **without** the `/api/v1` prefix (WS at root):

```python
app.include_router(realtime.router)
```

Test:

```bash
wscat -c ws://localhost:8090/ws/items
# type: hello
```

**Expected result:** a `connected` message, then an echo broadcast `{"type":"message","text":"hello"}`.

---

## Task 3. Broadcast on item POST

```python
async def broadcast_item_created(request: Request, item: dict):
    mgr = request.app.state.ws_manager
    await mgr.broadcast_json({"type": "item.created", "item": item})

@router.post("/items", ...)
async def create_item(
    request: Request,
    background_tasks: BackgroundTasks,
    ...
):
    ...
    await db.commit()
    await db.refresh(item)
    out = ItemOut.model_validate(item)
    background_tasks.add_task(broadcast_item_created, request, out.model_dump())
    return out
```

Open two wscat terminals; in a third one:

```bash
curl -s -X POST http://localhost:8090/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"realtime test"}'
```

Both WS clients should receive `item.created`.

---

## Task 4. SSE ping stream

```python
import asyncio
from starlette.responses import StreamingResponse

@router.get("/events/ping")
async def sse_ping(request: Request):
    async def gen():
        n = 0
        while n < 10:
            if await request.is_disconnected():
                break
            n += 1
            yield f"data: {{\"ping\": {n}}}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

```bash
curl -sN "http://localhost:8090/api/v1/events/ping"
```

**Expected result:** ten `data: {"ping": N}` events, one second apart.

---

## Task 5. Logging the background task

Wrap `broadcast_item_created` in try/except with `logger.exception` — an empty WS list shouldn't break the POST request.

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| WS 403 / connection failed | use URL `ws://localhost:8090/ws/items`, not `wss` without TLS |
| POST 201, WS silent | `background_tasks` not added, or manager missing from `app.state` |
| SSE shows one line then drops | curl missing `-N`; check `is_disconnected` |
| Duplicate broadcasts | expected with multiple POSTs; verify there's only one manager |
| 401 on POST | you need a token from [21-lab-auth](21-lab-auth.md) |

```bash
docker compose logs -f api
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | WS connects and receives `connected` |
| 2 | Creating an item sends `item.created` to all WS clients |
| 3 | SSE delivers 10 events and finishes |
| 4 | Background task doesn't block the POST response |
| 5 | Disconnected clients are removed from the manager |

---

## Cleanup

Close wscat (`Ctrl+C`). No extra volumes need cleaning up.

## Self-check questions

1. Why broadcast via BackgroundTasks instead of before the `return`?
2. What breaks with two uvicorn workers and no Redis?
3. What `proxy_read_timeout` does nginx need for SSE?

Next: [27-async-patterns](27-async-patterns.md).
