#!/usr/bin/env python3
"""Batch TTS for all terraform shorts + sync durations into content.ts."""

from __future__ import annotations

import asyncio
import re
import sys
from pathlib import Path

import edge_tts

try:
    from mutagen.mp3 import MP3
except ImportError:
    MP3 = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
VOICE = "en-US-GuyNeural"
VIDEOS = ROOT / "videos-terraform"
AUDIO_PUB = ROOT / "remotion" / "public" / "audio" / "terraform"
EPISODES = ROOT / "remotion" / "src" / "series" / "terraform" / "episodes"


def episode_dirs() -> list[Path]:
    dirs = []
    for p in VIDEOS.iterdir():
        if not p.is_dir():
            continue
        m = re.match(r"^(\d+)\s+", p.name)
        if m:
            dirs.append((int(m.group(1)), p))
    dirs.sort(key=lambda x: x[0])
    return [p for _, p in dirs]


def find_slug(n: int) -> str | None:
    prefix = f"{n:03d}-"
    for p in EPISODES.iterdir():
        if p.is_dir() and p.name.startswith(prefix):
            return p.name
    return None


async def synth(text: str, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(str(out))


def set_duration(slug: str, seconds: float) -> None:
    content = EPISODES / slug / "content.ts"
    if not content.exists():
        return
    text = content.read_text(encoding="utf-8")
    text2, n = re.subn(
        r"export const AUDIO_DURATION_SECONDS = [0-9.]+;",
        f"export const AUDIO_DURATION_SECONDS = {seconds:.2f};",
        text,
        count=1,
    )
    if n:
        content.write_text(text2, encoding="utf-8")


async def main() -> None:
    AUDIO_PUB.mkdir(parents=True, exist_ok=True)
    dirs = episode_dirs()
    print(f"TTS for {len(dirs)} episodes...", flush=True)
    for folder in dirs:
        m = re.match(r"^(\d+)\s+", folder.name)
        n = int(m.group(1)) if m else 0
        slug = find_slug(n)
        if not slug:
            print(f"SKIP no slug for {folder.name}", flush=True)
            continue
        script = folder / "script.txt"
        text = script.read_text(encoding="utf-8").strip()
        local = folder / "audio" / f"short-{n:03d}.mp3"
        dest = AUDIO_PUB / f"{slug}.mp3"
        if local.exists() and dest.exists() and local.stat().st_size > 1000:
            if MP3 is not None:
                dur = float(MP3(local).info.length)
                set_duration(slug, dur)
            print(f"[{n:03d}] skip existing {slug}", flush=True)
            continue
        print(f"[{n:03d}] {slug}", flush=True)
        await synth(text, local)
        dest.write_bytes(local.read_bytes())
        if MP3 is not None:
            dur = float(MP3(local).info.length)
            set_duration(slug, dur)
            print(f"       {dur:.2f}s", flush=True)
    print("done", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
