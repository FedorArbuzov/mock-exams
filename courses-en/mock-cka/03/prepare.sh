#!/usr/bin/env bash
set -euo pipefail

kubectl delete ns cka-m3 cka-m3-mon cka-m3-locked --ignore-not-found --wait=false 2>/dev/null || true
sleep 2

kubectl create namespace cka-m3
kubectl create namespace cka-m3-mon
kubectl create namespace cka-m3-locked

kubectl -n cka-m3-mon create deployment monitor \
  --image=nginx:1.27-alpine --replicas=1
kubectl -n cka-m3-mon patch deployment monitor -p '{"spec":{"template":{"metadata":{"labels":{"app":"monitor","role":"monitoring"}}}}}'
kubectl -n cka-m3-mon rollout status deployment/monitor --timeout=120s

kubectl -n cka-m3 create deployment web \
  --image=nginx:1.27-alpine --replicas=2
kubectl -n cka-m3 label deployment web app=web --overwrite

kubectl -n cka-m3 create service web-svc \
  --tcp=80:80
kubectl -n cka-m3 patch service web-svc -p '{"spec":{"selector":{"app":"wrong"}}}'

kubectl -n cka-m3 create configmap app-cfg --from-literal=MODE=production

kubectl -n cka-m3 create deployment cfg-app \
  --image=busybox:1.36 --replicas=1 \
  -- sleep 3600

kubectl -n cka-m3-locked create deployment locked-app \
  --image=nginx:1.27-alpine --replicas=1
kubectl -n cka-m3-locked label deployment locked-app app=locked --overwrite

echo "Prepared Mock CKA 03 (cka-m3, cka-m3-mon, cka-m3-locked)."
