#!/usr/bin/env bash
# Verify Mock CKA run 01
set -euo pipefail

SCORE=0
TOTAL=7
NS=cka-m1

ok()   { echo "[OK]   $1"; SCORE=$((SCORE + 1)); }
fail() { echo "[FAIL] $1"; }

# Q1: default namespace cka-m1
if kubectl config view --minify -o jsonpath='{.contexts[0].context.namespace}' 2>/dev/null | grep -qx 'cka-m1'; then
  ok "Q1: current context namespace is cka-m1"
else
  fail "Q1: set default namespace to cka-m1 (got: $(kubectl config view --minify -o jsonpath='{.contexts[0].context.namespace}' 2>/dev/null || echo empty))"
fi

# Q2: SA ops + Role + RoleBinding
if kubectl -n "$NS" get sa ops &>/dev/null; then
  if kubectl -n "$NS" auth can-i list deployments --as=system:serviceaccount:${NS}:ops 2>/dev/null | grep -q yes; then
    ok "Q2: SA ops can list deployments in $NS"
  else
    fail "Q2: Role/RoleBinding for ops — list deployments"
  fi
else
  fail "Q2: ServiceAccount ops missing in $NS"
fi

# Q3: node label workload=general on all nodes
MISSING=0
while read -r node; do
  [[ -z "$node" ]] && continue
  if ! kubectl get node "$node" -o jsonpath='{.metadata.labels.workload}' 2>/dev/null | grep -qx 'general'; then
    MISSING=$((MISSING + 1))
  fi
done < <(kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}')
if [[ "$MISSING" -eq 0 ]]; then
  ok "Q3: all nodes labeled workload=general"
else
  fail "Q3: $MISSING node(s) without label workload=general"
fi

# Q4: billing-api fixed image and 2 ready replicas
IMG=$(kubectl -n "$NS" get deploy billing-api -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)
READY=$(kubectl -n "$NS" get deploy billing-api -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
if [[ "$IMG" == *"nginx:1.27-alpine"* ]] && [[ "${READY:-0}" -ge 2 ]]; then
  ok "Q4: billing-api image nginx:1.27-alpine with >=2 ready replicas"
else
  fail "Q4: billing-api (image=$IMG readyReplicas=${READY:-0}, want nginx:1.27-alpine and 2)"
fi

# Q5: ClusterRole secret-reader + binding vault-sync
if kubectl get clusterrole secret-reader &>/dev/null; then
  if kubectl auth can-i get secrets --as=system:serviceaccount:cka-m1-vault:vault-sync -n cka-m1-vault 2>/dev/null | grep -q yes; then
    ok "Q5: vault-sync can get secrets (clusterrole secret-reader)"
  else
    fail "Q5: ClusterRoleBinding for vault-sync — get secrets"
  fi
else
  fail "Q5: ClusterRole secret-reader not found"
fi

# Q6: file with kube-system Running pod count
F="${HOME}/cka-m1-q6.txt"
if [[ -f "$F" ]]; then
  WANT=$(kubectl get pods -n kube-system --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l | tr -d ' ')
  GOT=$(tr -d '[:space:]' <"$F")
  if [[ "$GOT" == "$WANT" ]]; then
    ok "Q6: ~/cka-m1-q6.txt has correct Running count in kube-system ($WANT)"
  else
    fail "Q6: ~/cka-m1-q6.txt (got '$GOT', want '$WANT')"
  fi
else
  fail "Q6: file ~/cka-m1-q6.txt missing"
fi

# Q7: ResourceQuota in cka-m1
if kubectl -n "$NS" get resourcequota platform-quota &>/dev/null; then
  CPU=$(kubectl -n "$NS" get resourcequota platform-quota -o jsonpath='{.spec.hard.cpu}' 2>/dev/null || true)
  MEM=$(kubectl -n "$NS" get resourcequota platform-quota -o jsonpath='{.spec.hard.memory}' 2>/dev/null || true)
  PODS=$(kubectl -n "$NS" get resourcequota platform-quota -o jsonpath='{.spec.hard.pods}' 2>/dev/null || true)
  if [[ "$CPU" == "4" ]] && [[ "$MEM" == "8Gi" ]] && [[ "$PODS" == "20" ]]; then
    ok "Q7: ResourceQuota platform-quota (cpu=4, memory=8Gi, pods=20)"
  else
    fail "Q7: ResourceQuota limits (cpu=$CPU memory=$MEM pods=$PODS)"
  fi
else
  fail "Q7: ResourceQuota platform-quota missing in $NS"
fi

PASS=$(( TOTAL * 70 / 100 ))
[[ $PASS -lt 1 ]] && PASS=1
echo ""
echo "Score: $SCORE / $TOTAL  (need >= $PASS to pass)"

if [[ "$SCORE" -ge "$PASS" ]]; then
  exit 0
else
  exit 1
fi
