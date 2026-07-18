#!/usr/bin/env bash
# Build self-contained mockctl binaries with the courses/ tree baked in
# (requires local Go). Output: dist/mockctl-<os>-<arch>-embed[.exe].
#
# go:embed can't reach ../courses, so we stage a copy at mockctl/courses/
# (gitignored) for the duration of the build and remove it afterwards.
set -euo pipefail

cd "$(dirname "$0")"
here="$(pwd)"
src_courses="$here/../courses"
staged="$here/courses"

if [ ! -d "$src_courses" ]; then
  echo "courses/ not found at $src_courses" >&2
  exit 1
fi

mkdir -p dist

cleanup() { rm -rf "$staged"; }
trap cleanup EXIT

rm -rf "$staged"
cp -R "$src_courses" "$staged"
# Drop heavy, non-teaching junk so it doesn't bloat the binary (courses/ is
# ~270 MB on disk, mostly node_modules and virtualenvs in example projects).
find "$staged" \( \
  -type d \( -name node_modules -o -name .venv -o -name venv -o -name env \
    -o -name __pycache__ -o -name .pytest_cache -o -name .mypy_cache \
    -o -name .ruff_cache -o -name dist -o -name build -o -name out \
    -o -name .next -o -name target -o -name .git -o -name coverage \
    -o -name .nyc_output \) \
  \) -prune -exec rm -rf {} +
find "$staged" \( -name '*.pyc' -o -name '.DS_Store' \) -type f -delete
echo "Staged courses -> $staged"

echo "Building (embed)..."
GOOS=windows GOARCH=amd64 go build -tags embed -trimpath -ldflags "-s -w" -o dist/mockctl-windows-amd64-embed.exe .
GOOS=linux   GOARCH=amd64 go build -tags embed -trimpath -ldflags "-s -w" -o dist/mockctl-linux-amd64-embed .
GOOS=linux   GOARCH=arm64 go build -tags embed -trimpath -ldflags "-s -w" -o dist/mockctl-linux-arm64-embed .
GOOS=darwin  GOARCH=amd64 go build -tags embed -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-amd64-embed .
GOOS=darwin  GOARCH=arm64 go build -tags embed -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-arm64-embed .

echo "Done:"
ls -la dist
