"""Mock HTTP service for python-async course labs."""
import asyncio
import os
import random
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Query

SERVICE = os.getenv("SERVICE_NAME", "mock")
BASE_DELAY_MS = int(os.getenv("BASE_DELAY_MS", "100"))
UPSTREAM_A = os.getenv("UPSTREAM_A")
UPSTREAM_B = os.getenv("UPSTREAM_B")
UPSTREAM_C = os.getenv("UPSTREAM_C")

_hits = 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.client.aclose()


app = FastAPI(title=f"mock-async-{SERVICE}", lifespan=lifespan)


async def _delay(extra_ms: int = 0) -> None:
    ms = BASE_DELAY_MS + extra_ms
    await asyncio.sleep(ms / 1000.0)


@app.get("/health")
async def health():
    return {"service": SERVICE, "status": "ok"}


@app.get("/slow")
async def slow(extra_ms: int = Query(0, ge=0, le=5000)):
    await _delay(extra_ms)
    return {"service": SERVICE, "delay_ms": BASE_DELAY_MS + extra_ms}


@app.get("/json")
async def json_payload(size: int = Query(10, ge=1, le=1000)):
    await _delay(0)
    return {"service": SERVICE, "items": list(range(size))}


@app.get("/fail")
async def maybe_fail(rate: float = Query(0.3, ge=0.0, le=1.0)):
    await _delay(0)
    if random.random() < rate:
        raise HTTPException(status_code=503, detail=f"{SERVICE} unavailable")
    return {"service": SERVICE, "ok": True}


@app.get("/aggregate")
async def aggregate():
    """Gateway only: fan-out to three upstreams sequentially (slow baseline)."""
    if not (UPSTREAM_A and UPSTREAM_B and UPSTREAM_C):
        raise HTTPException(status_code=404, detail="not a gateway")
    client: httpx.AsyncClient = app.state.client
    results = []
    for url in (UPSTREAM_A, UPSTREAM_B, UPSTREAM_C):
        r = await client.get(f"{url}/json", params={"size": 5})
        r.raise_for_status()
        results.append(r.json())
    return {"mode": "sequential", "results": results}


@app.get("/aggregate-parallel")
async def aggregate_parallel():
    """Gateway only: fan-out concurrently — compare timing in lab."""
    if not (UPSTREAM_A and UPSTREAM_B and UPSTREAM_C):
        raise HTTPException(status_code=404, detail="not a gateway")
    client: httpx.AsyncClient = app.state.client
    urls = [UPSTREAM_A, UPSTREAM_B, UPSTREAM_C]

    async def fetch(base: str):
        r = await client.get(f"{base}/json", params={"size": 5})
        r.raise_for_status()
        return r.json()

    results = await asyncio.gather(*(fetch(u) for u in urls))
    return {"mode": "parallel", "results": results}


@app.get("/hits")
async def hits():
    global _hits
    _hits += 1
    await _delay(0)
    return {"service": SERVICE, "hits": _hits}
