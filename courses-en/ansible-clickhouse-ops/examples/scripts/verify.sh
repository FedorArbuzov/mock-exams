#!/usr/bin/env bash
# Finale checklist. Run on the LXD host after lesson 19.
set -euo pipefail
ROOT="${NIMBUS_CH_DIR:-$HOME/nimbus-ch}"

ansible -i "$ROOT/inventory/hosts.yml" clickhouse -m ping || {
  echo "FAIL: ping"
  exit 1
}
echo "OK: ping"

ansible -i "$ROOT/inventory/hosts.yml" ch-01 -b -m command \
  -a "clickhouse-client --query \"SELECT count() FROM system.clusters WHERE cluster='nimbus'\"" \
  | grep -q '3' && echo "OK: nimbus 3 rows" || echo "WARN: system.clusters (run the query yourself)"

ansible -i "$ROOT/inventory/hosts.yml" ch-01 -b -m command \
  -a "clickhouse-client --query \"EXISTS TABLE shop.events\"" \
  | grep -q '1' && echo "OK: shop.events" || echo "FAIL: shop.events missing"

[[ -d "$ROOT/backups" ]] && ls "$ROOT/backups" | grep -q . && echo "OK: backups/" || echo "WARN: no backup stamp"

echo "OK: verify.sh finished — also run system.replicas and audit.yml yourself"
