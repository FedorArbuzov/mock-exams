"""Minimal FastAPI app for course labs — extend in lessons."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest
from starlette.responses import Response

from app.routers import health, items

REQUESTS = Counter("fastapi_http_requests_total", "HTTP requests", ["method", "path", "status"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Mock Exams FastAPI Lab",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(health.router)
app.include_router(items.router, prefix="/api/v1")


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
