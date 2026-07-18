#!/usr/bin/env python3
"""Local reel viewer — serves chapter-root *.mp4 from videos/ and videos-go/."""

from __future__ import annotations

import json
import mimetypes
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
SERIES = {
    "k8s": REPO / "videos",
    "go": REPO / "videos-go",
}
PORT = 8765
CHAPTER_NUM = re.compile(r"^(\d+)\b")


def natural_key(name: str) -> tuple[int, str]:
    m = CHAPTER_NUM.match(name)
    return (int(m.group(1)) if m else 10**9, name.lower())


def discover_reels() -> list[dict]:
    reels: list[dict] = []
    for series_id, base in SERIES.items():
        if not base.is_dir():
            continue
        for chapter in sorted(base.iterdir(), key=lambda p: natural_key(p.name)):
            if not chapter.is_dir():
                continue
            mp4s = sorted(
                (p for p in chapter.iterdir() if p.is_file() and p.suffix.lower() == ".mp4"),
                key=lambda p: p.name.lower(),
            )
            for mp4 in mp4s:
                rel = mp4.relative_to(REPO).as_posix()
                reels.append(
                    {
                        "id": f"{series_id}:{chapter.name}:{mp4.name}",
                        "series": series_id,
                        "title": chapter.name,
                        "file": mp4.name,
                        "url": f"/media/{rel}",
                    }
                )
    return reels


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path in ("/", "/index.html"):
            self._send_file(ROOT / "index.html", "text/html; charset=utf-8")
            return

        if path == "/api/reels":
            body = json.dumps(discover_reels(), ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        if path.startswith("/media/"):
            rel = path[len("/media/") :]
            file_path = (REPO / rel).resolve()
            try:
                file_path.relative_to(REPO.resolve())
            except ValueError:
                self.send_error(403)
                return
            if not file_path.is_file() or file_path.suffix.lower() != ".mp4":
                self.send_error(404)
                return
            ctype = mimetypes.guess_type(str(file_path))[0] or "video/mp4"
            self._send_file(file_path, ctype, allow_range=True)
            return

        super().do_GET()

    def _send_file(
        self, file_path: Path, content_type: str, *, allow_range: bool = False
    ) -> None:
        size = file_path.stat().st_size
        range_header = self.headers.get("Range") if allow_range else None

        if range_header and range_header.startswith("bytes="):
            try:
                start_s, end_s = range_header.replace("bytes=", "").split("-", 1)
                start = int(start_s) if start_s else 0
                end = int(end_s) if end_s else size - 1
            except ValueError:
                self.send_error(400)
                return
            end = min(end, size - 1)
            if start > end or start < 0:
                self.send_error(416)
                return
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(length))
            self.send_header("Content-Type", content_type)
            self.end_headers()
            with file_path.open("rb") as f:
                f.seek(start)
                remaining = length
                while remaining:
                    chunk = f.read(min(1024 * 256, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(size))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        with file_path.open("rb") as f:
            while True:
                chunk = f.read(1024 * 256)
                if not chunk:
                    break
                self.wfile.write(chunk)


def main() -> None:
    reels = discover_reels()
    print(f"Found {len(reels)} reel(s)")
    for r in reels:
        print(f"  [{r['series']}] {r['title']} — {r['file']}")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"\nReel viewer: http://127.0.0.1:{PORT}/")
    print("Ctrl+C to stop\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
