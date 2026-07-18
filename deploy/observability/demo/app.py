#!/usr/bin/env python3
"""Minimal demo app for observability labs — exposes Prometheus metrics on :8000/metrics."""
import random
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

REQUESTS = Counter("demo_http_requests_total", "HTTP requests", ["method", "path", "status"])
IN_PROGRESS = Gauge("demo_http_in_progress", "In-flight requests")
LATENCY = Histogram(
    "demo_http_request_duration_seconds",
    "Request latency",
    ["path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0),
)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        path = self.path.split("?")[0]
        if path == "/metrics":
            self.send_response(200)
            self.send_header("Content-Type", CONTENT_TYPE_LATEST)
            self.end_headers()
            self.wfile.write(generate_latest())
            return
        if path in ("/", "/health"):
            IN_PROGRESS.inc()
            time.sleep(random.uniform(0.01, 0.15))
            status = "200"
            REQUESTS.labels("GET", path, status).inc()
            LATENCY.labels(path).observe(random.uniform(0.01, 0.2))
            IN_PROGRESS.dec()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok\n")
            return
        REQUESTS.labels("GET", path, "404").inc()
        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt, *args):  # noqa: D401
        return


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
