#!/usr/bin/env python3
"""Copy rendered 193-204 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("193 What Metrics Server is", "kubernetes-193-what-metrics-server-is"),
    ("194 Prometheus why it exists in the k8s world", "kubernetes-194-prometheus-why-it-exists-in-the-k8s-world"),
    ("195 Grafana what a junior should look at", "kubernetes-195-grafana-what-a-junior-should-look-at"),
    ("196 Logs stdout is the standard", "kubernetes-196-logs-stdout-is-the-standard"),
    ("197 Why logs vanish after a Pod restart", "kubernetes-197-why-logs-vanish-after-a-pod-restart"),
    ("198 Tracing in one sentence", "kubernetes-198-tracing-in-one-sentence"),
    ("199 Alerts the first 3 rules", "kubernetes-199-alerts-the-first-3-rules"),
    ("200 Deployment health dashboard", "kubernetes-200-deployment-health-dashboard"),
    ("201 How to tell an app bug from a k8s problem", "kubernetes-201-how-to-tell-an-app-bug-from-a-k8s-problem"),
    ("202 Latency p95p99 why average isn't enough", "kubernetes-202-latency-p95-p99-why-average-isnt-enough"),
    ("203 Error rate basic threshold setup", "kubernetes-203-error-rate-basic-threshold-setup"),
    ("204 Golden Signals 4 required metrics", "kubernetes-204-golden-signals-4-required-metrics"),
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
