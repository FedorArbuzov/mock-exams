#!/usr/bin/env bash
# Finale checklist. Run on the LXD host; kafka-topics must reach 192.168.57.10:9092.
set -euo pipefail

BS="${NIMBUS_BOOTSTRAP:-192.168.57.10:9092}"
BIN="${NIMBUS_KAFKA_TOPICS:-kafka-topics}"

"$BIN" --bootstrap-server "$BS" --list | grep -q 'shop.orders' || { echo "FAIL: shop.orders missing"; exit 1; }
"$BIN" --bootstrap-server "$BS" --list | grep -q 'shop.dead' || { echo "FAIL: shop.dead missing"; exit 1; }
echo "OK: topics present"

urp="$("$BIN" --bootstrap-server "$BS" --describe --under-replicated-partitions || true)"
[[ -z "${urp// }" ]] || { echo "FAIL: URP:"; echo "$urp"; exit 1; }
echo "OK: no under-replicated partitions"

desc="$("$BIN" --bootstrap-server "$BS" --describe --topic shop.orders)"
echo "$desc" | grep -Eq 'ReplicationFactor: ?3' || { echo "FAIL: RF!=3"; echo "$desc"; exit 1; }
echo "OK: shop.orders RF=3"

echo "OK: verify.sh finished"
