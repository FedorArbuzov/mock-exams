#!/usr/bin/env python3
"""Copy rendered 129-140 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("129 Taints block scheduling onto a node", "kubernetes-129-taints-block-scheduling-onto-a-node"),
    ("130 Tolerations intentional exceptions", "kubernetes-130-tolerations-intentional-exceptions"),
    ("131 Affinity place things together", "kubernetes-131-affinity-place-things-together"),
    ("132 Anti-affinity spread across nodes", "kubernetes-132-anti-affinity-spread-across-nodes"),
    ("133 Topology spread constraints evenness across zones", "kubernetes-133-topology-spread-constraints-evenness-across-zones"),
    ("134 Cordon stop new Pods on a node", "kubernetes-134-cordon-stop-new-pods-on-a-node"),
    ("135 Drain safely empty a node", "kubernetes-135-drain-safely-empty-a-node"),
    ("136 Node maintenance without downtime", "kubernetes-136-node-maintenance-without-downtime"),
    ("137 Why a Pod landed on this exact node", "kubernetes-137-why-a-pod-landed-on-this-exact-node"),
    ("138 Placing critical vs non-critical services", "kubernetes-138-placing-critical-vs-non-critical-services"),
    ("139 DaemonSet + tolerations a common case", "kubernetes-139-daemonset-tolerations-a-common-case"),
    ("140 Mini scheduling checklist", "kubernetes-140-mini-scheduling-checklist"),
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
