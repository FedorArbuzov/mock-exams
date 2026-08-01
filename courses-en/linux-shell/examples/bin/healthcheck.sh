#!/usr/bin/env bash
# Healthcheck for deploy/linux lab — lesson 04, 15
set -euo pipefail

HOST="${1:?usage: $0 HOST [PORT] [PATH]}"
PORT="${2:-80}"
PATH_URL="${3:-/}"

log() {
  echo "[$(date -Iseconds)] $*" >&2
}

check_tcp() {
  timeout 3 bash -c "echo >/dev/tcp/${HOST}/${PORT}" 2>/dev/null
}

check_http() {
  local code
  code=$(curl -sf -o /dev/null -w '%{http_code}' \
    --connect-timeout 5 --max-time 10 \
    "http://${HOST}:${PORT}${PATH_URL}" 2>/dev/null || echo "000")
  [[ "$code" == "200" ]]
}

main() {
  log "healthcheck ${HOST}:${PORT}${PATH_URL}"
  if check_tcp; then
    log "tcp ok"
  else
    log "tcp failed"
    return 1
  fi
  if check_http; then
    log "http 200 ok"
  else
    log "http failed"
    return 1
  fi
  # Optional SSH — skip if no key
  if ssh -o BatchMode=yes -o ConnectTimeout=3 "course@${HOST}" true 2>/dev/null; then
    log "ssh ok"
  else
    log "ssh skip (no key or port closed)"
  fi
  echo "OK"
}

main "$@"
