#!/usr/bin/env bash
set -euo pipefail

PROFILE="${MOCKCTL_PROFILE:-mock-exams}"

kubectl delete ns cka-m2 --ignore-not-found --wait=false 2>/dev/null || true
sleep 2

kubectl create namespace cka-m2

NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')

kubectl label node "$NODE" topology.kubernetes.io/zone=zone-a --overwrite
kubectl label node "$NODE" disktype=hdd --overwrite

kubectl taint node "$NODE" cka-m2=true:NoSchedule --overwrite

kubectl -n cka-m2 create deployment api \
  --image=nginx:1.27-alpine \
  --replicas=1
kubectl -n cka-m2 label deployment api app=api --overwrite

kubectl -n cka-m2 create deployment needs-toleration \
  --image=nginx:1.27-alpine \
  --replicas=1

kubectl -n cka-m2 create deployment probe-fail \
  --image=nginx:1.27-alpine

kubectl -n cka-m2 patch deployment probe-fail --type=json -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/livenessProbe","value":{"httpGet":{"path":"/","port":9999},"initialDelaySeconds":3,"periodSeconds":5}}
]'

echo "Prepared Mock CKA 02 (namespace cka-m2, taint on node $NODE)."
echo "Optional second node: minikube node add -p $PROFILE --worker"
