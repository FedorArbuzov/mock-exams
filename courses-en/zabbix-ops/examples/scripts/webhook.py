#!/usr/bin/env python3
"""Lab action target. Listen :8099, append one JSON line per POST."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import datetime

LOG = Path(__file__).resolve().parents[1] / "artifacts" / "actions.log"
LOG.parent.mkdir(parents=True, exist_ok=True)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8", errors="replace")
        line = f"{datetime.datetime.now(datetime.timezone.utc).isoformat()} {body}\n"
        LOG.write_text(LOG.read_text() + line if LOG.exists() else line)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok\n")

    def log_message(self, fmt, *args):
        return


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8099), Handler).serve_forever()
