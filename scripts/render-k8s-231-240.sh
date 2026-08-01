#!/usr/bin/env bash
# Render Kubernetes shorts 231-240 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-231-240.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-231-240.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-231-kustomize-vs-helm-when-to-use-which
  kubernetes-232-kustomization-yaml-in-30-seconds
  kubernetes-233-overlays-base-dev-prod
  kubernetes-234-kubectl-apply-k
  kubernetes-235-patches-without-copy-pasting-manifests
  kubernetes-236-configmapgenerator-secretgenerator
  kubernetes-237-why-hand-editing-prod-is-bad
  kubernetes-238-drift-cluster-left-git-behind
  kubernetes-239-argo-cd-flux-gitops-idea-in-one-picture
  kubernetes-240-pr-sync-cluster
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-231-240.py"
