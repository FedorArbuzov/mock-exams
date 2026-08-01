#!/usr/bin/env python3
"""Copy rendered 159-172 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("159 PersistentVolume and PersistentVolumeClaim", "kubernetes-159-persistentvolume-and-persistentvolumeclaim"),
    ("160 StorageClass dynamic volume provisioning", "kubernetes-160-storageclass-dynamic-volume-provisioning"),
    ("161 Access Modes RWO ROX RWX", "kubernetes-161-access-modes-rwo-rox-rwx"),
    ("162 Reclaim Policy Delete vs Retain", "kubernetes-162-reclaim-policy-delete-vs-retain"),
    ("163 StatefulSet for databases", "kubernetes-163-statefulset-for-databases"),
    ("164 Headless Service + StatefulSet", "kubernetes-164-headless-service-and-statefulset"),
    ("165 Why HostPath is dangerous in prod", "kubernetes-165-why-hostpath-is-dangerous-in-prod"),
    ("166 PVC lifecycle in a real project", "kubernetes-166-pvc-lifecycle-in-a-real-project"),
    ("167 What happens to data on Pod restart", "kubernetes-167-what-happens-to-data-on-pod-restart"),
    ("168 Job for backup basic scenario", "kubernetes-168-job-for-backup-basic-scenario"),
    ("169 CronJob for regular backups", "kubernetes-169-cronjob-for-regular-backups"),
    ("170 Data restore basics", "kubernetes-170-data-restore-basics"),
    ("171 Storage antipatterns in Kubernetes", "kubernetes-171-storage-antipatterns-in-kubernetes"),
    ("172 Mini checklist for stateful services", "kubernetes-172-mini-checklist-for-stateful-services"),
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
