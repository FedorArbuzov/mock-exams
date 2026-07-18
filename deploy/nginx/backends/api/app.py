#!/usr/bin/env python3
"""Minimal API backend for nginx labs."""
import time
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok\n")
            return
        if self.path == "/slow":
            time.sleep(0.3)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"slow ok\n")
            return
        if self.path == "/hits":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"hits": 1}\n')
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt, *args):
        return


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
