# 08. Networking: kube-proxy, EndpointSlice

## Service → the real pods

A `Service` is a virtual IP (ClusterIP). The real backend IPs live in an **EndpointSlice** (formerly Endpoints).

```bash
kubectl get endpointslices -l kubernetes.io/service-name=web
kubectl get endpointslice -o yaml    # addresses + ports + nodeName
```

## kube-proxy modes

| Mode | How it works |
|---|---|
| `iptables` | NAT rules in iptables (default on many clusters) |
| `ipvs` | IPVS for balancing, better with a large number of Services |
| `nftables` | New (1.31+) |
| eBPF (Cilium) | kube-proxy isn't needed — Cilium does everything |

```bash
kubectl get configmap kube-proxy -n kube-system -o yaml | grep mode
```

## DNS

`CoreDNS` in `kube-system` resolves `my-svc.my-ns.svc.cluster.local` → ClusterIP Service → kube-proxy → pod IP.

```bash
kubectl run -it --rm dnstest --image=busybox -- nslookup kubernetes.default
```

## Checklist

- Where do the real pod IPs for a Service live?
- Why EndpointSlice instead of Endpoints?
- What does kube-proxy do?

CNI lab: [09-lab-cni-calico.md](09-lab-cni-calico.md).
