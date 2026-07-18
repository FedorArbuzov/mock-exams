# 04. VPC и сеть в AWS

## Зачем VPC

**VPC (Virtual Private Cloud)** — ваша **изолированная сеть** внутри AWS. Всё, что должно общаться приватно (EC2, RDS, Lambda в VPC), живёт в VPC.

Без VPC вы не контролируете:

- Какие подсети публичные, какие приватные.
- Кто может достучаться до БД из интернета.
- Маршрутизацию между сервисами.

По умолчанию в каждом region есть **default VPC** — для экспериментов, в production создают **custom VPC**.

## Базовые компоненты

```text
VPC 10.0.0.0/16
├── Public Subnet 10.0.1.0/24 (AZ-a)  → Internet Gateway
├── Public Subnet 10.0.2.0/24 (AZ-b)  → Internet Gateway
├── Private Subnet 10.0.10.0/24 (AZ-a) → NAT Gateway (в public)
└── Private Subnet 10.0.20.0/24 (AZ-b) → NAT Gateway
```

| Компонент | Роль |
|---|---|
| **Subnet** | Отрезок IP-адресов в одной AZ |
| **Internet Gateway (IGW)** | Выход в интернет для public subnet |
| **NAT Gateway** | Исходящий интернет для private subnet (без входящего извне) |
| **Route Table** | Правила: куда слать трафик (`0.0.0.0/0` → IGW или NAT) |
| **Security Group (SG)** | Stateful firewall на уровне ENI (instance, ALB) |
| **NACL** | Stateless firewall на уровне subnet (реже меняют) |

## Public vs Private subnet

**Public** — маршрут `0.0.0.0/0` → **Internet Gateway**, и у ресурса есть **публичный IP** (или Elastic IP).

**Private** — нет прямого пути из интернета; для обновлений пакетов — **NAT Gateway** в public subnet.

```text
Internet
    │
    ▼
Internet Gateway
    │
Public Subnet ──► EC2 (bastion / ALB)
    │
NAT Gateway ◄── Private Subnet ──► EC2 app, RDS
```

**Правило:** БД и внутренние API — только **private**. ALB — **public** (или internal ALB).

## Security Groups

- **Stateful**: если разрешили входящий ответ на established connection — исходящий уже разрешён.
- Правила только **Allow** (нет Deny).
- Ссылка на другой SG: «разрешить порт 5432 от SG `app-servers`».

Пример для веб-приложения:

| SG | Inbound | Outbound |
|---|---|---|
| `alb-sg` | 443 от 0.0.0.0/0 | all |
| `app-sg` | 8080 от `alb-sg` | all |
| `db-sg` | 5432 от `app-sg` | — |

## Elastic Load Balancer (ALB / NLB)

| Тип | Уровень | Типичное использование |
|---|---|---|
| **ALB** | L7 (HTTP/HTTPS) | Микросервисы, path-based routing |
| **NLB** | L4 (TCP/UDP) | Низкая задержка, статический IP |
| **CLB** | Legacy | Не использовать в новых проектах |

ALB в **нескольких AZ** → health checks → трафик только на healthy targets.

## DNS в VPC

- **Route 53** — публичный DNS и private hosted zones.
- **Private DNS** внутри VPC: `db.internal`, `api.svc.cluster.local` (в EKS).

## VPC Endpoints (кратко)

Чтобы Lambda/EC2 в **private subnet** ходили в S3 **без NAT** (дешевле и безопаснее):

- **Gateway Endpoint** — для S3, DynamoDB (бесплатно).
- **Interface Endpoint** — для остальных сервисов (платный ENI).

## Связь с Kubernetes

| AWS | Kubernetes |
|---|---|
| VPC | Сеть кластера |
| Subnet | AZ, где scheduler ставит Pod (через CNI) |
| Security Group | Часто на node group / ENI |
| ALB + Ingress | AWS Load Balancer Controller |

В minikube VPC нет — это эмуляция одной ноды. На EKS VPC обязателен.

## Чек-лист

- Зачем private subnet для RDS?
- Чем Security Group отличается от NACL?
- Зачем NAT Gateway, если есть IGW?
- На каком уровне работает ALB?
- Почему БД не ставят в public subnet?

Следующий урок: [05-ec2-compute.md](05-ec2-compute.md).
