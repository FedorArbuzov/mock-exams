#!/usr/bin/env python3
"""Copy rendered 205-218 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("205 kubectl scale manual scale in seconds", "kubernetes-205-kubectl-scale-manual-scale-in-seconds"),
    ("206 HPA on CPU first autoscaling", "kubernetes-206-hpa-on-cpu-first-autoscaling"),
    ("207 HPA on custom metrics (concept)", "kubernetes-207-hpa-on-custom-metrics-concept"),
    ("208 VPA auto-sizing Pod resources", "kubernetes-208-vpa-auto-sizing-pod-resources"),
    ("209 HPA vs VPA when to use which", "kubernetes-209-hpa-vs-vpa-when-to-use-which"),
    ("210 Saturation spotting the approach to limits", "kubernetes-210-saturation-spotting-the-approach-to-limits"),
    ("211 App bottleneck vs infrastructure bottleneck", "kubernetes-211-app-bottleneck-vs-infrastructure-bottleneck"),
    ("212 Top causes of performance degradation", "kubernetes-212-top-causes-of-performance-degradation"),
    ("213 Load optimization checklist", "kubernetes-213-load-optimization-checklist"),
    ("214 Myth safer without Limits", "kubernetes-214-myth-safer-without-limits"),
    ("215 SLOSLA in plain words", "kubernetes-215-slo-sla-in-plain-words"),
    ("216 Runbook capturing team knowledge", "kubernetes-216-runbook-capturing-team-knowledge"),
    ("217 Postmortem for beginners no blame", "kubernetes-217-postmortem-for-beginners-no-blame"),
    ("218 On-call checklist what to watch each hour", "kubernetes-218-on-call-checklist-what-to-watch-each-hour"),
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
