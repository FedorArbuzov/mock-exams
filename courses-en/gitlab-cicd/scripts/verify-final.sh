#!/usr/bin/env bash
# verify-final.sh — cluster-side checks for gitlab-cicd final project.
# Usage:
#   export KUBECONFIG=/path/to/output/kubeconfig.yaml
#   ./verify-final.sh [--slug REF_SLUG] [--deploy hello-ci]
set -euo pipefail

SLUG=""
DEPLOY="hello-ci"
LB="${LB_URL:-http://localhost:8080}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug) SLUG="$2"; shift 2 ;;
    --deploy) DEPLOY="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--slug CI_COMMIT_REF_SLUG] [--deploy name]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

fail=0
ok()   { echo "  OK  $*"; }
bad()  { echo "  FAIL $*"; fail=1; }
have() { command -v "$1" >/dev/null 2>&1; }

echo "== gitlab-cicd final verify =="
echo "KUBECONFIG=${KUBECONFIG:-<unset>}"
echo "LB=$LB"
echo

if ! have kubectl; then
  echo "kubectl not found" >&2
  exit 1
fi

echo "-- cluster --"
if kubectl get nodes >/dev/null 2>&1; then
  ready=$(kubectl get nodes --no-headers 2>/dev/null | grep -c ' Ready' || true)
  if [[ "$ready" -ge 1 ]]; then ok "nodes Ready ($ready)"; else bad "no Ready nodes"; fi
else
  bad "cannot talk to cluster (check KUBECONFIG / mockctl up)"
fi

check_ns() {
  local ns="$1"
  if kubectl get ns "$ns" >/dev/null 2>&1; then ok "namespace $ns"; else bad "namespace $ns missing"; fi
}

check_deploy() {
  local ns="$1"
  if ! kubectl get ns "$ns" >/dev/null 2>&1; then return; fi
  if kubectl -n "$ns" get deploy "$DEPLOY" >/dev/null 2>&1; then
    want=$(kubectl -n "$ns" get deploy "$DEPLOY" -o jsonpath='{.status.replicas}' 2>/dev/null || echo 1)
    ready=$(kubectl -n "$ns" get deploy "$DEPLOY" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
    want=${want:-1}
    ready=${ready:-0}
    if [[ "$ready" == "$want" && "$ready" != "0" ]]; then
      ok "deploy/$DEPLOY ready in $ns ($ready/$want)"
    else
      bad "deploy/$DEPLOY not ready in $ns (ready=$ready want=$want)"
    fi
  else
    bad "deploy/$DEPLOY missing in $ns"
  fi
}

ingress_has_path() {
  local ns="$1" path="$2"
  local paths
  paths=$(kubectl -n "$ns" get ingress -o jsonpath='{range .items[*].spec.rules[*].http.paths[*]}{.path}{"\n"}{end}' 2>/dev/null || true)
  if echo "$paths" | grep -q "$path"; then
    ok "ingress path $path in $ns"
  else
    bad "ingress path $path not found in $ns (got: ${paths:-none})"
  fi
}

http_check() {
  local path="$1"
  if ! have curl; then
    bad "curl missing; skip HTTP $path"
    return
  fi
  code=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 "$LB$path" || echo "000")
  if [[ "$code" == "200" || "$code" == "301" || "$code" == "302" ]]; then
    ok "HTTP $LB$path → $code"
  elif [[ "$code" == "000" ]]; then
    bad "HTTP $LB$path → connection failed (is mockctl --lb up?)"
  else
    bad "HTTP $LB$path → $code (want 200)"
  fi
}

echo "-- staging / production --"
check_ns app-staging
check_ns app-prod
check_deploy app-staging
check_deploy app-prod
ingress_has_path app-staging "/staging"
ingress_has_path app-prod "/prod"
http_check "/staging/"
http_check "/prod/"

if [[ -n "$SLUG" ]]; then
  echo "-- review ($SLUG) --"
  check_ns "review-$SLUG"
  check_deploy "review-$SLUG"
  ingress_has_path "review-$SLUG" "/r/$SLUG"
  http_check "/r/$SLUG/"
else
  echo "-- review --"
  echo "  SKIP (pass --slug <CI_COMMIT_REF_SLUG> to check review app)"
fi

echo
if [[ "$fail" -eq 0 ]]; then
  echo "RESULT: PASS (cluster layer)"
  echo "Still verify child pipelines + manual prod in GitLab UI (see 13-verification.md)."
  exit 0
else
  echo "RESULT: FAIL (see messages above)"
  exit 1
fi
