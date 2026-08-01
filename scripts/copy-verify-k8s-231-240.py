#!/usr/bin/env python3
"""Copy rendered 231-240 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("231 Kustomize vs Helm when to use which", "kubernetes-231-kustomize-vs-helm-when-to-use-which"),
    ("232 kustomization.yaml in 30 seconds", "kubernetes-232-kustomization-yaml-in-30-seconds"),
    ("233 Overlays base dev prod", "kubernetes-233-overlays-base-dev-prod"),
    ("234 kubectl apply -k", "kubernetes-234-kubectl-apply-k"),
    ("235 Patches without copy-pasting manifests", "kubernetes-235-patches-without-copy-pasting-manifests"),
    ("236 ConfigMapGenerator SecretGenerator", "kubernetes-236-configmapgenerator-secretgenerator"),
    ("237 Why hand-editing prod is bad", "kubernetes-237-why-hand-editing-prod-is-bad"),
    ("238 Drift cluster left Git behind", "kubernetes-238-drift-cluster-left-git-behind"),
    ("239 Argo CD Flux GitOps idea in one picture", "kubernetes-239-argo-cd-flux-gitops-idea-in-one-picture"),
    ("240 PR sync cluster", "kubernetes-240-pr-sync-cluster"),
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
