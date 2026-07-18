#!/usr/bin/env bash
set -euo pipefail
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' 2>/dev/null | base64 -d
echo
