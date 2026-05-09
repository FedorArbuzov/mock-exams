#!/usr/bin/env bash
# Build mockctl using Docker (no local Go toolchain required).
# Works on Linux, macOS and Git Bash on Windows.
set -euo pipefail

# Disable MSYS path conversion (Git Bash on Windows rewrites /src -> C:/Program Files/Git/src).
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

cd "$(dirname "$0")"
mkdir -p dist

IMAGE="${GOLANG_IMAGE:-golang:1.23-bookworm}"

# Resolve host path. On Git Bash `pwd` returns POSIX-style (/c/Users/...);
# `pwd -W` returns Windows-style (C:/Users/...) which Docker Desktop expects.
if command -v cygpath >/dev/null 2>&1; then
  HOST_DIR="$(cygpath -w "$(pwd)")"
elif pwd -W >/dev/null 2>&1; then
  HOST_DIR="$(pwd -W)"
else
  HOST_DIR="$(pwd)"
fi

echo "Using image: $IMAGE"
echo "Mounting:    $HOST_DIR -> /src"

docker run --rm \
  -v "${HOST_DIR}:/src" \
  -w //src \
  "$IMAGE" \
  bash -ce '
    set -e
    mkdir -p dist
    GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-windows-amd64.exe .
    GOOS=linux   GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-linux-amd64 .
    GOOS=linux   GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-linux-arm64 .
    GOOS=darwin  GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-amd64 .
    GOOS=darwin  GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-arm64 .
    ls -la dist
  '

echo "Done: binaries in ./dist"
