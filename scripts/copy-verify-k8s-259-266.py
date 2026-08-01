#!/usr/bin/env python3
"""Copy rendered 259-266 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("259 What happens if you kill kubelet", "kubernetes-259-what-happens-if-you-kill-kubelet"),
    ("260 How is Service different from Ingress", "kubernetes-260-how-is-service-different-from-ingress"),
    ("261 Requests vs Limits ideal answer", "kubernetes-261-requests-vs-limits-ideal-answer"),
    ("262 Myth roundup 5 dangerous beginner shortcuts", "kubernetes-262-myth-roundup-5-dangerous-beginner-shortcuts"),
    ("263 Checklist ready for a junior role", "kubernetes-263-checklist-ready-for-a-junior-role"),
    ("264 Mini project one app end-to-end", "kubernetes-264-mini-project-one-app-end-to-end"),
    ("265 Mini project break it and fix it", "kubernetes-265-mini-project-break-it-and-fix-it"),
    ("266 What next after the course", "kubernetes-266-what-next-after-the-course"),
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
