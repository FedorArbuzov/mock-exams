#!/usr/bin/env bash
# Render Kubernetes shorts 173-192 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-173-192.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-173-192.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-173-rbac-the-permissions-model-in-kubernetes
  kubernetes-174-role-vs-clusterrole
  kubernetes-175-rolebinding-vs-clusterrolebinding
  kubernetes-176-kubectl-auth-can-i-quick-access-check
  kubernetes-177-serviceaccount-best-practices
  kubernetes-178-secret-why-base64-is-not-encryption
  kubernetes-179-safe-secret-rotation-basics
  kubernetes-180-configmap-vs-secret-what-goes-where
  kubernetes-181-networkpolicy-restrict-east-west-traffic
  kubernetes-182-least-privilege-instead-of-admin
  kubernetes-183-rbac-mistakes-everyone-makes
  kubernetes-184-pod-security-standards-privileged-baseline-restricted
  kubernetes-185-admission-controllers-webhooks-concept
  kubernetes-186-policy-as-code-idea-kyverno-opa-overview
  kubernetes-187-basic-threat-thinking-for-k8s
  kubernetes-188-myth-namespace-is-not-security-isolation
  kubernetes-189-myth-a-secret-in-k8s-is-not-a-safe
  kubernetes-190-security-checklist-before-release
  kubernetes-191-security-checklist-after-an-incident
  kubernetes-192-multi-tenancy-namespace-as-a-boundary
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-173-192.py"
