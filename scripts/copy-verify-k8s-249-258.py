#!/usr/bin/env python3
"""Copy rendered 249-258 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("249 CRD custom resources in the API", "kubernetes-249-crd-custom-resources-in-the-api"),
    ("250 Operator pattern in plain words", "kubernetes-250-operator-pattern-in-plain-words"),
    ("251 Why Operators for DBsqueues", "kubernetes-251-why-operators-for-dbs-queues"),
    ("252 Internal developer platform in one analogy", "kubernetes-252-internal-developer-platform-in-one-analogy"),
    ("253 Platform engineering who builds the Deploy button", "kubernetes-253-platform-engineering-who-builds-the-deploy-button"),
    ("254 What a junior Kubernetes engineer should know", "kubernetes-254-what-a-junior-kubernetes-engineer-should-know"),
    ("255 3-month growth plan in Kubernetes", "kubernetes-255-3-month-growth-plan-in-kubernetes"),
    ("256 Top 10 questions in a k8s junior interview", "kubernetes-256-top-10-questions-in-a-k8s-junior-interview"),
    ("257 Explain Deployment in 30 seconds (interview answer)", "kubernetes-257-explain-deployment-in-30-seconds-interview-answer"),
    ("258 Final short roadmap to the next level", "kubernetes-258-final-short-roadmap-to-the-next-level"),
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
