#!/usr/bin/env bash
# Render every Kubernetes short that does not yet have a rendered video.
#
# It scans the registered episodes and only renders the ones whose
# videos/<N ...>/kubernetes-reel.mp4 is still missing, then copies + verifies.
#
# From repo root:
#   bash scripts/render-k8s-missing.sh
#
# Options:
#   CONCURRENCY=4 bash scripts/render-k8s-missing.sh   # parallelism per render
#   bash scripts/render-k8s-missing.sh --dry-run       # only list what is missing

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 "$ROOT/scripts/render-k8s-missing.py" "$@"
