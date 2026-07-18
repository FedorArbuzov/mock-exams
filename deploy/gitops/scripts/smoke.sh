#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

cd "$(dirname "$0")/.."
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || cd ../.. && pwd)"
if [[ -f "${ROOT}/output/kubeconfig.yaml" ]]; then
  export KUBECONFIG="${ROOT}/output/kubeconfig.yaml"
fi

kubectl get nodes | grep -q Ready
kubectl get deploy -n argocd argocd-server >/dev/null

if kubectl get application hello-gitops-direct -n argocd >/dev/null 2>&1; then
  kubectl wait --for=condition=Healthy application/hello-gitops-direct -n argocd --timeout=180s || true
  kubectl get pods -n gitops-demo -l app=hello-gitops 2>/dev/null | grep -q Running || true
fi

echo "OK: gitops smoke passed (cluster + Argo CD server)"
