# 06. EKS, Fargate, idle capacity

## Введение

**EKS control plane** — фиксированная плата (~$0.10/час/кластер) независимо от Pod count. Основной spend — **worker nodes**, **EBS**, **LB**, **data transfer**. Учебные кластеры после лаб — #1 source leak.

Связь: [aws-advanced/13–14 EKS](../aws-advanced/13-eks-architecture.md), [kuber-intermediate HPA](../kuber-intermediate/README.md).

---

## Структура cost EKS

```text
EKS control plane (fixed)
  + EC2 / Fargate workers (variable)
  + EBS volumes
  + ELB/ALB (Ingress)
  + NAT Gateway (egress из private nodes)
  + CloudWatch logs (control plane audit optional)
```

---

## Node groups

| Стратегия | Cost | Когда |
|-----------|------|-------|
| Fixed 3× large | высокий baseline | простота |
| Cluster Autoscaler | платите за used nodes | variable load |
| Karpenter | быстрее scale, гибче types | современный EKS |
| Spot nodes | до ~70% off | fault-tolerant workloads |
| Fargate | no node ops, $/vCPU-hour | batch, low steady state |

**Over-provisioned requests:** `requests.cpu` суммарно > реальной ноды → CA не уменьшает cluster.

---

## Idle и waste

| Waste | Как найти |
|-------|-----------|
| Пустой namespace | `kubectl get pods -A` |
| Забытый minikube/mockctl на EC2 | tags + budget |
| Old LoadBalancer Services | `kubectl get svc` TYPE=LoadBalancer |
| Unused PVC | `kubectl get pvc` |
| system pods на oversized nodes | Kubecost idle cost |

**Учебный leak:** EKS + NAT 24/7 после weekend lab → **destroy** ([optional-aws cleanup](../aws-advanced/optional-aws-advanced.md)).

---

## Fargate vs EC2 workers

| | Fargate | EC2 MNG |
|---|---------|---------|
| Ops | нет SSH на node | patch AMI |
| Cost при steady 24/7 | часто дороже | дешевле при высокой утилизации |
| Bin packing | per-task | вы контролиете |

---

## IRSA и сеть

- **VPC endpoints** для S3/ECR — меньше NAT GB ([08](08-storage-network-cost.md)).
- **Private cluster** — без public API endpoint если политика требует (операционная сложность ≠ всегда cheaper).

---

## mockctl (локально)

`mockctl up` на laptop — **$0 AWS**, но учит паттерны labels/requests для [07-kubecost](07-kubecost.md).

---

## Резюме

EKS cost = **nodes + egress + LB**. Rightsizing K8s — **requests/limits**, autoscaling, Spot, cleanup учебных кластеров.

---

## Чек-лист

- [ ] Знаете $/month control plane на кластер?
- [ ] CA/Karpenter включён в prod design?
- [ ] После лаб EKS есть destroy checklist?

**Дальше:** [07. Kubecost](07-kubecost.md).
