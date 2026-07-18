#!/usr/bin/env python3
"""Async worker pool: Queue + Semaphore + httpx consumers.

Demonstrates producer-consumer backpressure from lesson 14/32.
Stand: deploy/python-async on http://localhost:8095

Usage:
    python examples/worker_pool.py
    python examples/worker_pool.py --workers 4 --jobs 20
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from dataclasses import dataclass

import httpx

DEFAULT_BASE = "http://localhost:8095"


@dataclass(frozen=True)
class Job:
    job_id: int
    path: str


@dataclass
class JobResult:
    job_id: int
    path: str
    status: int | None
    latency_ms: float
    worker: str
    error: str | None = None


async def process_job(
    sem: asyncio.Semaphore,
    client: httpx.AsyncClient,
    base: str,
    job: Job,
    worker_name: str,
) -> JobResult:
    url = f"{base.rstrip('/')}{job.path}"
    async with sem:
        started = time.perf_counter()
        try:
            async with asyncio.timeout(15.0):
                response = await client.get(url)
            latency_ms = (time.perf_counter() - started) * 1000
            return JobResult(
                job_id=job.job_id,
                path=job.path,
                status=response.status_code,
                latency_ms=latency_ms,
                worker=worker_name,
            )
        except (TimeoutError, httpx.HTTPError) as exc:
            latency_ms = (time.perf_counter() - started) * 1000
            return JobResult(
                job_id=job.job_id,
                path=job.path,
                status=None,
                latency_ms=latency_ms,
                worker=worker_name,
                error=str(exc),
            )


async def worker(
    name: str,
    queue: asyncio.Queue[Job | None],
    sem: asyncio.Semaphore,
    client: httpx.AsyncClient,
    base: str,
    results: list[JobResult],
) -> None:
    while True:
        job = await queue.get()
        try:
            if job is None:
                return
            result = await process_job(sem, client, base, job, name)
            results.append(result)
            print(
                f"[{name}] job={result.job_id} path={result.path} "
                f"status={result.status} latency_ms={result.latency_ms:.0f}"
            )
        finally:
            queue.task_done()


async def producer(queue: asyncio.Queue[Job | None], jobs: list[Job]) -> None:
    for job in jobs:
        await queue.put(job)
    # Sentinel per worker added in run_pool


def build_jobs(count: int) -> list[Job]:
    paths = [
        "/health",
        "/json?size=3",
        "/slow?extra_ms=0",
        "/slow?extra_ms=30",
        "/slow?extra_ms=60",
    ]
    return [Job(i, paths[i % len(paths)]) for i in range(count)]


async def run_pool(
    base: str,
    *,
    workers: int,
    job_count: int,
    queue_size: int,
    max_inflight: int,
) -> list[JobResult]:
    queue: asyncio.Queue[Job | None] = asyncio.Queue(maxsize=queue_size)
    sem = asyncio.Semaphore(max_inflight)
    results: list[JobResult] = []
    jobs = build_jobs(job_count)

    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [
            asyncio.create_task(
                worker(f"W{i}", queue, sem, client, base, results),
                name=f"worker-{i}",
            )
            for i in range(workers)
        ]

        await producer(queue, jobs)
        for _ in range(workers):
            await queue.put(None)

        await queue.join()
        await asyncio.gather(*tasks)

    return results


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default=DEFAULT_BASE)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--jobs", type=int, default=12)
    parser.add_argument("--queue-size", type=int, default=6)
    parser.add_argument("--max-inflight", type=int, default=4)
    return parser.parse_args(argv)


async def async_main(args: argparse.Namespace) -> int:
    started = time.perf_counter()
    results = await run_pool(
        args.base,
        workers=args.workers,
        job_count=args.jobs,
        queue_size=args.queue_size,
        max_inflight=args.max_inflight,
    )
    elapsed = time.perf_counter() - started
    ok = sum(1 for r in results if r.error is None and r.status == 200)
    print(
        f"done jobs={len(results)} ok={ok} "
        f"workers={args.workers} max_inflight={args.max_inflight} "
        f"wall_clock_s={elapsed:.3f}"
    )
    return 0 if ok == len(results) else 1


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    return asyncio.run(async_main(args))


if __name__ == "__main__":
    raise SystemExit(main())
