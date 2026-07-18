#!/usr/bin/env python3
"""Local TTS generator for Shorts pipeline (Python 3.14 compatible)."""

from __future__ import annotations

import argparse
from pathlib import Path

import asyncio

import edge_tts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate speech audio from text using local Coqui TTS models."
    )
    parser.add_argument(
        "--text",
        type=str,
        default="",
        help="Raw text to synthesize. Use either --text or --input-file.",
    )
    parser.add_argument(
        "--input-file",
        type=Path,
        default=None,
        help="Path to UTF-8 text file with script content.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output audio file path (recommended: .mp3).",
    )
    parser.add_argument(
        "--voice",
        type=str,
        default="en-US-GuyNeural",
        help="Edge voice id, e.g. en-US-AriaNeural.",
    )
    parser.add_argument(
        "--rate",
        type=str,
        default="+0%",
        help="Speech rate, e.g. -10%%, +15%%.",
    )
    parser.add_argument(
        "--volume",
        type=str,
        default="+0%",
        help="Volume adjustment, e.g. -5%%, +0%%.",
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="Print available voices and exit.",
    )
    return parser.parse_args()


def read_input_text(raw_text: str, input_file: Path | None) -> str:
    if raw_text and input_file is not None:
        raise ValueError("Use only one input source: --text or --input-file.")
    if input_file is not None:
        if not input_file.exists():
            raise FileNotFoundError(f"Input file not found: {input_file}")
        text = input_file.read_text(encoding="utf-8").strip()
    else:
        text = raw_text.strip()

    if not text:
        raise ValueError("Empty text. Provide --text or a non-empty --input-file.")
    return text


async def list_voices() -> None:
    voices = await edge_tts.list_voices()
    for voice in voices:
        name = voice.get("ShortName", "")
        locale = voice.get("Locale", "")
        gender = voice.get("Gender", "")
        print(f"{name}\t{locale}\t{gender}")


async def generate_audio(
    text: str, output_path: Path, voice: str, rate: str, volume: str
) -> None:
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, volume=volume)
    await communicate.save(str(output_path))


def main() -> None:
    args = parse_args()

    if args.list_voices:
        asyncio.run(list_voices())
        return

    text = read_input_text(args.text, args.input_file)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    asyncio.run(
        generate_audio(
            text=text,
            output_path=args.output,
            voice=args.voice,
            rate=args.rate,
            volume=args.volume,
        )
    )
    print(f"Generated: {args.output}")


if __name__ == "__main__":
    main()
