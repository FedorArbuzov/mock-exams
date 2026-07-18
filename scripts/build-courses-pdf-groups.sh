#!/usr/bin/env bash
# Build PDF for each course area (dist/*.pdf).
# Run from repo root:
#   source .venv-pdf/bin/activate
#   ./scripts/build-courses-pdf-groups.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PYTHON="$ROOT/.venv-pdf/bin/python"
SCRIPT="$ROOT/scripts/build-courses-pdf.py"

[[ -x "$PYTHON" ]] || { echo "Run ./scripts/setup-pdf-env.sh first" >&2; exit 1; }

groups=(
  kubernetes linux aws gitlab postgresql
  kafka redis observability messaging platform theory
)

cd "$ROOT"
mkdir -p dist

for g in "${groups[@]}"; do
  echo "=== $g ==="
  "$PYTHON" "$SCRIPT" --group "$g"
done

echo ""
echo "Done. Output: $ROOT/dist/"
ls -lh dist/*.pdf
