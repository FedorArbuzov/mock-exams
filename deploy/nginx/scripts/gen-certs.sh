#!/usr/bin/env bash
# Self-signed cert for TLS labs (localhost + lab.local)
set -euo pipefail
cd "$(dirname "$0")/../certs"
mkdir -p .

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/CN=lab.local" \
  -addext "subjectAltName=DNS:localhost,DNS:lab.local,IP:127.0.0.1"

chmod 644 server.crt
chmod 600 server.key
echo "OK: certs/server.crt and server.key"
