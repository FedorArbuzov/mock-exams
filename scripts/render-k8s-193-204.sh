#!/usr/bin/env bash
# Render Kubernetes shorts 193-204 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-193-204.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-193-204.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-193-what-metrics-server-is
  kubernetes-194-prometheus-why-it-exists-in-the-k8s-world
  kubernetes-195-grafana-what-a-junior-should-look-at
  kubernetes-196-logs-stdout-is-the-standard
  kubernetes-197-why-logs-vanish-after-a-pod-restart
  kubernetes-198-tracing-in-one-sentence
  kubernetes-199-alerts-the-first-3-rules
  kubernetes-200-deployment-health-dashboard
  kubernetes-201-how-to-tell-an-app-bug-from-a-k8s-problem
  kubernetes-202-latency-p95-p99-why-average-isnt-enough
  kubernetes-203-error-rate-basic-threshold-setup
  kubernetes-204-golden-signals-4-required-metrics
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-193-204.py"
