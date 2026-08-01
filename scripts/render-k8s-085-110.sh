#!/usr/bin/env bash
# Render Kubernetes shorts 085-110 on a VM, then copy + verify moov.
#
# From repo root:
#   bash scripts/render-k8s-085-110.sh
#
# Optional:
#   CONCURRENCY=4 bash scripts/render-k8s-085-110.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REM="$ROOT/remotion"
CONCURRENCY="${CONCURRENCY:-2}"

IDS=(
  kubernetes-085-service-types-clusterip-nodeport-loadbalancer
  kubernetes-086-why-a-service-cannot-see-pods
  kubernetes-087-endpointslice-where-endpoints-are-stored
  kubernetes-088-dns-in-kubernetes-how-services-find-each-other
  kubernetes-089-service-fqdn-across-namespaces
  kubernetes-090-ingress-vs-service-who-owns-which-layer
  kubernetes-091-ingress-controller-why-ingress-needs-one
  kubernetes-092-session-affinity-sticky-client-sessions
  kubernetes-093-externaltrafficpolicy-local-vs-cluster
  kubernetes-094-headless-service-why-skip-load-balancing
  kubernetes-095-stateful-dns-for-statefulset
  kubernetes-096-nodeport-for-dev-and-test-scenarios
  kubernetes-097-basic-request-path-user-to-pod
  kubernetes-098-checking-service-reachability-after-deploy
  kubernetes-099-common-beginner-networking-mistakes
  kubernetes-100-mini-networking-diagnostics-checklist
  kubernetes-101-what-to-monitor-first-in-the-network
  kubernetes-102-gateway-api-vs-ingress
  kubernetes-103-tls-on-ingress-certificate-concept
  kubernetes-104-cert-manager-who-renews-certificates
  kubernetes-105-http-to-https-redirect
  kubernetes-106-path-based-vs-host-based-routing
  kubernetes-107-why-502-and-504-often-are-not-in-the-app
  kubernetes-108-external-health-checks-vs-internal-readiness
  kubernetes-109-waf-and-cdn-in-front-of-the-cluster
  kubernetes-110-canary-via-ingress-or-gateway
)

cd "$REM"
mkdir -p out

for id in "${IDS[@]}"; do
  echo "=== render $id ==="
  npx remotion render src/index.ts "$id" "out/${id}.mp4" --concurrency="$CONCURRENCY"
done

echo "=== copy + verify ==="
python3 "$ROOT/scripts/copy-verify-k8s-085-110.py"
