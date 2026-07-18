#!/usr/bin/env python3
"""Parallel HTTP fetch with semaphore, timeout, and retry.

Requires: httpx
Stand: deploy/python-async on http://localhost:8095

Usage:
    python examples/fetch_parallel.py
    python examples/fetch_parallel.py --concurrency 10
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from dataclasses import dataclass

import httpx

DEFAULT_BASE = "http://localhost:8095"
DEFAULT_PATHS = [
    "/health",
    "/json?size=5",
    "/json?size=15",
    "/slow?extra_ms=0",
    "/slow?extra_ms=50",
    "/slow?extra_ms=100",
]


@dataclass(frozen=True)
class FetchResult:
    url: str
    status: int | None
    latency_ms: float
    error: str | None = None


async def fetch_with_retry(
    sem: asyncio.Semaphore,
    client: httpx.AsyncClient,
    base: str,
    path: str,
    *,
    attempts: int = 3,
    timeout_s: float = 10.0,
) -> FetchResult:
    url = f"{base.rstrip('/')}{path}"
    async with sem:
        last_error: str | None = None
        for attempt in range(attempts):
            started = time.perf_counter()
            try:
                async with asyncio.timeout(timeout_s):
                    response = await client.get(url)
                latency_ms = (time.perf_counter() - started) * 1000
                if response.status_code >= 500:
                    last_error = f"HTTP {response.status_code}"
                    await asyncio.sleep(0.05 * (2**attempt))
                    continue
                return FetchResult(url, response.status_code, latency_ms)
            except (TimeoutError, httpx.HTTPError) as exc:
                last_error = str(exc)
                await asyncio.sleep(0.05 * (2**attempt))
        return FetchResult(url, None, 0.0, last_error)


async def fetch_all(
    base: str,
    paths: list[str],
    concurrency: int,
) -> list[FetchResult]:
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(timeout=30.0) as client:
        return list(
            await asyncio.gather(
                *[fetch_with_retry(sem, client, base, p) for p in paths]
            )
        )


def summarize(results: list[FetchResult], elapsed_s: float) -> None:
    ok = [r for r in results if r.error is None]
    failed = [r for r in results if r.error is not None]
    latencies = sorted(r.latency_ms for r in ok)

    print(f"total={len(results)} ok={len(ok)} fail={len(failed)}")
    if latencies:
        p50 = latencies[len(latencies) // 2]
        print(
            f"latency_ms: min={latencies[0]:.0f} "
            f"p50={p50:.0f} max={latencies[-1]:.0f}"
        )
    print(f"wall_clock_s={elapsed_s:.3f}")

    for item in failed[:5]:
        print(f"  FAIL {item.url}: {item.error}")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default=DEFAULT_BASE)
    parser.add_argument("--concurrency", type=int, default=5)
    parser.add_argument(
        "--sequential",
        action="store_true",
        help="fetch one-by-one for baseline comparison",
    )
    return parser.parse_args(argv)


async def fetch_sequential(base: str, paths: list[str]) -> list[FetchResult]:
    sem = asyncio.Semaphore(1)
    async with httpx.AsyncClient(timeout=30.0) as client:
        results: list[FetchResult] = []
        for path in paths:
            results.append(await fetch_with_retry(sem, client, base, path))
        return results


async def async_main(args: argparse.Namespace) -> int:
    paths = DEFAULT_PATHS
    started = time.perf_counter()
    if args.sequential:
        results = await fetch_sequential(args.base, paths)
        mode = "sequential"
    else:
        results = await fetch_all(args.base, paths, args.concurrency)
        mode = f"parallel(concurrency={args.concurrency})"
    elapsed = time.perf_counter() - started
    print(f"mode={mode}")
    summarize(results, elapsed)
    return 0 if all(r.error is None for r in results) else 1


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    return asyncio.run(async_main(args))


if __name__ == "__main__":
    raise SystemExit(main())
