#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f config/repo.env ]]; then
  echo "Create config/repo.env from config/repo.env.example" >&2
  exit 1
fi
# shellcheck disable=SC1091
source config/repo.env

if ! command -v envsubst >/dev/null 2>&1; then
  echo "envsubst not found (gettext). Install or apply bootstrap/root-application.yaml manually." >&2
  exit 1
fi

export MOCK_GITOPS_REPO MOCK_GITOPS_REVISION
envsubst < bootstrap/root-application.yaml | kubectl apply -f -

echo "OK: gitops-root Application applied"
echo "Ensure manifests are pushed to: ${MOCK_GITOPS_REPO} (${MOCK_GITOPS_REVISION})"
