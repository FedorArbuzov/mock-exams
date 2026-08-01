# 02. Coroutines, await and async def

## Intro: "the function is there, but return doesn't fire"

A junior added `async def fetch_user()` and called `fetch_user()` from sync code — and got `<coroutine object fetch_user at 0x...>` and the warning **"coroutine was never awaited"**. The logs are empty, no users were created. The problem isn't in the business logic, but in the fact that **a coroutine is not an ordinary function**: it needs to be **scheduled** and **awaited** inside a running event loop.

This chapter breaks down the **coroutine object**, **`async def`**, **`await`**, **`asyncio.run()`** — the minimum set before [04-event-loop](04-event-loop.md) and the first lab [03-lab-first-async](03-lab-first-async.md).

## What you'll learn

- What `async def` returns and how it differs from `def`.
- The rules of **`await`**: where you can, where you can't.
- How to run a coroutine via **`asyncio.run()`**.
- The difference between **coroutine**, **Task**, **Future** (overview).

---

## async def creates a coroutine

```python
import asyncio

async def greet(name: str) -> str:
    await asyncio.sleep(0.1)  # hand control back to the loop
    return f"Hello, {name}"

# Call WITHOUT await — coroutine object, not the result!
coro = greet("World")
print(type(coro))  # <class 'coroutine'>

async def main():
    result = await greet("World")  # await is required here
    print(result)

asyncio.run(main())  # Hello, World
```

| Construct | What happens |
|-------------|----------------|
| `def f()` | call → immediate execution → return |
| `async def f()` | call → **coroutine object** (not executed yet) |
| `await f()` | suspend the current coroutine, run `f`, resume |

```mermaid
sequenceDiagram
  participant Main as main()
  participant Loop as Event loop
  participant G as greet()
  Main->>Loop: await greet()
  Loop->>G: start greet
  G->>Loop: await sleep(0.1)
  Note over G: suspended
  Loop->>G: resume after 0.1s
  G-->>Main: "Hello, World"
```

---

## await — the point of cooperative yielding of control

**`await`** can be used **only inside** `async def` (and in the REPL with asyncio mode). **`await`** waits for an **awaitable**: coroutine, Task, Future.

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
    await step_a()  # sequentially: ~100ms
    await step_b()

async def parallel():
    await asyncio.gather(step_a(), step_b())  # in parallel: ~50ms
```

Parallel launch — [05-tasks-taskgroup](05-tasks-taskgroup.md), [09-gather-vs-taskgroup](09-gather-vs-taskgroup.md).

---

## asyncio.run — the entry point for scripts

```python
import asyncio

async def main():
    print("inside coroutine")

if __name__ == "__main__":
    asyncio.run(main())  # creates the loop, runs main(), closes the loop
```

| `asyncio.run(coro)` | Behavior |
|---------------------|-----------|
| Python 3.7+ | the recommended way for CLI/scripts |
| Internally | `asyncio.new_event_loop()` → `run_until_complete` → cleanup |
| Nested call | **error** — only one `run` per thread |

**In FastAPI/uvicorn** you do **not** call `asyncio.run` — the loop is already running; endpoints are coroutines that the framework awaits.

---

## Coroutine vs Task vs Future

| Type | Description | Creation |
|-----|----------|----------|
| **Coroutine** | the result of `async def`; a "recipe" of work | `async def f()` → `f()` |
| **Task** | a coroutine **scheduled** on the loop | `asyncio.create_task(coro)` |
| **Future** | a low-level placeholder for a result | rarely by hand; used inside asyncio |

```python
import asyncio

async def work(n: int) -> int:
    await asyncio.sleep(0.1)
    return n * 2

async def demo():
    t = asyncio.create_task(work(21))  # Task — already in the loop's queue
    other = await work(1)              # await the coroutine directly
    result = await t                   # wait for the Task
    print(other, result)             # 2 42
```

**Rule:** if a coroutine should run **in parallel** with other code — wrap it in a **Task** before the first `await` on "other" work.

---

## Syntactic restrictions

```python
# ❌ await in a sync def
def bad():
    await asyncio.sleep(1)  # SyntaxError

# ❌ asyncio.run inside a running loop
async def nested_run():
    asyncio.run(other())  # RuntimeError

# ✅ sync calls async via run
def cli_entry():
    asyncio.run(main())

# ✅ async calls async via await
async def handler():
    data = await fetch()
```

To call async from sync **without** a new loop (careful!) — `asyncio.get_event_loop().run_until_complete` in legacy code; in new projects — **`asyncio.run`** or a fully async stack.

---

## A minimal HTTP-like example

```python
import asyncio

async def fake_http(delay_ms: int) -> dict:
    await asyncio.sleep(delay_ms / 1000)
    return {"delay_ms": delay_ms, "ok": True}

async def fetch_report():
    # sequentially — the sum of delays
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

On the `8095` stand the delays are real — [03-lab-first-async](03-lab-first-async.md).

---

## Relation to FastAPI

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/items")
async def list_items():
    # uvicorn awaits this coroutine
    await asyncio.sleep(0)  # yield control
    return []
```

An `async def` endpoint **must** await I/O. FastAPI runs a sync `def` endpoint in a **threadpool** — an escape hatch, not the default for a hot path ([27-async-patterns](../fastapi/27-async-patterns.md)).

---

## Common mistakes

| Mistake | Symptom | Solution |
|--------|---------|---------|
| Forgot `await` | coroutine object, logic "doesn't run" | `await coro()` |
| `asyncio.run` in Jupyter without nest_asyncio | RuntimeError | `await main()` in a cell or `%autoawait` |
| Fire-and-forget coroutine | warning "never awaited" | `create_task` + keep a reference |
| `await` on a sync function | TypeError | an async wrapper or `to_thread` |
| Mixed in a sync sleep | loop frozen | `await asyncio.sleep` |

---

## Summary

**`async def`** returns a **coroutine** — an object that runs only on **`await`** (or when scheduled as a **Task**) inside a **running event loop**. **`asyncio.run`** is the entry point for scripts. Understanding this trio is mandatory before tasks, cancellation and httpx.

## Checklist

- What will `print(greet("x"))` output without await?
- Where is it legal to use `await`?
- How does a Task differ from a "bare" coroutine?
- Who calls `await` on your endpoint in FastAPI?

Next lesson: [03. Lab: your first async script](03-lab-first-async.md).
