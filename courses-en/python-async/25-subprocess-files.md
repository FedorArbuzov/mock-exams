# 25. Subprocess and async files

## Intro: "we need to call ffmpeg and not freeze the API"

A service generates thumbnails: it runs **`ffmpeg`** for 30 seconds, reads stdout and writes to S3. A sync `subprocess.run` in a coroutine is a disaster. You need **`asyncio.create_subprocess_exec`** and, for the disk, **`aiofiles`** (or `to_thread` for rare operations).

The subprocess lab is optional in the capstone [36-capstone](36-capstone.md). Relation to executors — [23-executors-blocking](23-executors-blocking.md).

## What you'll learn

- **`asyncio.create_subprocess_exec`** / **`create_subprocess_shell`**.
- Reading stdout/stderr without blocking the loop.
- **`aiofiles`** for async file I/O.
- Windows vs POSIX subprocess nuances.

---

## create_subprocess_exec

```python
import asyncio

async def run_ffmpeg_version() -> str:
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg", "-version",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(stderr.decode())
    return stdout.decode().splitlines()[0]

async def main():
    try:
        line = await run_ffmpeg_version()
        print(line)
    except FileNotFoundError:
        print("ffmpeg not installed — ok for lab")

asyncio.run(main())
```

| Parameter | Meaning |
|----------|--------|
| `stdout=PIPE` | capture the output |
| `await proc.communicate()` | wait for completion + read streams |
| `await proc.wait()` | only the exit code, without auto-read |
| `stdin=PIPE` | pass input via `communicate(input=...)` |

---

## Timeout and cancellation

```python
async def run_with_timeout(cmd: list[str], timeout: float = 10.0) -> int:
    proc = await asyncio.create_subprocess_exec(*cmd)
    try:
        async with asyncio.timeout(timeout):
            return await proc.wait()
    except TimeoutError:
        proc.kill()
        await proc.wait()
        raise
```

On a **CancelledError** in the parent coroutine — `proc.kill()` in `finally`, otherwise a zombie process.

```python
async def safe_subprocess(cmd: list[str]) -> bytes:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE
    )
    try:
        stdout, _ = await proc.communicate()
        return stdout
    except asyncio.CancelledError:
        proc.kill()
        await proc.wait()
        raise
```

---

## Streaming stdout reads

For long output, don't buffer everything in memory:

```python
async def stream_lines(cmd: list[str]):
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
    )
    assert proc.stdout is not None
    while True:
        line = await proc.stdout.readline()
        if not line:
            break
        yield line.decode().rstrip()
    await proc.wait()
```

---

## aiofiles overview

```bash
pip install aiofiles
```

```python
import aiofiles

async def read_config(path: str) -> str:
    async with aiofiles.open(path, mode="r", encoding="utf-8") as f:
        return await f.read()

async def append_log(path: str, line: str) -> None:
    async with aiofiles.open(path, mode="a", encoding="utf-8") as f:
        await f.write(line + "\n")
```

| Approach | When |
|--------|-------|
| `aiofiles` | frequent read/write in an async service |
| `asyncio.to_thread(open)` | rare large files |
| sync read at startup | config in the lifespan — acceptable |

**aiofiles** uses a thread pool under the hood — for **huge** sequential reads a dedicated thread + a blocking read is sometimes more efficient.

---

## Shell vs exec

```python
# Prefer exec — no shell injection
await asyncio.create_subprocess_exec("python", "-c", "print(1)")

# shell only for trusted commands
await asyncio.create_subprocess_shell("echo hello")
```

Never substitute user input into `shell=True`.

---

## Windows notes

- `create_subprocess_exec` works; **ProactorEventLoop** by default.
- `add_signal_handler` is limited — see [08-lab-graceful-shutdown](08-lab-graceful-shutdown.md).
- Paths with spaces — pass them as a list of arguments, not a shell string.

---

## Common mistakes

| Mistake | Why it's bad | The right way |
|--------|--------------|---------------|
| `subprocess.run` in async | blocks the loop | `create_subprocess_exec` |
| Not reading the PIPE | deadlock with large stdout | `communicate` or stream read |
| Forgetting `kill` on cancel | zombie / hung child | try/finally kill |
| aiofiles for every 100B write | overhead | batch or buffer |
| Shell with user input | RCE | exec + list args |

---

## On the stand

Without ffmpeg — use Python as the subprocess:

```python
async def py_subprocess():
    proc = await asyncio.create_subprocess_exec(
        "python", "-c", "import time; time.sleep(0.5); print('done')",
        stdout=asyncio.subprocess.PIPE,
    )
    out, _ = await proc.communicate()
    print(out.decode())

asyncio.run(py_subprocess())
```

A parallel request to **8095** should finish **before** the subprocess sleep of 0.5s — the loop isn't blocked.

---

## In production

- **Limits:** max concurrent subprocesses (Semaphore), cgroup memory.
- **Logs:** stderr into structured logging, not the whole thing in the exception message.
- **Containers:** subprocesses in Docker — account for the PID namespace and signals.

---

## Summary

**create_subprocess_exec** integrates external CLIs into asyncio without blocking. **aiofiles** is a convenient async API for files; threads under the hood. Both require **limits** and **cleanup** on cancellation.

## Checklist

- How does `communicate()` differ from `wait()`?
- Why is shell dangerous with user input?
- When is aiofiles overkill?
- What to do with a subprocess on CancelledError?

Next lesson: [26. When not async](26-when-not-async.md).
