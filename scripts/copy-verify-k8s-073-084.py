#!/usr/bin/env python3
"""Copy rendered 073-084 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("73 containerPort vs Service port vs targetPort", "kubernetes-073-containerport-vs-service-port-vs-targetport"),
    ("74 Env in a Pod env vs envFrom", "kubernetes-074-env-in-a-pod-env-vs-envfrom"),
    ("75 ConfigMap as a file vs as env vars", "kubernetes-075-configmap-as-a-file-vs-as-env-vars"),
    ("76 Secret mount vs env what is safer", "kubernetes-076-secret-mount-vs-env-what-is-safer"),
    ("77 subPath convenient and risky", "kubernetes-077-subpath-convenient-and-risky"),
    ("78 Projected volumes in one picture", "kubernetes-078-projected-volumes-in-one-picture"),
    ("79 Downward API a Pod learns about itself", "kubernetes-079-downward-api-a-pod-learns-about-itself"),
    ("80 Multi-container Pod talk over localhost", "kubernetes-080-multi-container-pod-talk-over-localhost"),
    ("81 Shared volume between app and sidecar", "kubernetes-081-shared-volume-between-app-and-sidecar"),
    ("82 readOnlyRootFilesystem why", "kubernetes-082-readonlyrootfilesystem-why"),
    ("83 securityContext runAsNonRoot in 30 seconds", "kubernetes-083-securitycontext-runasnonroot-in-30-seconds"),
    ("84 Capabilities why drop ALL", "kubernetes-084-capabilities-why-drop-all"),
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
