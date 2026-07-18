#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f config/repo.env ]]; then
  echo "Create config/repo.env from config/repo.env.example" >&2
  exit 1
fi
# shellcheck disable=SC1091
source config/repo.env
export MOCK_GITOPS_REPO MOCK_GITOPS_REVISION
envsubst < examples/application-hello.yaml | kubectl apply -f -
echo "OK: hello-gitops-direct Application applied"
