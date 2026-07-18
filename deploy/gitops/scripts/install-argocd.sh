#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

cd "$(dirname "$0")/.."
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || cd ../.. && pwd)"
if [[ -f "${ROOT}/output/kubeconfig.yaml" ]]; then
  export KUBECONFIG="${ROOT}/output/kubeconfig.yaml"
fi

kubectl get nodes >/dev/null

kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

echo "OK: Argo CD installed in namespace argocd"
echo "UI: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "Password: bash scripts/get-admin-password.sh"
