#!/usr/bin/env python3
"""Copy rendered 111-128 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("111 Requests and Limits stability foundation", "kubernetes-111-requests-and-limits-stability-foundation"),
    ("112 QoS BestEffort Burstable Guaranteed", "kubernetes-112-qos-besteffort-burstable-guaranteed"),
    ("113 OOMKilled what it is and how to fix it", "kubernetes-113-oomkilled-what-it-is-and-how-to-fix-it"),
    ("114 Evicted Pod why eviction happens", "kubernetes-114-evicted-pod-why-eviction-happens"),
    ("115 Pending Pod common causes", "kubernetes-115-pending-pod-common-causes"),
    ("116 Liveness probe is the process alive", "kubernetes-116-liveness-probe-is-the-process-alive"),
    ("117 Readiness probe ready for traffic", "kubernetes-117-readiness-probe-ready-for-traffic"),
    ("118 Startup probe for slow startups", "kubernetes-118-startup-probe-for-slow-startups"),
    ("119 CrashLoopBackOff fast root-cause algorithm", "kubernetes-119-crashloopbackoff-fast-root-cause-algorithm"),
    ("120 Graceful shutdown and terminationGracePeriodSeconds", "kubernetes-120-graceful-shutdown-and-terminationgraceperiodseconds"),
    ("121 Why a Pod sticks in Terminating", "kubernetes-121-why-a-pod-sticks-in-terminating"),
    ("122 Init Containers prepare before start", "kubernetes-122-init-containers-prepare-before-start"),
    ("123 Sidecar pattern for helper tasks", "kubernetes-123-sidecar-pattern-for-helper-tasks"),
    ("124 EmptyDir for temporary data", "kubernetes-124-emptydir-for-temporary-data"),
    ("125 PodDisruptionBudget protect availability", "kubernetes-125-poddisruptionbudget-protect-availability"),
    ("126 PriorityClass who to save first", "kubernetes-126-priorityclass-who-to-save-first"),
    ("127 ResourceQuota namespace limits", "kubernetes-127-resourcequota-namespace-limits"),
    ("128 LimitRange request and limit standards", "kubernetes-128-limitrange-request-and-limit-standards"),
]


def has_moov(p: Path) -> bool:
    data = p.read_bytes()[:200000] + p.read_bytes()[-200000:]
    return b"moov" in data


def main() -> None:
    ok = True
    for folder, name in MAP:
        src = OUT / f"{name}.mp4"
        if not src.exists():
            print(f"[MISS] {name}.mp4")
            ok = False
            continue
        dst = ROOT / "videos" / folder / "kubernetes-reel.mp4"
        dst.write_bytes(src.read_bytes())
        match = src.stat().st_size == dst.stat().st_size
        moov = has_moov(dst)
        flag = "OK" if (moov and match) else "FAIL"
        if flag != "OK":
            ok = False
        print(f"[{flag}] {folder}: {dst.stat().st_size / 1_000_000:.1f} MB  moov={moov} match={match}")
    print("ALL OK" if ok else "SOME FAILED")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
