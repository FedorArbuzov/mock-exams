# 12. Kubernetes: Service, CNI, kube-proxy, Ingress

## Intro

A cluster is **not one network** but a stack: VPC underlay + CNI overlay + Service virtual IP + Ingress/LB. This chapter brings together [kuber-basic](../kuber-basic/README.md), [kuber-intermediate](../kuber-intermediate/README.md), and [kuber-advanced/08](../kuber-advanced/08-network-internals.md).

---

## The request path (north-south)

```text
Internet → Cloud LB / Ingress Controller → Service → Endpoints → Pod IP
```

| Component | Question during an incident |
|-----------|---------------------|
| Ingress | rules, TLS secret, class |
| Service | selector, ports, type LoadBalancer |
| Endpoints / EndpointSlice | are there ready backends? |
| NetworkPolicy | dropped between namespaces? |
| CNI | is the Pod IP reachable from the node? |

```bash
kubectl get ingress,svc,endpointslices -A
kubectl describe svc my-svc
kubectl get networkpolicy -A
```

---

## ClusterIP and kube-proxy

The Service IP is **not** on an interface — DNAT in iptables/IPVS/eBPF.

```bash
kubectl get svc kubernetes -o wide
iptables-save | grep my-svc-cluster-ip   # if iptables mode
```

**hairpin:** a Pod calls the Service of its own Deployment — this needs support in the CNI/kube-proxy.

---

## NetworkPolicy

Default allow all → you add deny/allow by label.

```yaml
# ingress only from frontend namespace
spec:
  podSelector: {}
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              role: frontend
```

Symptom: **timeout** (drop), not refused.

---

## Ingress vs Gateway API

| | Ingress | Gateway API |
|---|---------|-------------|
| Maturity | everywhere | growing |
| Model | ingress + annotations | routes, gateways |
| Implementations | nginx, traefik, ALB controller | same vendors |

---

## AWS EKS networking (briefly)

- **VPC CNI:** Pod IP from the subnet — dense IP usage, simple underlay.
- **Security groups for Pods:** ENI-level rules.
- **ALB Ingress Controller:** creates an ALB from an Ingress.

See [aws-advanced/13–18 EKS](../aws-advanced/README.md).

---

## Pod→Pod diagnostics

```bash
kubectl run -it --rm netshoot --image=nicolaka/netshoot -- bash
# inside: ping, curl, dig, traceroute
```

From the node:

```bash
crictl pods
ip route
```

---

## In mock-exams

- NetworkPolicy: [kuber-intermediate](../kuber-intermediate/README.md)
- Calico: [kuber-advanced/09](../kuber-advanced/09-lab-cni-calico.md)
- Observability alerts: [observability-advanced](../observability-advanced/README.md)

---

## Summary

K8s networking is a **chain of translation**. Don't fix the Ingress while `Endpoints` is empty — the problem is lower down.

---

## Checklist

- [ ] Draw the path external → Pod.
- [ ] How does a timeout from NP differ from refused?
- [ ] Where do the real backend IPs for a Service live?

**Next:** [13. Troubleshooting](13-troubleshooting.md).
