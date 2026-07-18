#!/usr/bin/env bash
# Создаёт .venv-pdf и ставит зависимости для сборки PDF курсов.
# Запуск из корня репозитория:  ./scripts/setup-pdf-env.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv-pdf"
REQ="$ROOT/scripts/requirements-pdf.txt"

cd "$ROOT"

command -v python3 >/dev/null || command -v python >/dev/null || {
  echo "python не найден" >&2
  exit 1
}
PY="$(command -v python3 2>/dev/null || command -v python)"

if [[ ! -d "$VENV" ]]; then
  echo "Создаю venv: $VENV"
  "$PY" -m venv "$VENV"
fi

# shellcheck source=/dev/null
source "$VENV/bin/activate"
pip install -r "$REQ"
playwright install chromium

echo ""
echo "Готово. Дальше:"
echo "  source .venv-pdf/bin/activate"
echo "  python scripts/build-courses-pdf.py"
