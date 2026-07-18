#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/lambda/build"
rm -rf "$BUILD" "$ROOT/lambda.zip"
mkdir -p "$BUILD"
pip install -r "$ROOT/lambda/requirements.txt" -t "$BUILD" --quiet
cp "$ROOT/lambda/handler.py" "$BUILD/"
(cd "$BUILD" && zip -r "$ROOT/lambda.zip" .)
echo "Built $ROOT/lambda.zip"
