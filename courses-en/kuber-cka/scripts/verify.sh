#!/usr/bin/env bash
# Cluster-ready check after bootstrap 09. Uses KUBECONFIG (kuber-cka.conf).
set -euo pipefail

: "${KUBECONFIG:?set KUBECONFIG to ~/.kube/kuber-cka.conf}"

ready="$(kubectl get nodes --no-headers 2>/dev/null | awk '$2 ~ /^Ready/{c++} END{print c+0}')"
[[ "$ready" -ge 3 ]] || { echo "FAIL: expected ≥3 Ready nodes, got $ready"; kubectl get nodes; exit 1; }

echo "OK: $ready Ready nodes"
kubectl get nodes -o wide
kubectl -n kube-system get deploy,ds
kubectl -n shop get deploy,svc,ing 2>/dev/null || echo "(shop not applied yet)"
