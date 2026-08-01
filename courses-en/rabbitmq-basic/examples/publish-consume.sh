#!/usr/bin/env bash
# Snippets for the rabbitmq-basic labs. Usage:
#   source courses/rabbitmq-basic/examples/publish-consume.sh
#   rmq_smoke
#   rmq_declare_direct lab.orders lab.orders.q orders.created

set -euo pipefail

: "${RMQ_CONTAINER:=mock-rabbitmq}"
: "${RMQ_USER:=course}"
: "${RMQ_PASS:=course}"
: "${RMQ_VHOST:=/}"

_rmqadmin() {
  docker exec "$RMQ_CONTAINER" rabbitmqadmin -u "$RMQ_USER" -p "$RMQ_PASS" -V "$RMQ_VHOST" "$@"
}

rmq_smoke() {
  docker exec "$RMQ_CONTAINER" rabbitmq-diagnostics -q ping
  _rmqadmin list exchanges name type | head -5
}

# declare_direct EXCHANGE QUEUE ROUTING_KEY
rmq_declare_direct() {
  local ex="$1" q="$2" rk="$3"
  _rmqadmin declare exchange name="$ex" type=direct durable=true
  _rmqadmin declare queue name="$q" durable=true
  _rmqadmin declare binding source="$ex" destination="$q" routing_key="$rk"
}

# declare_fanout EXCHANGE QUEUE
rmq_declare_fanout() {
  local ex="$1" q="$2"
  _rmqadmin declare exchange name="$ex" type=fanout durable=true
  _rmqadmin declare queue name="$q" durable=true
  _rmqadmin declare binding source="$ex" destination="$q"
}

# publish EXCHANGE ROUTING_KEY PAYLOAD
rmq_publish() {
  local ex="$1" rk="$2" payload="$3"
  _rmqadmin publish exchange="$ex" routing_key="$rk" payload="$payload"
}

# get QUEUE [ackmode=ack_requeue_true]
rmq_get() {
  local q="$1"
  local ack="${2:-ack_requeue_true}"
  _rmqadmin get queue="$q" ackmode="$ack" count=1
}

# purge QUEUE
rmq_purge() {
  _rmqadmin purge queue name="$1"
}

# delete queue and exchange (lab reset)
rmq_delete_lab() {
  local q="$1" ex="$2"
  _rmqadmin delete queue name="$q" 2>/dev/null || true
  _rmqadmin delete exchange name="$ex" 2>/dev/null || true
}

rmq_list_queues() {
  docker exec "$RMQ_CONTAINER" rabbitmqctl list_queues name messages consumers
}
