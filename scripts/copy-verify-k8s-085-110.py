#!/usr/bin/env python3
"""Copy rendered 085-110 mp4s into videos/ and verify moov + size match."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remotion" / "out"

MAP = [
    ("85 Service types ClusterIP NodePort LoadBalancer", "kubernetes-085-service-types-clusterip-nodeport-loadbalancer"),
    ("86 Why a Service cannot see Pods", "kubernetes-086-why-a-service-cannot-see-pods"),
    ("87 EndpointSlice where endpoints are stored", "kubernetes-087-endpointslice-where-endpoints-are-stored"),
    ("88 DNS in Kubernetes how services find each other", "kubernetes-088-dns-in-kubernetes-how-services-find-each-other"),
    ("89 Service FQDN across namespaces", "kubernetes-089-service-fqdn-across-namespaces"),
    ("90 Ingress vs Service who owns which layer", "kubernetes-090-ingress-vs-service-who-owns-which-layer"),
    ("91 Ingress Controller why Ingress needs one", "kubernetes-091-ingress-controller-why-ingress-needs-one"),
    ("92 Session Affinity sticky client sessions", "kubernetes-092-session-affinity-sticky-client-sessions"),
    ("93 externalTrafficPolicy Local vs Cluster", "kubernetes-093-externaltrafficpolicy-local-vs-cluster"),
    ("94 Headless Service why skip load balancing", "kubernetes-094-headless-service-why-skip-load-balancing"),
    ("95 Stateful DNS for StatefulSet", "kubernetes-095-stateful-dns-for-statefulset"),
    ("96 NodePort for dev and test scenarios", "kubernetes-096-nodeport-for-dev-and-test-scenarios"),
    ("97 Basic request path user to Pod", "kubernetes-097-basic-request-path-user-to-pod"),
    ("98 Checking service reachability after deploy", "kubernetes-098-checking-service-reachability-after-deploy"),
    ("99 Common beginner networking mistakes", "kubernetes-099-common-beginner-networking-mistakes"),
    ("100 Mini networking diagnostics checklist", "kubernetes-100-mini-networking-diagnostics-checklist"),
    ("101 What to monitor first in the network", "kubernetes-101-what-to-monitor-first-in-the-network"),
    ("102 Gateway API vs Ingress", "kubernetes-102-gateway-api-vs-ingress"),
    ("103 TLS on Ingress certificate concept", "kubernetes-103-tls-on-ingress-certificate-concept"),
    ("104 cert-manager who renews certificates", "kubernetes-104-cert-manager-who-renews-certificates"),
    ("105 HTTP to HTTPS redirect", "kubernetes-105-http-to-https-redirect"),
    ("106 Path-based vs host-based routing", "kubernetes-106-path-based-vs-host-based-routing"),
    ("107 Why 502 and 504 often are not in the app", "kubernetes-107-why-502-and-504-often-are-not-in-the-app"),
    ("108 External health checks vs internal readiness", "kubernetes-108-external-health-checks-vs-internal-readiness"),
    ("109 WAF and CDN in front of the cluster", "kubernetes-109-waf-and-cdn-in-front-of-the-cluster"),
    ("110 Canary via Ingress or Gateway", "kubernetes-110-canary-via-ingress-or-gateway"),
]


def has_moov(p: Path) -> bool:
    data = p.read_bytes()[:200000] + p.read_bytes()[-200000:]
    return b"moov" in data


def main() -> None:
    ok = True
    for folder, name in MAP:
        src = OUT / f"{name}.mp4"
        if not src.exists():
            print(f"[MISS] {name}.mp4")
            ok = False
            continue
        dst = ROOT / "videos" / folder / "kubernetes-reel.mp4"
        dst.write_bytes(src.read_bytes())
        match = src.stat().st_size == dst.stat().st_size
        moov = has_moov(dst)
        flag = "OK" if (moov and match) else "FAIL"
        if flag != "OK":
            ok = False
        print(f"[{flag}] {folder}: {dst.stat().st_size / 1_000_000:.1f} MB  moov={moov} match={match}")
    print("ALL OK" if ok else "SOME FAILED")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
