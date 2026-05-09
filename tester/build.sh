#!/usr/bin/env bash
# Cross-compile four binaries into ./dist:
#   windows/amd64, linux/amd64, darwin/amd64, darwin/arm64
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p dist

echo "Building..."
GOOS=windows GOARCH=amd64 go build -trimpath -o dist/tester-windows-amd64.exe .
GOOS=linux   GOARCH=amd64 go build -trimpath -o dist/tester-linux-amd64 .
GOOS=darwin  GOARCH=amd64 go build -trimpath -o dist/tester-darwin-amd64 .
GOOS=darwin  GOARCH=arm64 go build -trimpath -o dist/tester-darwin-arm64 .

echo "Done:"
ls -la dist
