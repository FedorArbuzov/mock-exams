#!/usr/bin/env bash
# Removes local minikube state and repo kubeconfig for a clean reinstall test.
#
# Usage:
#   ./scripts/clean-local-k8s.sh
#   ./scripts/clean-local-k8s.sh --full    # also rm -rf ~/.minikube

set -euo pipefail

FULL=0
for arg in "$@"; do
  case "$arg" in
    --full|-f|--Full) FULL=1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if command -v minikube >/dev/null 2>&1; then
  echo "Deleting minikube cluster(s)..."
  minikube delete --all || true
  echo "minikube delete --all finished."
else
  echo "minikube not in PATH; skipping cluster delete." >&2
fi

if [[ -d "$ROOT/output" ]]; then
  rm -f "$ROOT/output/"* 2>/dev/null || true
  echo "Cleared: $ROOT/output"
fi

if [[ "$FULL" -eq 1 ]] && [[ -d "$HOME/.minikube" ]]; then
  rm -rf "$HOME/.minikube"
  echo "Removed minikube cache: $HOME/.minikube"
fi

echo "Done. Next: ./scripts/minikube-up.sh"
