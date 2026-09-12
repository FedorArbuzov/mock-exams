#!/usr/bin/env bash
# Control-plane check for kuber-bootstrap. Needs kubectl + KUBECONFIG to 192.168.56.10.
set -euo pipefail

: "${KUBECONFIG:?set KUBECONFIG to the admin.conf copy from cp}"

ready="$(kubectl get nodes --no-headers 2>/dev/null | awk '$2=="Ready"{c++} END{print c+0}')"
[[ "$ready" -ge 3 ]] || { echo "FAIL: expected ≥3 Ready nodes, got $ready"; kubectl get nodes; exit 1; }

echo "OK: $ready Ready nodes"
kubectl get nodes -o wide
