# 12. Kubernetes: Service, CNI, kube-proxy, Ingress

## Введение

Кластер — **не одна сеть**, а стек: VPC underlay + CNI overlay + Service virtual IP + Ingress/LB. Эта глава собирает [kuber-basic](../kuber-basic/README.md), [kuber-intermediate](../kuber-intermediate/README.md), [kuber-advanced/08](../kuber-advanced/08-network-internals.md).

---

## Путь запроса (north-south)

```text
Internet → Cloud LB / Ingress Controller → Service → Endpoints → Pod IP
```

| Компонент | Вопрос при инциденте |
|-----------|---------------------|
| Ingress | rules, TLS secret, class |
| Service | selector, ports, type LoadBalancer |
| Endpoints / EndpointSlice | есть ли ready backends? |
| NetworkPolicy | droppped между namespaces? |
| CNI | Pod IP reachable с ноды? |

```bash
kubectl get ingress,svc,endpointslices -A
kubectl describe svc my-svc
kubectl get networkpolicy -A
```

---

## ClusterIP и kube-proxy

Service IP **не** на интерфейсе — DNAT в iptables/IPVS/eBPF.

```bash
kubectl get svc kubernetes -o wide
iptables-save | grep my-svc-cluster-ip   # если iptables mode
```

**hairpin:** Pod вызывает Service своего же Deployment — нужен support в CNI/kube-proxy.

---

## NetworkPolicy

Default allow all → добавляете deny/allow по label.

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

Симптом: **timeout** (drop), не refused.

---

## Ingress vs Gateway API

| | Ingress | Gateway API |
|---|---------|-------------|
| Зрелость | везде | растёт |
| Модель | ingress + annotations | routes, gateways |
| Реализации | nginx, traefik, ALB controller | same vendors |

---

## AWS EKS сеть (кратко)

- **VPC CNI:** Pod IP из subnet — плотный расход IP, простой underlay.
- **Security groups for Pods:** ENI-level rules.
- **ALB Ingress Controller:** создаёт ALB из Ingress.

См. [aws-advanced/13–18 EKS](../aws-advanced/README.md).

---

## Диагностика Pod→Pod

```bash
kubectl run -it --rm netshoot --image=nicolaka/netshoot -- bash
# внутри: ping, curl, dig, traceroute
```

С ноды:

```bash
crictl pods
ip route
```

---

## В mock-exams

- NetworkPolicy: [kuber-intermediate](../kuber-intermediate/README.md)
- Calico: [kuber-advanced/09](../kuber-advanced/09-lab-cni-calico.md)
- Observability alerts: [observability-advanced](../observability-advanced/README.md)

---

## Резюме

K8s networking — **цепочка translation**. Не чините Ingress, пока `Endpoints` пуст — проблема ниже.

---

## Чек-лист

- [ ] Нарисуйте path external → Pod.
- [ ] Чем timeout от NP отличается от refused?
- [ ] Где живут реальные IP backend для Service?

**Дальше:** [13. Troubleshooting](13-troubleshooting.md).
