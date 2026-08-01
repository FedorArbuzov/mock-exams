#!/usr/bin/env bash
# Render Kubernetes shorts 259-266 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-259-266.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-259-266.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-259-what-happens-if-you-kill-kubelet
  kubernetes-260-how-is-service-different-from-ingress
  kubernetes-261-requests-vs-limits-ideal-answer
  kubernetes-262-myth-roundup-5-dangerous-beginner-shortcuts
  kubernetes-263-checklist-ready-for-a-junior-role
  kubernetes-264-mini-project-one-app-end-to-end
  kubernetes-265-mini-project-break-it-and-fix-it
  kubernetes-266-what-next-after-the-course
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-259-266.py"
