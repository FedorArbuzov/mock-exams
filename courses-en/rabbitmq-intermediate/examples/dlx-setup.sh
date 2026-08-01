#!/usr/bin/env bash
# DLX lab topology — run from repo root or courses/rabbitmq-intermediate/examples
# Requires: deploy/rabbitmq up, rabbitmqadmin in container or on host
set -euo pipefail

API="http://localhost:15672/api"
AUTH="course:course"
VHOST="%2F"

curl -sf -u "$AUTH" -H "content-type: application/json" \
  -X PUT "$API/exchanges/$VHOST/dlx.orders" \
  -d '{"type":"topic","durable":true}'

curl -sf -u "$AUTH" -H "content-type: application/json" \
  -X PUT "$API/queues/$VHOST/orders.dlq" \
  -d '{"durable":true,"auto_delete":false}'

curl -sf -u "$AUTH" -H "content-type: application/json" \
  -X PUT "$API/bindings/$VHOST/e/dlx.orders/q/orders.dlq" \
  -d '{"routing_key":"failed"}'

curl -sf -u "$AUTH" -H "content-type: application/json" \
  -X PUT "$API/queues/$VHOST/orders.work" \
  -d '{
    "durable": true,
    "auto_delete": false,
    "arguments": {
      "x-dead-letter-exchange": "dlx.orders",
      "x-dead-letter-routing-key": "failed"
    }
  }'

echo "OK: dlx.orders -> orders.dlq (rk failed), orders.work with DLX args"
