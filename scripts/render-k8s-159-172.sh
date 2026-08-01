#!/usr/bin/env bash
# Render Kubernetes shorts 159-172 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-159-172.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-159-172.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-159-persistentvolume-and-persistentvolumeclaim
  kubernetes-160-storageclass-dynamic-volume-provisioning
  kubernetes-161-access-modes-rwo-rox-rwx
  kubernetes-162-reclaim-policy-delete-vs-retain
  kubernetes-163-statefulset-for-databases
  kubernetes-164-headless-service-and-statefulset
  kubernetes-165-why-hostpath-is-dangerous-in-prod
  kubernetes-166-pvc-lifecycle-in-a-real-project
  kubernetes-167-what-happens-to-data-on-pod-restart
  kubernetes-168-job-for-backup-basic-scenario
  kubernetes-169-cronjob-for-regular-backups
  kubernetes-170-data-restore-basics
  kubernetes-171-storage-antipatterns-in-kubernetes
  kubernetes-172-mini-checklist-for-stateful-services
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-159-172.py"
