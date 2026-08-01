#!/usr/bin/env bash
set -euo pipefail

SCORE=0
TOTAL=7
NS=cka-m2

ok()   { echo "[OK]   $1"; SCORE=$((SCORE + 1)); }
fail() { echo "[FAIL] $1"; }

# Q1: needs-toleration running with toleration
if kubectl -n "$NS" get deploy needs-toleration -o jsonpath='{.status.readyReplicas}' 2>/dev/null | grep -q '^1$'; then
  ok "Q1: deployment needs-toleration is Ready"
else
  fail "Q1: needs-toleration not Ready (add toleration for cka-m2=true:NoSchedule)"
fi

# Q2: pod ssd-pod on node with disktype=ssd
if kubectl -n "$NS" get pod ssd-pod &>/dev/null; then
  PHASE=$(kubectl -n "$NS" get pod ssd-pod -o jsonpath='{.status.phase}' 2>/dev/null)
  NODE=$(kubectl -n "$NS" get pod ssd-pod -o jsonpath='{.spec.nodeName}' 2>/dev/null)
  DISK=$(kubectl get node "$NODE" -o jsonpath='{.metadata.labels.disktype}' 2>/dev/null || true)
  if [[ "$PHASE" == "Running" ]] && [[ "$DISK" == "ssd" ]]; then
    ok "Q2: pod ssd-pod Running on disktype=ssd node"
  else
    fail "Q2: ssd-pod (phase=$PHASE node disktype=$DISK)"
  fi
else
  fail "Q2: pod ssd-pod not found"
fi

# Q3: spread deployment — anti-affinity spec (on 1 node only 1 pod runs — OK)
READY=$(kubectl -n "$NS" get deploy spread -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
AFF=$(kubectl -n "$NS" get deploy spread -o jsonpath='{.spec.template.spec.affinity.podAntiAffinity}' 2>/dev/null || true)
if [[ -n "$AFF" ]] && [[ "${READY:-0}" -ge 1 ]]; then
  ok "Q3: deployment spread has podAntiAffinity and >=1 Ready (3 replicas on 1 node → 1 Running is OK)"
else
  fail "Q3: spread needs podAntiAffinity and at least 1 ready replica (ready=${READY:-0})"
fi

# Q4: cordon — file says cordoned
F="${HOME}/cka-m2-q4.txt"
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
if [[ -f "$F" ]] && grep -qi cordon "$F" 2>/dev/null; then
  if kubectl get node "$NODE" -o jsonpath='{.spec.unschedulable}' 2>/dev/null | grep -q true; then
    ok "Q4: node cordoned and ~/cka-m2-q4.txt documents it"
  else
    fail "Q4: file mentions cordon but node $NODE is schedulable"
  fi
else
  fail "Q4: cordon node and write 'cordoned' to ~/cka-m2-q4.txt"
fi

# Q5: probe-fail fixed — pod ready
if kubectl -n "$NS" get deploy probe-fail -o jsonpath='{.status.readyReplicas}' 2>/dev/null | grep -q '^1$'; then
  ok "Q5: probe-fail deployment Ready (fix liveness probe)"
else
  fail "Q5: probe-fail not Ready"
fi

# Q6: PriorityClass high-work + pod urgent using it
if kubectl get priorityclass high-work &>/dev/null; then
  PC=$(kubectl -n "$NS" get pod urgent -o jsonpath='{.spec.priorityClassName}' 2>/dev/null || true)
  if [[ "$PC" == "high-work" ]] && kubectl -n "$NS" get pod urgent -o jsonpath='{.status.phase}' 2>/dev/null | grep -q Running; then
    ok "Q6: pod urgent uses PriorityClass high-work"
  else
    fail "Q6: pod urgent (priorityClass=$PC)"
  fi
else
  fail "Q6: PriorityClass high-work missing"
fi

# Q7: uncordon first node (cleanup for cluster)
if kubectl get node "$NODE" -o jsonpath='{.spec.unschedulable}' 2>/dev/null | grep -q false; then
  ok "Q7: node $NODE uncordoned (schedulable)"
else
  fail "Q7: run kubectl uncordon $NODE"
fi

PASS=$(( TOTAL * 70 / 100 ))
echo ""
echo "Score: $SCORE / $TOTAL  (need >= $PASS)"
[[ "$SCORE" -ge "$PASS" ]] && exit 0 || exit 1
