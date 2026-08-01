#!/usr/bin/env python3
"""Render every Kubernetes short that does not yet have a video.

Scans the registered episodes in the Remotion index, maps each to its
videos/<N ...> folder by the leading number, and renders only those whose
kubernetes-reel.mp4 is missing. After each render it copies the file into the
video folder and verifies the moov atom + size match.

Usage (from repo root, on the VM):
    python3 scripts/render-k8s-missing.py
    CONCURRENCY=4 python3 scripts/render-k8s-missing.py
    python3 scripts/render-k8s-missing.py --dry-run     # just list what is missing
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REM = ROOT / "remotion"
VIDEOS = ROOT / "videos"
OUT = REM / "out"
INDEX = REM / "src" / "series" / "kubernetes" / "episodes" / "index.ts"

CONCURRENCY = os.environ.get("CONCURRENCY", "2")
DRY_RUN = "--dry-run" in sys.argv


def episode_ids() -> list[str]:
    text = INDEX.read_text(encoding="utf-8")
    return re.findall(r'id:\s*"(kubernetes-[^"]+)"', text)


def folder_by_number() -> dict[int, Path]:
    mapping: dict[int, Path] = {}
    for d in VIDEOS.iterdir():
        if not d.is_dir():
            continue
        m = re.match(r"(\d+)\s", d.name)
        if m:
            mapping[int(m.group(1))] = d
    return mapping


def episode_number(ep_id: str) -> int | None:
    m = re.match(r"kubernetes-(\d+)-", ep_id)
    return int(m.group(1)) if m else None


def has_moov(p: Path) -> bool:
    data = p.read_bytes()[:200000] + p.read_bytes()[-200000:]
    return b"moov" in data


def main() -> None:
    ids = episode_ids()
    folders = folder_by_number()

    missing: list[tuple[str, Path]] = []
    unmatched: list[str] = []
    for ep_id in ids:
        num = episode_number(ep_id)
        folder = folders.get(num) if num is not None else None
        if folder is None:
            unmatched.append(ep_id)
            continue
        if not (folder / "kubernetes-reel.mp4").exists():
            missing.append((ep_id, folder))

    if unmatched:
        print(f"[WARN] {len(unmatched)} episode ids had no matching video folder:")
        for ep_id in unmatched:
            print(f"       {ep_id}")

    print(f"Total registered: {len(ids)} | already rendered: {len(ids) - len(missing) - len(unmatched)} | missing: {len(missing)}")

    if DRY_RUN or not missing:
        for ep_id, folder in missing:
            print(f"[MISSING] {ep_id}  ->  {folder.name}")
        if not missing:
            print("Nothing to render.")
        return

    OUT.mkdir(parents=True, exist_ok=True)
    failures: list[str] = []

    for i, (ep_id, folder) in enumerate(missing, 1):
        print(f"\n=== [{i}/{len(missing)}] render {ep_id} ===")
        out_file = OUT / f"{ep_id}.mp4"
        cmd = [
            "npx", "remotion", "render", "src/index.ts", ep_id,
            f"out/{ep_id}.mp4", f"--concurrency={CONCURRENCY}",
        ]
        result = subprocess.run(cmd, cwd=REM, shell=(os.name == "nt"))
        if result.returncode != 0 or not out_file.exists():
            print(f"[FAIL] render failed: {ep_id}")
            failures.append(ep_id)
            continue

        dst = folder / "kubernetes-reel.mp4"
        dst.write_bytes(out_file.read_bytes())
        match = out_file.stat().st_size == dst.stat().st_size
        moov = has_moov(dst)
        flag = "OK" if (moov and match) else "FAIL"
        if flag != "OK":
            failures.append(ep_id)
        print(f"[{flag}] {folder.name}: {dst.stat().st_size / 1_000_000:.1f} MB  moov={moov} match={match}")

    print("\n==============================")
    if failures:
        print(f"DONE with {len(failures)} failure(s):")
        for f in failures:
            print(f"  {f}")
        raise SystemExit(1)
    print(f"ALL {len(missing)} rendered OK")


if __name__ == "__main__":
    main()
