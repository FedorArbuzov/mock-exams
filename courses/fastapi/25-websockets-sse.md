# 25. WebSockets и Server-Sent Events (SSE)

## Введение: «опрос раз в секунду убил API»

Дашборд опрашивал `GET /notifications` каждую секунду — 10k вкладок → 10k RPS на пустые ответы. **Push** снимает нагрузку: **WebSocket** — двусторонний канал; **SSE** — односторонний поток от сервера по обычному HTTP. FastAPI (Starlette) поддерживает оба без отдельного сервера.

Для edge proxy и таймаутов long-lived соединений см. [`nginx-basic`](../nginx-basic/08-upstream.md) (`proxy_read_timeout`).

## Что вы узнаете

- **WebSocket** endpoint: connect, send, disconnect.
- **StreamingResponse** с `text/event-stream` для SSE.
- Аутентификация realtime-каналов.
- Когда выбрать WS vs SSE vs polling.

---

## WebSocket в FastAPI

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

| Метод | Назначение |
|-------|------------|
| `await ws.accept()` | handshake 101 Switching Protocols |
| `receive_text` / `receive_json` | чтение от клиента |
| `send_text` / `send_json` | отправка |
| `WebSocketDisconnect` | клиент закрыл вкладку |

Подключение с хоста (после лабы [26-lab-realtime](26-lab-realtime.md)):

```bash
# websocat / wscat
wscat -c ws://localhost:8090/ws/chat
```

---

## Аутентификация WebSocket

Bearer в заголовке при handshake:

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

| Подход | Плюсы / минусы |
|--------|----------------|
| Query `?token=` | просто; токен в access logs — осторожно |
| Cookie (HttpOnly) | меньше утечки в URL; нужен same-site |
| Первое сообщение auth | сложнее протокол |

Не логируйте полный token в nginx ([22-security-checklist](22-security-checklist.md)).

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
            "X-Accel-Buffering": "no",  # nginx: не буферизовать
        },
    )
```

Клиент (браузер):

```javascript
const es = new EventSource("http://localhost:8090/api/v1/events");
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

| Поле SSE | Смысл |
|----------|--------|
| `data:` | тело события |
| `event:` | тип (опционально) |
| `id:` | last-event-id для reconnect |
| пустая строка | конец события |

---

## WebSocket vs SSE vs polling

| | WebSocket | SSE | Long polling |
|---|-----------|-----|--------------|
| Направление | двустороннее | сервер → клиент | запрос-ответ |
| Протокол | WS | HTTP | HTTP |
| Прокси/firewall | иногда сложнее | проще | простейший |
| Бинарные данные | да | нет (текст) | да |
| Авто-reconnect | вручную | встроено в EventSource | N/A |

**SSE** — ленты статусов, прогресс, уведомления. **WebSocket** — чат, игры, collaborative edit.

---

## Масштабирование (preview)

In-memory `ConnectionManager` работает на **одном** процессе. Несколько replicas:

- **Redis Pub/Sub** — broadcast между инстансами ([28-redis-cache](28-redis-cache.md)).
- Sticky sessions на nginx — костыль, не стратегия.

```python
# псевдокод
async def on_message(channel, message):
    await manager.broadcast_local(message)
```

---

## На стенде

```bash
curl -sN http://localhost:8090/api/v1/events | head -5
```

`-N` отключает буферизацию curl. OpenAPI не документирует WS так же богато, как REST — тестируйте wscat/EventSource.

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Нет `is_disconnected()` в SSE | goroutine leak | break loop |
| nginx буферизует SSE | клиент видит задержку | `X-Accel-Buffering: no` |
| Блокирующий код в WS loop | все клиенты зависают | await only |
| Глобальный list WS без limit | memory DoS | max connections, auth |

---

## Резюме

**WebSocket** — интерактивный duplex; **SSE** — простой push по HTTP. Оба требуют корректных **таймаутов proxy** и **auth** на handshake. Для multi-instance — Redis pub/sub. Практика — [26-lab-realtime](26-lab-realtime.md).

## Чек-лист

- Когда SSE предпочтительнее WebSocket?
- Зачем `X-Accel-Buffering: no`?
- Как передать JWT в WebSocket безопаснее query?

Далее: [26-lab-realtime](26-lab-realtime.md).
