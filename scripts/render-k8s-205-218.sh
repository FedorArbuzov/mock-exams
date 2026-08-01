#!/usr/bin/env bash
# Render Kubernetes shorts 205-218 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-205-218.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-205-218.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-205-kubectl-scale-manual-scale-in-seconds
  kubernetes-206-hpa-on-cpu-first-autoscaling
  kubernetes-207-hpa-on-custom-metrics-concept
  kubernetes-208-vpa-auto-sizing-pod-resources
  kubernetes-209-hpa-vs-vpa-when-to-use-which
  kubernetes-210-saturation-spotting-the-approach-to-limits
  kubernetes-211-app-bottleneck-vs-infrastructure-bottleneck
  kubernetes-212-top-causes-of-performance-degradation
  kubernetes-213-load-optimization-checklist
  kubernetes-214-myth-safer-without-limits
  kubernetes-215-slo-sla-in-plain-words
  kubernetes-216-runbook-capturing-team-knowledge
  kubernetes-217-postmortem-for-beginners-no-blame
  kubernetes-218-on-call-checklist-what-to-watch-each-hour
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-205-218.py"
