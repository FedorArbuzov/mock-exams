# 08. Сеть: kube-proxy, EndpointSlice

## Service → реальные поды

`Service` — виртуальный IP (ClusterIP). Реальные backend-IP — в **EndpointSlice** (раньше Endpoints).

```bash
kubectl get endpointslices -l kubernetes.io/service-name=web
kubectl get endpointslice -o yaml    # addresses + ports + nodeName
```

## kube-proxy modes

| Mode | Как работает |
|---|---|
| `iptables` | Правила NAT в iptables (default на многих кластерах) |
| `ipvs` | IPVS для балансировки, лучше при большом числе Service |
| `nftables` | Новый (1.31+) |
| eBPF (Cilium) | kube-proxy не нужен — Cilium делает всё |

```bash
kubectl get configmap kube-proxy -n kube-system -o yaml | grep mode
```

## DNS

`CoreDNS` в `kube-system` резолвит `my-svc.my-ns.svc.cluster.local` → ClusterIP Service → kube-proxy → pod IP.

```bash
kubectl run -it --rm dnstest --image=busybox -- nslookup kubernetes.default
```

## Чек-лист

- Где живут реальные IP подов для Service?
- Зачем EndpointSlice вместо Endpoints?
- Что делает kube-proxy?

Лаба CNI: [09-lab-cni-calico.md](09-lab-cni-calico.md).
