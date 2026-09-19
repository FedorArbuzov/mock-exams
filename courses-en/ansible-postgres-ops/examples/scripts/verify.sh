#!/usr/bin/env bash
set -euo pipefail
ROOT="${NIMBUS_PG_DIR:-$HOME/nimbus-pg}"

ansible -i "$ROOT/inventory/hosts.ini" postgres_cluster -m ping || {
  echo "FAIL: ping"
  exit 1
}
echo "OK: ping"

[[ -d "$ROOT/backups" ]] && ls "$ROOT/backups" | grep -q . && echo "OK: backups/" || echo "WARN: no backup stamp"

echo "OK: verify.sh finished — also run patronictl list and objects.yml yourself"
