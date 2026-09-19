#!/usr/bin/env bash
# Author picture — copy to ~/nimbus-zabbix/scripts/verify.sh and run from the repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

command -v ansible >/dev/null || fail "ansible missing"
ansible all -m ping --one-line | grep -c pong | grep -qx 3 || fail "expected three pong"

ansible monitored -m systemd -a "name=zabbix-agent2" --one-line | grep -c running \
  | grep -qx 3 || fail "zabbix-agent2 not running on all monitored hosts"

if [[ -f compose/docker-compose.yml ]]; then
  docker compose -f compose/docker-compose.yml ps --status running | grep -q zabbix-server \
    || fail "zabbix-server container not running"
else
  fail "compose/docker-compose.yml missing"
fi

curl -fsS -o /dev/null -m 10 http://127.0.0.1:8080/ || fail "web :8080 not answering"

ansible node-01 -m command -a "test -f /etc/zabbix/zabbix_agent2.d/userparameter_nimbus.conf" \
  || fail "UserParameter file missing on node-01"

ansible node-01 -m command -a "mountpoint /data" || fail "/data not mounted on node-01 (lesson 04)"

echo "OK: stand looks like a finished zabbix-ops lab"
