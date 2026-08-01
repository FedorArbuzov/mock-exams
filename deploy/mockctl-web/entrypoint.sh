#!/bin/sh
set -e

# Host minikube kubeconfig uses 127.0.0.1; from inside Docker reach the API via host.docker.internal.
HOST_KC="${MOCKCTL_HOST_KUBECONFIG:-/kube/host-kubeconfig.yaml}"
CONTAINER_KC="/work/output/kubeconfig.yaml"

mkdir -p /work/output

if [ -f "$HOST_KC" ]; then
  cp "$HOST_KC" /tmp/kubeconfig.patched
  sed -i 's|https://127\.0\.0\.1:|https://host.docker.internal:|g' /tmp/kubeconfig.patched
  sed -i 's|https://localhost:|https://host.docker.internal:|g' /tmp/kubeconfig.patched
  cluster="$(kubectl --kubeconfig=/tmp/kubeconfig.patched config view -o jsonpath='{.clusters[0].name}' 2>/dev/null || true)"
  if [ -n "$cluster" ]; then
    kubectl --kubeconfig=/tmp/kubeconfig.patched config set-cluster "$cluster" --insecure-skip-tls-verify=true >/dev/null
  fi
  cp /tmp/kubeconfig.patched "$CONTAINER_KC"
  export KUBECONFIG="$CONTAINER_KC"
fi

cd /work
exec mockctl "$@"
