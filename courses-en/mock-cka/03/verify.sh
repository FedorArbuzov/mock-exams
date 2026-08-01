#!/usr/bin/env bash
set -euo pipefail

SCORE=0
TOTAL=7
PROFILE="${MOCKCTL_PROFILE:-mock-exams}"

ok()   { echo "[OK]   $1"; SCORE=$((SCORE + 1)); }
fail() { echo "[FAIL] $1"; }

# Q1: etcd snapshot file on host
F="${HOME}/cka-r3-etcd.db"
if [[ -f "$F" ]] && [[ "$(wc -c <"$F" | tr -d ' ')" -gt 1000 ]]; then
  ok "Q1: ~/cka-r3-etcd.db exists and non-trivial size"
else
  fail "Q1: create etcd snapshot at ~/cka-r3-etcd.db (see README / kuber-advanced lab-etcd)"
fi

# Q2: PVC + pod writer
if kubectl -n cka-m3 get pvc data-vol &>/dev/null; then
  if kubectl -n cka-m3 get pod vol-writer -o jsonpath='{.status.phase}' 2>/dev/null | grep -q Running; then
    ok "Q2: PVC data-vol and pod vol-writer Running"
  else
    fail "Q2: pod vol-writer not Running"
  fi
else
  fail "Q2: PVC data-vol missing in cka-m3"
fi

# Q3: NetworkPolicy allow monitoring only
if kubectl -n cka-m3-locked get networkpolicy deny-except-monitoring &>/dev/null; then
  ok "Q3: NetworkPolicy deny-except-monitoring exists"
else
  fail "Q3: NetworkPolicy deny-except-monitoring in cka-m3-locked"
fi

# Q4: web-svc selector fixed
EP=$(kubectl -n cka-m3 get endpoints web-svc -o jsonpath='{.subsets[0].addresses}' 2>/dev/null || true)
if [[ -n "$EP" ]] && [[ "$EP" != "null" ]]; then
  ok "Q4: service web-svc has endpoints"
else
  fail "Q4: fix web-svc selector to match app=web"
fi

# Q5: cfg-app env from configmap MODE
VAL=$(kubectl -n cka-m3 get deploy cfg-app -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="MODE")].valueFrom.configMapKeyRef.key}' 2>/dev/null || true)
READY=$(kubectl -n cka-m3 get deploy cfg-app -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
if [[ "$VAL" == "MODE" ]] && [[ "${READY:-0}" -ge 1 ]]; then
  ok "Q5: cfg-app uses ConfigMap key MODE and is Ready"
else
  fail "Q5: cfg-app ConfigMap env (key=$VAL ready=$READY)"
fi

# Q6: answer file for etcd static pod path component
F6="${HOME}/cka-m3-q6.txt"
if [[ -f "$F6" ]]; then
  if grep -Eiq 'etcd' "$F6"; then
    ok "Q6: ~/cka-m3-q6.txt mentions etcd"
  else
    fail "Q6: ~/cka-m3-q6.txt should name etcd as static pod on control plane"
  fi
else
  fail "Q6: create ~/cka-m3-q6.txt with control plane component name"
fi

# Q7: RoleBinding viewer cannot create pods
if kubectl -n cka-m3 get rolebinding pod-viewer &>/dev/null; then
  if kubectl auth can-i create pods --as=system:serviceaccount:cka-m3:viewer -n cka-m3 2>/dev/null | grep -q no; then
    if kubectl auth can-i get pods --as=system:serviceaccount:cka-m3:viewer -n cka-m3 2>/dev/null | grep -q yes; then
      ok "Q7: SA viewer can get but not create pods"
    else
      fail "Q7: viewer should get/list pods"
    fi
  else
    fail "Q7: viewer must not create pods"
  fi
else
  fail "Q7: RoleBinding pod-viewer missing"
fi

PASS=$(( TOTAL * 70 / 100 ))
echo ""
echo "Score: $SCORE / $TOTAL  (need >= $PASS)"
[[ "$SCORE" -ge "$PASS" ]] && exit 0 || exit 1
