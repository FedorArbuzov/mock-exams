#!/usr/bin/env bash
# Join rabbitmq-2 and rabbitmq-3 to rabbit@rabbitmq-1 (after cluster compose up)
set -euo pipefail

join_node() {
  local c="$1"
  local master="rabbit@rabbitmq-1"
  docker exec "$c" rabbitmqctl stop_app
  docker exec "$c" rabbitmqctl join_cluster "$master"
  docker exec "$c" rabbitmqctl start_app
  echo "Joined $c -> $master"
}

sleep 5
join_node mock-rabbitmq-2
join_node mock-rabbitmq-3
docker exec mock-rabbitmq-1 rabbitmqctl cluster_status
