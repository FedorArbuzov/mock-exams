#!/usr/bin/env bash
# Local build + run of mockctl-web (no GHCR).
#
# From repo root:
#   ./scripts/dev-mockctl-web.sh
#
# Env:
#   MOCKCTL_WEB_PORT  — host port (default 8091)
#   MOCKCTL_WEB_IMAGE — local tag (default mock-exams/mockctl-web:local)
#   SKIP_BUILD=1      — reuse existing image

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${MOCKCTL_WEB_IMAGE:-mock-exams/mockctl-web:local}"
PORT="${MOCKCTL_WEB_PORT:-8091}"
KUBECONFIG_HOST="${HOME}/.mock-exams/kubeconfig.yaml"
CONTAINER="mockctl-web"

cd "$ROOT"

docker info >/dev/null 2>&1 || { echo "Start Docker Desktop first." >&2; exit 1; }

if ! kubectl config get-contexts -o name 2>/dev/null | grep -qx 'docker-desktop'; then
  echo "Enable Kubernetes in Docker Desktop." >&2
  exit 1
fi

kubectl config use-context docker-desktop >/dev/null
kubectl get nodes

mkdir -p "$(dirname "$KUBECONFIG_HOST")"
kubectl config view --minify --flatten --context=docker-desktop >"$KUBECONFIG_HOST"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "Building $IMAGE ..."
  docker build -f deploy/mockctl-web/Dockerfile -t "$IMAGE" .
fi

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

run_args=(
  -d
  --name "$CONTAINER"
  --restart unless-stopped
  -p "${PORT}:8091"
  -v "${KUBECONFIG_HOST}:/kube/host-kubeconfig.yaml:ro"
)
if [ "$(uname -s)" = "Linux" ]; then
  run_args+=(--add-host host.docker.internal:host-gateway)
fi

docker run "${run_args[@]}" "$IMAGE"

sleep 2
docker exec "$CONTAINER" kubectl --kubeconfig=/work/output/kubeconfig.yaml get nodes

echo ""
echo "OK  http://127.0.0.1:${PORT}/"
echo "Rebuild: ./scripts/dev-mockctl-web.sh"
echo "Rerun only: SKIP_BUILD=1 ./scripts/dev-mockctl-web.sh"
echo "Stop: docker rm -f $CONTAINER"
echo "Logs: docker logs -f $CONTAINER"
