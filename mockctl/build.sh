#!/usr/bin/env bash
# Cross-compile mockctl into ./dist (requires local Go).
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p dist

echo "Building..."
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-windows-amd64.exe .
GOOS=linux   GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-linux-amd64 .
GOOS=linux   GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-linux-arm64 .
GOOS=darwin  GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-amd64 .
GOOS=darwin  GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-arm64 .

echo "Done:"
ls -la dist
