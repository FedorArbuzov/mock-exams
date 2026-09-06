#!/usr/bin/env bash
# verify-final.sh — checks for ansible-basic final project (run on lab container).
# Usage:
#   cd ~/ansible-lab
#   ./scripts/verify-final.sh
#   ./scripts/verify-final.sh --vault-password-file ~/.vault_pass_lab
set -euo pipefail

INVENTORY="${INVENTORY:-inventory/lab.ini}"
VAULT_FILE="${VAULT_FILE:-group_vars/all/vault.yml}"
WEB_IP="${WEB_IP:-172.28.0.20}"
APP_IP="${APP_IP:-172.28.0.11}"
APP_PORT="${APP_PORT:-8080}"
VHOST="${VHOST:-shop.lab.local}"

VAULT_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault-password-file)
      VAULT_ARGS=(--vault-password-file "$2")
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--vault-password-file PATH]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

fail=0
ok()   { echo "  OK  $*"; }
bad()  { echo "  FAIL $*"; fail=1; }
have() { command -v "$1" >/dev/null 2>&1; }

echo "== ansible-basic final verify =="
echo "inventory=$INVENTORY"
echo

if ! have ansible; then
  echo "ansible not found — run on lab container" >&2
  exit 1
fi

echo "-- connectivity --"
if ansible all -i "$INVENTORY" -m ping "${VAULT_ARGS[@]}" >/dev/null 2>&1; then
  ok "ansible ping all"
else
  bad "ansible ping all"
fi

echo "-- vault --"
if [[ -f "$VAULT_FILE" ]]; then
  if head -1 "$VAULT_FILE" | grep -q 'ANSIBLE_VAULT'; then
    ok "vault file encrypted ($VAULT_FILE)"
  else
    bad "vault file not encrypted ($VAULT_FILE)"
  fi
else
  bad "missing $VAULT_FILE"
fi

echo "-- app tier --"
for host in srv1 srv2; do
  if ansible "$host" -i "$INVENTORY" -m command -a 'test -f /etc/nimbus-configured' "${VAULT_ARGS[@]}" 2>/dev/null | grep -q 'SUCCESS'; then
    ok "marker on $host"
  else
    bad "marker /etc/nimbus-configured missing on $host"
  fi
done

if ansible srv1 -i "$INVENTORY" -m command -a 'id deploy' "${VAULT_ARGS[@]}" 2>/dev/null | grep -q 'uid='; then
  ok "deploy user on srv1"
else
  bad "deploy user missing on srv1"
fi

if ansible app -i "$INVENTORY" -b -m command -a 'systemctl is-active nimbus-app' "${VAULT_ARGS[@]}" 2>/dev/null | grep -q 'active'; then
  ok "nimbus-app.service active"
else
  bad "nimbus-app.service not active on app group"
fi

body=$(curl -fsS "http://${APP_IP}:${APP_PORT}/" 2>/dev/null || true)
if echo "$body" | grep -q 'nimbus-app'; then
  ok "app HTTP on ${APP_IP}:${APP_PORT}"
else
  bad "app HTTP missing nimbus-app on ${APP_IP}:${APP_PORT}"
fi

echo "-- web / nginx --"
if ansible web -i "$INVENTORY" -b -m command -a 'nginx -t' "${VAULT_ARGS[@]}" 2>/dev/null | grep -q 'successful'; then
  ok "nginx -t on web"
else
  bad "nginx config test failed on web"
fi

edge=$(curl -fsS -H "Host: ${VHOST}" "http://${WEB_IP}/" 2>/dev/null || true)
if echo "$edge" | grep -q 'nimbus-app'; then
  ok "proxy via web Host ${VHOST}"
else
  bad "proxy via web — expected nimbus-app in response"
fi

echo
if [[ $fail -eq 0 ]]; then
  echo "All automated checks passed."
  exit 0
else
  echo "Some checks failed."
  exit 1
fi
