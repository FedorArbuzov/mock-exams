#!/usr/bin/env bash
# Render Kubernetes shorts 241-248 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-241-248.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-241-248.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-241-pipeline-build-push-deploy
  kubernetes-242-gitops-mindset-change-via-git-not-by-hand
  kubernetes-243-how-to-add-a-smoke-test-to-the-pipeline
  kubernetes-244-secrets-in-ci-what-not-to-do
  kubernetes-245-image-versioning-in-the-pipeline
  kubernetes-246-rollback-from-ci-vs-rollback-from-the-cluster
  kubernetes-247-preview-environments-from-prs-concept
  kubernetes-248-production-pipeline-checklist
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-241-248.py"
