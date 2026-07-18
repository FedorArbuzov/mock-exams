# 26. Лаба: WebSocket и фоновые задачи

## Цель лабы

Добавить в API на [`deploy/fastapi`](../../deploy/fastapi/README.md): **WebSocket** `/ws/items` с broadcast при создании item, **SSE** `/api/v1/events/ping`, **BackgroundTasks** для имитации уведомления. Проверка на порту **8090**.

Теория: [24-lifespan-background](24-lifespan-background.md), [25-websockets-sse](25-websockets-sse.md).

---

## Предварительно

```bash
cd deploy/fastapi
docker compose up -d --build
curl -s http://localhost:8090/health
```

Установите клиент WS (опционально):

```bash
npm install -g wscat
# или: pip install websockets
```

---

## Задание 1. ConnectionManager

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

Зарегистрируйте `manager` в `app.state` в **lifespan** ([24-lifespan-background](24-lifespan-background.md)):

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.ws_manager = manager
    yield
```

---

## Задание 2. WebSocket endpoint

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

Подключите роутер **без** prefix `/api/v1` (WS на корне):

```python
app.include_router(realtime.router)
```

Тест:

```bash
wscat -c ws://localhost:8090/ws/items
# введите: hello
```

**Что увидите:** `connected` и echo broadcast `{"type":"message","text":"hello"}`.

---

## Задание 3. Broadcast при POST item

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

Откройте два терминала wscat; в третьем:

```bash
curl -s -X POST http://localhost:8090/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"realtime test"}'
```

Оба WS-клиента должны получить `item.created`.

---

## Задание 4. SSE ping stream

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

**Что увидите:** десять событий `data: {"ping": N}` с интервалом 1 с.

---

## Задание 5. Логирование фоновой задачи

Оберните `broadcast_item_created` в try/except с `logger.exception` — пустой WS не должен ломать POST.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| WS 403 / connection failed | URL `ws://localhost:8090/ws/items`, не `wss` без TLS |
| POST 201, WS молчит | `background_tasks` не добавлен; manager не в `app.state` |
| SSE одна строка и обрыв | curl без `-N`; проверьте `is_disconnected` |
| Дубликаты broadcast | несколько POST — ожидаемо; проверьте один manager |
| 401 на POST | нужен token из [21-lab-auth](21-lab-auth.md) |

```bash
docker compose logs -f api
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | WS подключается и получает `connected` |
| 2 | Создание item шлёт `item.created` всем WS |
| 3 | SSE отдаёт 10 событий и завершается |
| 4 | Background task не блокирует ответ POST |
| 5 | Отключившийся клиент удаляется из manager |

---

## Уборка

Закройте wscat (`Ctrl+C`). Дополнительных volume не требуется.

## Вопросы для самопроверки

1. Почему broadcast через BackgroundTasks, а не до `return`?
2. Что сломается при двух uvicorn workers без Redis?
3. Какой `proxy_read_timeout` нужен nginx для SSE?

Далее: [27-async-patterns](27-async-patterns.md).
