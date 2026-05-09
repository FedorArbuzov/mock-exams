#!/usr/bin/env bash
# Installs minikube and kubectl on macOS via Homebrew.
#
# Prerequisites: Homebrew — https://brew.sh
#
# Usage:
#   chmod +x scripts/install-minikube.sh
#   ./scripts/install-minikube.sh
#   ./scripts/install-minikube.sh --reinstall

set -euo pipefail

REINSTALL=0
for arg in "$@"; do
  case "$arg" in
    --reinstall|-r) REINSTALL=1 ;;
  esac
done

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew (brew) not found." >&2
  echo "Install it: https://brew.sh" >&2
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' >&2
  echo "Then run: brew install minikube kubectl" >&2
  exit 1
fi

if [[ "$REINSTALL" -eq 1 ]]; then
  echo "Removing existing minikube/kubernetes-cli (ignore errors if not installed)..."
  brew uninstall minikube 2>/dev/null || true
  brew uninstall kubernetes-cli 2>/dev/null || true
  brew uninstall kubectl 2>/dev/null || true
  echo ""
fi

echo "Installing minikube and kubectl (Homebrew package: kubernetes-cli)..."
brew install minikube kubernetes-cli

echo ""
echo "Done."
minikube version
kubectl version --client

echo ""
echo "Next: ./scripts/minikube-up.sh"
