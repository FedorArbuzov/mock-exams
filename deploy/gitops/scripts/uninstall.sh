#!/usr/bin/env bash
set -euo pipefail

kubectl delete application --all -n argocd --ignore-not-found
kubectl delete namespace gitops-demo gitops-waves --ignore-not-found --wait=false
kubectl delete namespace argocd --ignore-not-found
echo "OK: GitOps demo removed"
