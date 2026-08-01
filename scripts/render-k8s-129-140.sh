#!/usr/bin/env bash
# Render Kubernetes shorts 129-140 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-129-140.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-129-140.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-129-taints-block-scheduling-onto-a-node
  kubernetes-130-tolerations-intentional-exceptions
  kubernetes-131-affinity-place-things-together
  kubernetes-132-anti-affinity-spread-across-nodes
  kubernetes-133-topology-spread-constraints-evenness-across-zones
  kubernetes-134-cordon-stop-new-pods-on-a-node
  kubernetes-135-drain-safely-empty-a-node
  kubernetes-136-node-maintenance-without-downtime
  kubernetes-137-why-a-pod-landed-on-this-exact-node
  kubernetes-138-placing-critical-vs-non-critical-services
  kubernetes-139-daemonset-tolerations-a-common-case
  kubernetes-140-mini-scheduling-checklist
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-129-140.py"
