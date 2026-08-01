#!/usr/bin/env bash
# Render Kubernetes shorts 219-230 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-219-230.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-219-230.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-219-helm-why-you-need-it-on-top-of-yaml
  kubernetes-220-what-a-chart-and-a-release-are
  kubernetes-221-chart-structure-templates-values-chart-yaml
  kubernetes-222-values-yaml-managing-environments
  kubernetes-223-helm-install-first-release
  kubernetes-224-helm-upgrade-updates
  kubernetes-225-helm-rollback-rollback
  kubernetes-226-helm-history-release-revisions
  kubernetes-227-environment-variables-through-values
  kubernetes-228-common-templating-mistakes
  kubernetes-229-helm-cicd-basic-scenario
  kubernetes-230-checklist-chart-ready-for-prod
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-219-230.py"
