#!/usr/bin/env bash
# Create Redis Cluster after docker-compose.cluster.yml is healthy
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Waiting for nodes..."
sleep 3

docker exec mock-redis-cluster-1 redis-cli --cluster create \
  redis-1:6379 redis-2:6379 redis-3:6379 \
  redis-4:6379 redis-5:6379 redis-6:6379 \
  --cluster-replicas 1 --cluster-yes

echo "Cluster info:"
docker exec mock-redis-cluster-1 redis-cli -c -h redis-1 -p 6379 cluster info
