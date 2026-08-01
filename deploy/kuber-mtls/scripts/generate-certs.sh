#!/usr/bin/env bash
# Generate TLS server cert, client CA, valid client cert, and wrong-CA client cert.
set -euo pipefail

OUT="${1:-./certs}"
HOST="${HOST:-oad.lab.local}"
DAYS=825

mkdir -p "$OUT"
cd "$OUT"

echo "==> Server TLS for $HOST"
openssl req -x509 -nodes -newkey rsa:2048 -days "$DAYS" \
  -keyout server.key -out server.crt \
  -subj "/CN=${HOST}" \
  -addext "subjectAltName=DNS:${HOST}"

echo "==> Client CA"
openssl req -x509 -nodes -newkey rsa:2048 -days "$DAYS" \
  -keyout client-ca.key -out client-ca.crt \
  -subj "/CN=OAD Lab Client CA"

echo "==> Valid client cert"
openssl req -nodes -newkey rsa:2048 -keyout client.key -out client.csr \
  -subj "/CN=oad-customer-01"
openssl x509 -req -in client.csr -CA client-ca.crt -CAkey client-ca.key -CAcreateserial \
  -out client.crt -days "$DAYS"

echo "==> Wrong client cert (other CA)"
openssl req -x509 -nodes -newkey rsa:2048 -days "$DAYS" \
  -keyout wrong-ca.key -out wrong-ca.crt \
  -subj "/CN=Wrong CA"
openssl req -nodes -newkey rsa:2048 -keyout wrong-client.key -out wrong-client.csr \
  -subj "/CN=intruder"
openssl x509 -req -in wrong-client.csr -CA wrong-ca.crt -CAkey wrong-ca.key -CAcreateserial \
  -out wrong-client.crt -days "$DAYS"

rm -f client.csr wrong-client.csr
echo "Done. Files in $(pwd)"
