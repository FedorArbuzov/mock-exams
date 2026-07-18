#!/usr/bin/env bash
# Smoke test for deploy/kafka (run on host after compose up)
set -euo pipefail

BOOTSTRAP="${BOOTSTRAP:-localhost:9094}"
TOPIC="smoke-$(date +%s)"

echo "== bootstrap: $BOOTSTRAP =="
docker compose ps 2>/dev/null || true

if command -v kafka-topics.sh >/dev/null 2>&1; then
  KAFKA_TOPICS=kafka-topics.sh
elif docker ps --format '{{.Names}}' | grep -q '^mock-kafka$'; then
  KAFKA_TOPICS="docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh"
else
  echo "Start stack: cd deploy/kafka && docker compose up -d"
  exit 1
fi

# shellcheck disable=SC2086
$KAFKA_TOPICS --bootstrap-server "$BOOTSTRAP" --create --topic "$TOPIC" --partitions 3 --replication-factor 1

# shellcheck disable=SC2086
$KAFKA_TOPICS --bootstrap-server "$BOOTSTRAP" --list | grep -F "$TOPIC"

echo "OK: topic $TOPIC created"
