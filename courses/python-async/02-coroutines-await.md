# 02. Корутины, await и async def

## Введение: «функция есть, но return не срабатывает»

Junior добавил `async def fetch_user()` и вызвал `fetch_user()` из sync-кода — получил `<coroutine object fetch_user at 0x...>` и warning **«coroutine was never awaited»**. В логах — пусто, пользователи не созданы. Проблема не в бизнес-логике, а в том, что **корутина — не обычная функция**: её нужно **запланировать** и **await**-нуть внутри running event loop.

Эта глава разбирает **coroutine object**, **`async def`**, **`await`**, **`asyncio.run()`** — минимальный набор до [04-event-loop](04-event-loop.md) и первой лабы [03-lab-first-async](03-lab-first-async.md).

## Что вы узнаете

- Что возвращает `async def` и чем это отличается от `def`.
- Правила **`await`**: где можно, где нельзя.
- Как запустить корутину через **`asyncio.run()`**.
- Разницу **coroutine**, **Task**, **Future** (обзор).

---

## async def создаёт корутину

```python
import asyncio

async def greet(name: str) -> str:
    await asyncio.sleep(0.1)  # отдаём управление loop
    return f"Hello, {name}"

# Вызов БЕЗ await — coroutine object, не результат!
coro = greet("World")
print(type(coro))  # <class 'coroutine'>

async def main():
    result = await greet("World")  # здесь await обязателен
    print(result)

asyncio.run(main())  # Hello, World
```

| Конструкция | Что происходит |
|-------------|----------------|
| `def f()` | вызов → сразу выполнение → return |
| `async def f()` | вызов → **coroutine object** (ещё не выполнена) |
| `await f()` | приостановка текущей корутины, выполнение `f`, возобновление |

```mermaid
sequenceDiagram
  participant Main as main()
  participant Loop as Event loop
  participant G as greet()
  Main->>Loop: await greet()
  Loop->>G: start greet
  G->>Loop: await sleep(0.1)
  Note over G: приостановлена
  Loop->>G: resume after 0.1s
  G-->>Main: "Hello, World"
```

---

## await — точка cooperativной отдачи control

**`await`** можно использовать **только внутри** `async def` (и в REPL с asyncio mode). **`await`** ожидает **awaitable**: coroutine, Task, Future.

```python
import asyncio

async def step_a():
    print("A start")
    await asyncio.sleep(0.05)
    print("A end")

async def step_b():
    print("B start")
    await asyncio.sleep(0.05)
    print("B end")

async def pipeline():
    await step_a()  # последовательно: ~100ms
    await step_b()

async def parallel():
    await asyncio.gather(step_a(), step_b())  # параллельно: ~50ms
```

Параллельный запуск — [05-tasks-taskgroup](05-tasks-taskgroup.md), [09-gather-vs-taskgroup](09-gather-vs-taskgroup.md).

---

## asyncio.run — entry point для скриптов

```python
import asyncio

async def main():
    print("inside coroutine")

if __name__ == "__main__":
    asyncio.run(main())  # создаёт loop, run main(), закрывает loop
```

| `asyncio.run(coro)` | Поведение |
|---------------------|-----------|
| Python 3.7+ | рекомендуемый способ для CLI/скриптов |
| Внутри | `asyncio.new_event_loop()` → `run_until_complete` → cleanup |
| Вложенный вызов | **ошибка** — только один `run` на thread |

**В FastAPI/uvicorn** вы **не** вызываете `asyncio.run` — loop уже running; endpoints — корутины, которые framework await-ит.

---

## Coroutine vs Task vs Future

| Тип | Описание | Создание |
|-----|----------|----------|
| **Coroutine** | результат `async def`; «рецепт» работы | `async def f()` → `f()` |
| **Task** | coroutine, **запланированная** на loop | `asyncio.create_task(coro)` |
| **Future** | низкоуровневый placeholder результата | редко вручную; внутри asyncio |

```python
import asyncio

async def work(n: int) -> int:
    await asyncio.sleep(0.1)
    return n * 2

async def demo():
    t = asyncio.create_task(work(21))  # Task — уже в очереди loop
    other = await work(1)              # await coroutine напрямую
    result = await t                   # дождаться Task
    print(other, result)             # 2 42
```

**Правило:** если coroutine должна идти **параллельно** с другим кодом — оберните в **Task** до первого `await` на «другую» работу.

---

## Синтаксические ограничения

```python
# ❌ await в sync def
def bad():
    await asyncio.sleep(1)  # SyntaxError

# ❌ asyncio.run внутри running loop
async def nested_run():
    asyncio.run(other())  # RuntimeError

# ✅ sync вызывает async через run
def cli_entry():
    asyncio.run(main())

# ✅ async вызывает async через await
async def handler():
    data = await fetch()
```

Для вызова async из sync **без** нового loop (осторожно!) — `asyncio.get_event_loop().run_until_complete` в legacy-коде; в новых проектах — **`asyncio.run`** или полностью async stack.

---

## Минимальный HTTP-подобный пример

```python
import asyncio

async def fake_http(delay_ms: int) -> dict:
    await asyncio.sleep(delay_ms / 1000)
    return {"delay_ms": delay_ms, "ok": True}

async def fetch_report():
    # последовательно — сумма задержек
    a = await fake_http(200)
    b = await fake_http(350)
    return {"a": a, "b": b}

async def fetch_report_fast():
    a, b = await asyncio.gather(
        fake_http(200),
        fake_http(350),
    )
    return {"a": a, "b": b}
```

На стенде `8095` задержки реальные — [03-lab-first-async](03-lab-first-async.md).

---

## Связь с FastAPI

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/items")
async def list_items():
    # uvicorn await-ит эту корутину
    await asyncio.sleep(0)  # yield control
    return []
```

`async def` endpoint **должен** await-ить I/O. Sync `def` endpoint FastAPI выполнит в **threadpool** — escape hatch, не default для hot path ([27-async-patterns](../fastapi/27-async-patterns.md)).

---

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| Забыли `await` | coroutine object, логика «не выполняется» | `await coro()` |
| `asyncio.run` в Jupyter без nest_asyncio | RuntimeError | `await main()` в ячейке или `%autoawait` |
| Fire-and-forget coroutine | warning «never awaited» | `create_task` + храните ссылку |
| `await` sync function | TypeError | обёртка async или `to_thread` |
| Смешали sync sleep | loop frozen | `await asyncio.sleep` |

---

## Резюме

**`async def`** возвращает **coroutine** — объект, который выполняется только при **`await`** (или schedule как **Task**) внутри **running event loop**. **`asyncio.run`** — точка входа для скриптов. Понимание этой тройки обязательно до tasks, cancellation и httpx.

## Чек-лист

- Что выведет `print(greet("x"))` без await?
- Где legal использовать `await`?
- Чем Task отличается от «голой» coroutine?
- Кто вызывает `await` на вашем endpoint в FastAPI?

Следующий урок: [03. Лаба: первый async-скрипт](03-lab-first-async.md).
