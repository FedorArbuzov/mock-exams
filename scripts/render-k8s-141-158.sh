#!/usr/bin/env bash
# Render Kubernetes shorts 141-158 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-141-158.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-141-158.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-141-rolling-update-update-without-downtime
  kubernetes-142-kubectl-rollout-status-watch-the-release
  kubernetes-143-kubectl-rollout-history-revision-history
  kubernetes-144-kubectl-rollout-undo-fast-rollback
  kubernetes-145-kubectl-set-image-quick-image-update
  kubernetes-146-rollout-restart-restart-the-grown-up-way
  kubernetes-147-why-kubectl-delete-pod-is-not-a-release
  kubernetes-148-revisionhistorylimit-history-vs-cleanup
  kubernetes-149-bluegreen-vs-rolling-vs-canary
  kubernetes-150-smoke-test-after-deploy
  kubernetes-151-before-deploy-checklist
  kubernetes-152-after-deploy-checklist
  kubernetes-153-mini-incident-runbook
  kubernetes-154-top-mistakes-on-the-first-release
  kubernetes-155-dont-deploy-to-the-wrong-cluster-kube-context
  kubernetes-156-progressive-delivery-at-a-basic-level
  kubernetes-157-post-deploy-smoke-and-health-check
  kubernetes-158-myth-more-replicas-is-not-always-better
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-141-158.py"
