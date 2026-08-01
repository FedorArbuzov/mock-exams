#!/usr/bin/env bash
# Render Kubernetes shorts 073-084 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-073-084.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-073-084.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-073-containerport-vs-service-port-vs-targetport
  kubernetes-074-env-in-a-pod-env-vs-envfrom
  kubernetes-075-configmap-as-a-file-vs-as-env-vars
  kubernetes-076-secret-mount-vs-env-what-is-safer
  kubernetes-077-subpath-convenient-and-risky
  kubernetes-078-projected-volumes-in-one-picture
  kubernetes-079-downward-api-a-pod-learns-about-itself
  kubernetes-080-multi-container-pod-talk-over-localhost
  kubernetes-081-shared-volume-between-app-and-sidecar
  kubernetes-082-readonlyrootfilesystem-why
  kubernetes-083-securitycontext-runasnonroot-in-30-seconds
  kubernetes-084-capabilities-why-drop-all
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-073-084.py"
