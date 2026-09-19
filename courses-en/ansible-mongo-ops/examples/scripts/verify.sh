#!/usr/bin/env bash
set -euo pipefail
ROOT="${NIMBUS_MONGO_DIR:-$HOME/nimbus-mongo}"

ansible -i "$ROOT/inventory/hosts.yml" mongo -m ping || {
  echo "FAIL: ping"
  exit 1
}
echo "OK: ping"

[[ -d "$ROOT/backups" ]] && ls "$ROOT/backups" | grep -q . && echo "OK: backups/" || echo "WARN: no backup stamp"

echo "OK: verify.sh finished — also run mongodb_status / rs.status() and objects.yml yourself"
