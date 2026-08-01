#!/usr/bin/env bash
# Render Kubernetes shorts 111-128 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-111-128.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-111-128.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-111-requests-and-limits-stability-foundation
  kubernetes-112-qos-besteffort-burstable-guaranteed
  kubernetes-113-oomkilled-what-it-is-and-how-to-fix-it
  kubernetes-114-evicted-pod-why-eviction-happens
  kubernetes-115-pending-pod-common-causes
  kubernetes-116-liveness-probe-is-the-process-alive
  kubernetes-117-readiness-probe-ready-for-traffic
  kubernetes-118-startup-probe-for-slow-startups
  kubernetes-119-crashloopbackoff-fast-root-cause-algorithm
  kubernetes-120-graceful-shutdown-and-terminationgraceperiodseconds
  kubernetes-121-why-a-pod-sticks-in-terminating
  kubernetes-122-init-containers-prepare-before-start
  kubernetes-123-sidecar-pattern-for-helper-tasks
  kubernetes-124-emptydir-for-temporary-data
  kubernetes-125-poddisruptionbudget-protect-availability
  kubernetes-126-priorityclass-who-to-save-first
  kubernetes-127-resourcequota-namespace-limits
  kubernetes-128-limitrange-request-and-limit-standards
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-111-128.py"
