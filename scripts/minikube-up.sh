#!/usr/bin/env bash
# Requires: Docker Desktop for Mac (running), minikube.
# Install: ./scripts/install-minikube.sh  OR  brew install minikube kubectl

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROFILE="mock-exams"
OUT_DIR="$ROOT/output"
KUBECONFIG_OUT="$OUT_DIR/kubeconfig.yaml"

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube not found. Run: ./scripts/install-minikube.sh" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Starting minikube profile '$PROFILE' (driver=docker)..."
minikube start -p "$PROFILE" --driver=docker

minikube -p "$PROFILE" kubectl -- config view --flatten --minify >"$KUBECONFIG_OUT"

echo ""
echo "Kubeconfig written: $KUBECONFIG_OUT"
echo "Check: kubectl --kubeconfig \"$KUBECONFIG_OUT\" get nodes"
echo "Stop (keep profile): minikube stop -p $PROFILE"
echo "Remove cluster: ./scripts/minikube-down.sh"
