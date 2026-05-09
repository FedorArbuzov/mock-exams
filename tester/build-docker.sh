#!/usr/bin/env bash
# Build all four binaries using Docker (no local Go toolchain required).
# Requires: Docker Desktop / docker CLI
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p dist

IMAGE="${GOLANG_IMAGE:-golang:1.23-bookworm}"

echo "Using image: $IMAGE"
docker run --rm \
  -v "$(pwd)":/src \
  -w /src \
  "$IMAGE" \
  bash -ce '
    set -e
    mkdir -p dist
    GOOS=windows GOARCH=amd64 go build -trimpath -o dist/tester-windows-amd64.exe .
    GOOS=linux   GOARCH=amd64 go build -trimpath -o dist/tester-linux-amd64 .
    GOOS=darwin  GOARCH=amd64 go build -trimpath -o dist/tester-darwin-amd64 .
    GOOS=darwin  GOARCH=arm64 go build -trimpath -o dist/tester-darwin-arm64 .
    ls -la dist
  '

echo "Done: binaries in ./dist"
