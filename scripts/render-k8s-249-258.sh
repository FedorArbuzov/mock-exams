#!/usr/bin/env bash
# Render Kubernetes shorts 249-258 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-249-258.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-249-258.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-249-crd-custom-resources-in-the-api
  kubernetes-250-operator-pattern-in-plain-words
  kubernetes-251-why-operators-for-dbs-queues
  kubernetes-252-internal-developer-platform-in-one-analogy
  kubernetes-253-platform-engineering-who-builds-the-deploy-button
  kubernetes-254-what-a-junior-kubernetes-engineer-should-know
  kubernetes-255-3-month-growth-plan-in-kubernetes
  kubernetes-256-top-10-questions-in-a-k8s-junior-interview
  kubernetes-257-explain-deployment-in-30-seconds-interview-answer
  kubernetes-258-final-short-roadmap-to-the-next-level
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-249-258.py"
