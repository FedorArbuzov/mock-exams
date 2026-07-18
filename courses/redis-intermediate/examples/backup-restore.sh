#!/usr/bin/env bash
# Backup / restore для deploy/redis (single instance, mock-redis)
# Использование:
#   ./backup-restore.sh backup ./backups
#   ./backup-restore.sh restore ./backups/dump-20260518.rdb

set -euo pipefail

CONTAINER="${REDIS_CONTAINER:-mock-redis}"
ACTION="${1:-}"
DEST="${2:-./backups}"

backup() {
  mkdir -p "$DEST"
  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  local out="${DEST}/dump-${ts}.rdb"

  echo "==> BGSAVE on ${CONTAINER}"
  docker exec "$CONTAINER" redis-cli BGSAVE
  echo "==> waiting for save to finish"
  until docker exec "$CONTAINER" redis-cli INFO persistence | grep -q 'rdb_bgsave_in_progress:0'; do
    sleep 1
  done

  local rdb_path
  rdb_path="$(docker exec "$CONTAINER" redis-cli CONFIG GET dir | tail -1)/dump.rdb"
  echo "==> copying ${rdb_path} -> ${out}"
  docker cp "${CONTAINER}:${rdb_path}" "$out"
  echo "Backup: $out"
}

restore() {
  local file="$DEST"
  if [[ ! -f "$file" ]]; then
    echo "File not found: $file" >&2
    exit 1
  fi

  echo "==> stopping writes (SHUTDOWN NOSAVE would drop data — используем copy + restart)"
  local rdb_path
  rdb_path="$(docker exec "$CONTAINER" redis-cli CONFIG GET dir | tail -1)/dump.rdb"
  docker cp "$file" "${CONTAINER}:${rdb_path}"
  docker restart "$CONTAINER"
  echo "==> waiting for PING"
  until docker exec "$CONTAINER" redis-cli PING 2>/dev/null | grep -q PONG; do
    sleep 1
  done
  echo "Restore complete from $file"
}

case "$ACTION" in
  backup)  backup ;;
  restore) restore ;;
  *)
    echo "Usage: $0 backup [dir] | restore <path-to.rdb>" >&2
    exit 1
    ;;
esac
