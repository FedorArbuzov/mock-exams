#!/usr/bin/env bash
# Prepare Mock CKA run 01
set -euo pipefail

PROFILE="${MOCKCTL_PROFILE:-mock-exams}"

kubectl delete ns cka-m1 cka-m1-vault --ignore-not-found --wait=false 2>/dev/null || true
sleep 2

kubectl create namespace cka-m1
kubectl create namespace cka-m1-vault

kubectl -n cka-m1-vault create serviceaccount vault-sync

kubectl -n cka-m1 create deployment billing-api \
  --image=nginx:doesnotexist \
  --replicas=2

kubectl -n cka-m1 label deployment billing-api app=billing --overwrite

# Ensure at least one node exists
kubectl get nodes >/dev/null

echo "Prepared Mock CKA 01 (namespaces cka-m1, cka-m1-vault)."
echo "Start exam: read courses/mock-cka/01/README.md"
