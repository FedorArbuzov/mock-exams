#!/usr/bin/env bash
# Finale checklist for ~/nimbus-ops. Needs kubectl + KUBECONFIG to 192.168.56.10.
set -euo pipefail

: "${KUBECONFIG:?set KUBECONFIG to ~/.kube/nimbus-ops.conf}"
ROOT="${NIMBUS_OPS_DIR:-$HOME/nimbus-ops}"

ready="$(kubectl get nodes --no-headers 2>/dev/null | awk '$2 ~ /Ready/ && $2 !~ /NotReady/ {c++} END{print c+0}')"
[[ "$ready" -ge 3 ]] || { echo "FAIL: expected ≥3 Ready nodes, got $ready"; kubectl get nodes; exit 1; }
echo "OK: $ready Ready nodes"

labels="$(kubectl get nodes --show-labels)"
echo "$labels" | grep -q 'workload=app' || { echo "FAIL: missing workload=app"; exit 1; }
echo "$labels" | grep -q 'workload=batch' || { echo "FAIL: missing workload=batch"; exit 1; }
echo "OK: workload labels present"

[[ -d "$ROOT/backups" ]] && ls "$ROOT/backups" | grep -q . || { echo "FAIL: no backups/ stamp"; exit 1; }
echo "OK: backups/ has a stamp"

[[ -f "$ROOT/artifacts/certs.txt" ]] || { echo "WARN: artifacts/certs.txt missing (run certs-report.yml)"; }
[[ -f "$ROOT/.gitignore" ]] || { echo "WARN: no .gitignore"; }

echo "OK: verify.sh finished"
kubectl get nodes -o wide
