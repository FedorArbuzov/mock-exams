#!/usr/bin/env python3
"""Copy rendered 241-248 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("241 Pipeline build push deploy", "kubernetes-241-pipeline-build-push-deploy"),
    ("242 GitOps mindset change via Git, not by hand", "kubernetes-242-gitops-mindset-change-via-git-not-by-hand"),
    ("243 How to add a smoke test to the pipeline", "kubernetes-243-how-to-add-a-smoke-test-to-the-pipeline"),
    ("244 Secrets in CI what not to do", "kubernetes-244-secrets-in-ci-what-not-to-do"),
    ("245 Image versioning in the pipeline", "kubernetes-245-image-versioning-in-the-pipeline"),
    ("246 Rollback from CI vs rollback from the cluster", "kubernetes-246-rollback-from-ci-vs-rollback-from-the-cluster"),
    ("247 Preview environments from PRs (concept)", "kubernetes-247-preview-environments-from-prs-concept"),
    ("248 Production pipeline checklist", "kubernetes-248-production-pipeline-checklist"),
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
