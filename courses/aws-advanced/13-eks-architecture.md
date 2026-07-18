# 13. EKS: control plane и node groups

## Архитектура EKS

```text
AWS managed control plane (API server, etcd, scheduler)
        │
        ▼
Worker nodes (EC2 managed node group / Fargate profile)
        │
        ▼
Pods (your workloads)
```

Вы **не** управляете master nodes. Платите за control plane (~$0.10/час) + workers.

## Компоненты

| Компонент | Роль |
|---|---|
| Cluster | EKS resource в region |
| Node group | ASG с EC2, bootstrap в кластер |
| Fargate profile | serverless pods, selector by namespace/labels |
| Add-ons | VPC CNI, kube-proxy, CoreDNS, EBS CSI |
| OIDC provider | для IRSA |

## Сеть

- Каждый pod IP из VPC CIDR (**VPC CNI**).
- Subnets: рекомендуют private для nodes, public только для LB.
- **Cluster security group** — control plane ↔ nodes.

## Сравнение с mockctl/minikube

| | minikube (mockctl) | EKS |
|---|---|---|
| Control plane | локально | AWS managed |
| Cost | бесплатно | платно |
| IRSA | нет | да |
| ALB Ingress | симуляция | native AWS LB |

## Когда EKS

- Уже есть Kubernetes expertise (ваши kuber-курсы).
- Multi-tenant platform, CRD, operators.
- Hybrid cloud portable workloads.

## Чек-лист

- Кто патчит control plane?
- Зачем OIDC provider на кластере?
- Fargate vs managed nodes?
- VPC CNI — зачем планировать IP?

Следующий урок: [14-lab-eks.md](14-lab-eks.md).
