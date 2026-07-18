# 25. Subprocess и async файлы

## Введение: «нужно вызвать ffmpeg и не заморозить API»

Сервис генерирует превью: запускает **`ffmpeg`** на 30 секунд, читает stdout и пишет в S3. Sync `subprocess.run` в корутине — катастрофа. Нужны **`asyncio.create_subprocess_exec`** и для диска — **`aiofiles`** (или `to_thread` для редких операций).

Лаба subprocess — опционально в capstone [36-capstone](36-capstone.md). Связь с executors — [23-executors-blocking](23-executors-blocking.md).

## Что вы узнаете

- **`asyncio.create_subprocess_exec`** / **`create_subprocess_shell`**.
- Чтение stdout/stderr без блокировки loop.
- **`aiofiles`** для async file I/O.
- Windows vs POSIX нюансы subprocess.

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

| Параметр | Смысл |
|----------|--------|
| `stdout=PIPE` | захват вывода |
| `await proc.communicate()` | дождаться завершения + read streams |
| `await proc.wait()` | только exit code, без auto-read |
| `stdin=PIPE` | передать input через `communicate(input=...)` |

---

## Таймаут и отмена

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

При **CancelledError** в родительской корутине — `proc.kill()` в `finally`, иначе zombie process.

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

## Потоковое чтение stdout

Для длинного вывода не буферизуйте всё в память:

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

| Подход | Когда |
|--------|-------|
| `aiofiles` | частые read/write в async service |
| `asyncio.to_thread(open)` | редкие большие файлы |
| sync read at startup | конфиг в lifespan — допустимо |

**aiofiles** использует thread pool под капотом — для **огромных** sequential read иногда выгоднее dedicated thread + blocking read.

---

## Shell vs exec

```python
# Предпочитайте exec — нет shell injection
await asyncio.create_subprocess_exec("python", "-c", "print(1)")

# shell только для trusted commands
await asyncio.create_subprocess_shell("echo hello")
```

Никогда не подставляйте user input в `shell=True`.

---

## Windows notes

- `create_subprocess_exec` работает; **ProactorEventLoop** по умолчанию.
- `add_signal_handler` ограничен — см. [08-lab-graceful-shutdown](08-lab-graceful-shutdown.md).
- Пути с пробелами — передавайте списком аргументов, не строкой shell.

---

## Типичные ошибки

| Ошибка | Почему плохо | Как правильно |
|--------|--------------|---------------|
| `subprocess.run` в async | блок loop | `create_subprocess_exec` |
| Не читать PIPE | deadlock при большом stdout | `communicate` или stream read |
| Забыть `kill` при cancel | zombie / hung child | try/finally kill |
| aiofiles на каждый 100B write | overhead | batch или buffer |
| Shell с user input | RCE | exec + list args |

---

## На стенде

Без ffmpeg — используйте Python как subprocess:

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

Параллельно запрос к **8095** должен завершиться **до** subprocess sleep 0.5s — loop не заблокирован.

---

## В продакшене

- **Лимиты:** max concurrent subprocess (Semaphore), cgroup memory.
- **Логи:** stderr в structured logging, не в exception message целиком.
- **Контейнеры:** subprocess в Docker — учитывайте PID namespace и signals.

---

## Резюме

**create_subprocess_exec** интегрирует внешние CLI в asyncio без блокировки. **aiofiles** — удобный async API для файлов; под капотом threads. Оба требуют **лимитов** и **cleanup** при отмене.

## Чек-лист

- Чем `communicate()` отличается от `wait()`?
- Почему shell опасен с user input?
- Когда aiofiles избыточен?
- Что делать с subprocess при CancelledError?

Следующий урок: [26. Когда не async](26-when-not-async.md).
