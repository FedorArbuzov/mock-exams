#!/usr/bin/env python3
"""Copy rendered 141-158 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("141 Rolling Update update without downtime", "kubernetes-141-rolling-update-update-without-downtime"),
    ("142 kubectl rollout status watch the release", "kubernetes-142-kubectl-rollout-status-watch-the-release"),
    ("143 kubectl rollout history revision history", "kubernetes-143-kubectl-rollout-history-revision-history"),
    ("144 kubectl rollout undo fast rollback", "kubernetes-144-kubectl-rollout-undo-fast-rollback"),
    ("145 kubectl set image quick image update", "kubernetes-145-kubectl-set-image-quick-image-update"),
    ("146 rollout restart restart the grown-up way", "kubernetes-146-rollout-restart-restart-the-grown-up-way"),
    ("147 Why kubectl delete pod is not a release", "kubernetes-147-why-kubectl-delete-pod-is-not-a-release"),
    ("148 revisionHistoryLimit history vs cleanup", "kubernetes-148-revisionhistorylimit-history-vs-cleanup"),
    ("149 BlueGreen vs Rolling vs Canary", "kubernetes-149-bluegreen-vs-rolling-vs-canary"),
    ("150 Smoke test after deploy", "kubernetes-150-smoke-test-after-deploy"),
    ("151 Before deploy checklist", "kubernetes-151-before-deploy-checklist"),
    ("152 After deploy checklist", "kubernetes-152-after-deploy-checklist"),
    ("153 Mini incident runbook", "kubernetes-153-mini-incident-runbook"),
    ("154 Top mistakes on the first release", "kubernetes-154-top-mistakes-on-the-first-release"),
    ("155 Don't deploy to the wrong cluster (kube context)", "kubernetes-155-dont-deploy-to-the-wrong-cluster-kube-context"),
    ("156 Progressive delivery at a basic level", "kubernetes-156-progressive-delivery-at-a-basic-level"),
    ("157 Post-deploy smoke + health-check", "kubernetes-157-post-deploy-smoke-and-health-check"),
    ("158 Myth more replicas is not always better", "kubernetes-158-myth-more-replicas-is-not-always-better"),
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
