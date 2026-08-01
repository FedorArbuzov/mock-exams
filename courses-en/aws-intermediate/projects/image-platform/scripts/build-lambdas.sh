#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Worker with Pillow
BUILD="$ROOT/lambda/build"
rm -rf "$BUILD" "$ROOT/lambda.zip"
mkdir -p "$BUILD"
pip install -r "$ROOT/lambda/requirements.txt" -t "$BUILD" --quiet
cp "$ROOT/lambda/handler.py" "$BUILD/"
(cd "$BUILD" && zip -r "$ROOT/lambda.zip" .)

# API handler only
rm -f "$ROOT/lambda-api.zip"
(cd "$ROOT/lambda-api" && zip -j "$ROOT/lambda-api.zip" api_handler.py)

echo "Built lambda.zip and lambda-api.zip"
