# DevOps learning path

Полный маршрут «от нуля до platform engineer» в репозитории mock-exams.

**Статус:** ветка **gitlab-*** расширена до мега-подробного формата (сценарии, лабы, interview Q&A) — [`gitlab-basic`](gitlab-basic/README.md), [`gitlab-intermediate`](gitlab-intermediate/README.md), [`gitlab-advanced`](gitlab-advanced/README.md).

## Схема

```text
                    ┌─────────────────┐
                    │  linux-basic    │  shell, systemd, SSH (Docker lab)
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  gitlab-basic   │  Git, MR, .gitlab-ci.yml
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │gitlab-intermediate│  build, registry, deploy mockctl
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ gitlab-advanced │  security, Argo split, OIDC
                    └────────┬────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
linux-intermediate     kuber-basic              aws-basic
     ▼                       ▼                       ▼
linux-advanced         kuber-intermediate     aws-terraform
     │                       ▼                       ▼
     │                 kuber-advanced         aws-intermediate
     │                       │                       ▼
     └───────────┬───────────┘                 aws-advanced
                 ▼
          mock-ckad / mock-cka / mock-cks
```

## Рекомендуемый порядок

| Этап | Курс | Часы |
|------|------|------|
| 0 | [linux-basic](linux-basic/README.md) | ~14–16 |
| 1 | [gitlab-basic](gitlab-basic/README.md) | ~10–14 |
| 2 | [bare-metal](bare-metal/README.md) (параллельно) | ~5 |
| 3 | [linux-intermediate](linux-intermediate/README.md) | ~16–18 |
| 3b | [containers-basic](containers-basic/README.md) | ~8–10 |
| 4 | [kuber-basic](kuber-basic/README.md) | ~12 |
| 5 | [gitlab-intermediate](gitlab-intermediate/README.md) | ~12–18 |
| 6 | [aws-basic](aws-basic/README.md) + [aws-terraform](aws-terraform/README.md) | ~20 |
| 7 | [kuber-intermediate](kuber-intermediate/README.md) | ~16 |
| 8 | [linux-advanced](linux-advanced/README.md) | ~14–16 |
| 9 | [aws-intermediate](aws-intermediate/README.md) | ~16 |
| 10 | [kuber-advanced](kuber-advanced/README.md) | ~20 |
| 11 | [gitlab-advanced](gitlab-advanced/README.md) | ~16–22 |
| 12 | [aws-advanced](aws-advanced/README.md) | ~20 |
| 13 | [mock-ckad](mock-ckad/README.md) | ~6 |
| 13b | [mock-cka](mock-cka/README.md) | ~6 |

После [kuber-advanced](kuber-advanced/README.md) фазы 1 (CKA-core) или параллельно с фазой 2.

### Linux — специализации

| Этап | Курс | Когда |
|------|------|-------|
| Ls1 | [linux-shell](linux-shell/README.md) | после linux-basic |
| Ls2 | [linux-security](linux-security/README.md) | после linux-intermediate |

### Контейнеры (перед или параллельно kuber-basic)

| Этап | Курс | Часы |
|------|------|------|
| C1 | [containers-basic](containers-basic/README.md) | ~8–10 |

Стенд: [deploy/containers](../deploy/containers/README.md) (web **8088**, api/redis в compose-сетях). Рекомендуется **до** [kuber-basic](kuber-basic/README.md); registry углубляется в [gitlab-intermediate/03](gitlab-intermediate/03-docker-registry.md).

### FastAPI (после containers-basic и postgresql-basic)

| Этап | Курс | Часы |
|------|------|------|
| F1 | [fastapi](fastapi/README.md) | ~40–55 |

Предварительно: [containers-basic](containers-basic/README.md), [postgresql-basic](postgresql-basic/README.md). Углубление: [postgresql-developer](postgresql-developer/README.md), [redis-basic](redis-basic/README.md), [observability-basic](observability-basic/README.md). Стенд: [deploy/fastapi](../deploy/fastapi/README.md) (API **8090**).

### Python asyncio (после fastapi или параллельно главам 01–06)

| Этап | Курс | Часы |
|------|------|------|
| PA | [python-async](python-async/README.md) | ~18–24 |

Предварительно: базовый Python; желательно [fastapi](fastapi/README.md) (01–06). Стенд: [deploy/python-async](../deploy/python-async/README.md) (gateway **8095**). Связь: [fastapi/27-async-patterns](fastapi/27-async-patterns.md).

### Python testing (после базового Python; параллельно fastapi)

| Этап | Курс | Часы |
|------|------|------|
| PT | [python-testing](python-testing/README.md) | ~14–18 |

Предварительно: базовый Python. Полезно с [fastapi](fastapi/README.md) и [gitlab-basic](gitlab-basic/README.md). Лабы: [examples/shop-lab](python-testing/examples/pyproject.toml).

### Django (после postgresql-basic; параллельно fastapi)

| Этап | Курс | Часы |
|------|------|------|
| DJ | [django](django/README.md) | ~45–55 |

Предварительно: Python, SQL ([postgresql-basic](postgresql-basic/README.md)). Стенд: [deploy/django](../deploy/django/README.md) (**8092**). Сравнение: [fastapi](fastapi/README.md).

### Python Celery (после fastapi или django; параллельно rabbitmq-basic)

| Этап | Курс | Часы |
|------|------|------|
| PC | [python-celery](python-celery/README.md) | ~18–24 |

Предварительно: Python, очереди ([rabbitmq-basic](rabbitmq-basic/README.md), [redis-basic](redis-basic/README.md)). Стенд: [deploy/celery](../deploy/celery/README.md) (**8093**, Flower **5555**).

### SQLAlchemy Deep (после postgresql-basic; параллельно fastapi/django)

| Этап | Курс | Часы |
|------|------|------|
| SA | [sqlalchemy-deep](sqlalchemy-deep/README.md) | ~22–28 |

Предварительно: Python, SQL ([postgresql-basic](postgresql-basic/README.md)). Стенд: [deploy/sqlalchemy](../deploy/sqlalchemy/README.md) (**5433**). Связь: [fastapi/13](fastapi/13-sqlalchemy-async.md), [django/07–12](django/07-models-basics.md).

### API Design (после fastapi/02 или параллельно fastapi/django)

| Этап | Курс | Часы |
|------|------|------|
| AD | [api-design](api-design/README.md) | ~12–16 |

Предварительно: HTTP ([nginx-basic](nginx-basic/README.md)), желательно [fastapi/02](fastapi/02-first-app.md). Практика: [fastapi/32](fastapi/32-contract-tests.md), [fastapi/39](fastapi/39-versioning-idempotency.md), [fastapi/42](fastapi/42-capstone.md). Связь: [messaging-deep](messaging-deep/README.md) (async API), [appsec-fundamentals](appsec-fundamentals/README.md).

### Python Deep Dive (параллельно backend; Python Q&A на интервью)

| Этап | Курс | Часы |
|------|------|------|
| PD | [python-deep-dive](python-deep-dive/README.md) | ~22–30 |

Предварительно: Python в проде или [fastapi](fastapi/README.md). Лабы: [examples/pyproject.toml](python-deep-dive/examples/pyproject.toml). После — [python-async](python-async/README.md) для asyncio практики. Финал: [22-synthesis](python-deep-dive/22-synthesis.md).

### Behavioral Interviews (перед интервью; параллельно алго и design)

| Этап | Курс | Часы |
|------|------|------|
| BH | [behavioral-interviews](behavioral-interviews/README.md) | ~12–16 |

Предварительно: опыт или capstone ([fastapi/42](fastapi/42-capstone.md), [gitlab-advanced/15](gitlab-advanced/15-final-project.md)). Вместе с [python-algorithms](python-algorithms/README.md) и [microservices-patterns](microservices-patterns/README.md). Финал: [20-synthesis](behavioral-interviews/20-synthesis.md) Story Portfolio.

### OOD Python (перед интервью; параллельно алго)

| Этап | Курс | Часы |
|------|------|------|
| OOD | [ood-python](ood-python/README.md) | ~20–28 |

Предварительно: [python-deep-dive](python-deep-dive/README.md) (Protocol, dataclass). Лабы: [examples/pyproject.toml](ood-python/examples/pyproject.toml). Вместе с [python-algorithms](python-algorithms/README.md). Финал: [20-synthesis](ood-python/20-synthesis.md) mock OOD.

### Python Algorithms (параллельно backend; перед интервью)

| Этап | Курс | Часы |
|------|------|------|
| ALG | [python-algorithms](python-algorithms/README.md) | ~35–45 |

Предварительно: базовый Python. Практика: [examples/pyproject.toml](python-algorithms/examples/pyproject.toml), `pytest`. Параллельно system design: [microservices-patterns](microservices-patterns/README.md). Финал: [26-synthesis](python-algorithms/26-synthesis.md) mock-неделя.

### Microservices Patterns (после messaging-deep и api-design)

| Этап | Курс | Часы |
|------|------|------|
| MS | [microservices-patterns](microservices-patterns/README.md) | ~20–28 |

Предварительно: [messaging-deep](messaging-deep/README.md), [api-design](api-design/README.md), [devops-culture/05–08](devops-culture/05-conway-law.md). Практика: [messaging-deep/10](messaging-deep/10-outbox-saga.md), [python-celery](python-celery/README.md), [python-async/34](python-async/34-system-design-async.md), [fastapi/40](fastapi/40-system-design.md). Финал — ADR в [20-synthesis](microservices-patterns/20-synthesis.md).

### Python AWS / boto3 (после aws-basic; параллельно aws-terraform)

| Этап | Курс | Часы |
|------|------|------|
| PA | [python-aws](python-aws/README.md) | ~22–28 |

Предварительно: Python, [aws-basic](aws-basic/README.md). Стенд: [deploy/python-aws](../deploy/python-aws/README.md) (LocalStack **4566**). IaC-версия pipeline: [aws-terraform/23](aws-terraform/23-final-project.md).

### Kafka (после linux-basic, параллельно с AWS очередями)

| Этап | Курс | Часы |
|------|------|------|
| K1 | [kafka-basic](kafka-basic/README.md) | ~10–12 |
| K2 | [kafka-intermediate](kafka-intermediate/README.md) | ~12–16 |
| K3 | [kafka-advanced](kafka-advanced/README.md) | ~14–18 |

Предварительно: [linux-basic](linux-basic/README.md) (Docker, сеть). Полезно параллельно: [aws-basic](aws-basic/README.md) и [aws-intermediate](aws-intermediate/README.md) (SQS, EventBridge) — сравнение в [kafka-basic/18-vs-queues.md](kafka-basic/18-vs-queues.md).

### Redis (после linux-basic, параллельно с Kafka / AWS)

| Этап | Курс | Часы |
|------|------|------|
| R1 | [redis-basic](redis-basic/README.md) | ~10–12 |
| R2 | [redis-intermediate](redis-intermediate/README.md) | ~12–16 |
| R3 | [redis-advanced](redis-advanced/README.md) | ~14–18 |

Полезно параллельно: [kafka-basic](kafka-basic/README.md) (Streams vs Kafka) — [redis-basic/16](redis-basic/16-vs-memcached-kafka.md); [aws-basic/07-databases](aws-basic/07-databases.md) (ElastiCache) — [redis-intermediate/19](redis-intermediate/19-managed-elasticache.md).

### Observability (после linux-basic; K8s-лабы — после kuber-intermediate)

| Этап | Курс | Часы |
|------|------|------|
| O1 | [observability-basic](observability-basic/README.md) | ~10–12 |
| O2 | [observability-intermediate](observability-intermediate/README.md) | ~12–16 |
| O3 | [observability-advanced](observability-advanced/README.md) | ~14–18 |

Стенд: [deploy/observability](../deploy/observability/README.md). Параллельно: [aws-intermediate/19-cloudwatch](aws-intermediate/19-cloudwatch.md); углубление в K8s — [kuber-advanced/14-observability](kuber-advanced/14-observability.md) после O2.

### SRE (теория, после observability-basic)

| Этап | Курс | Часы |
|------|------|------|
| SRE | [sre](sre/README.md) | ~25–35 |

SLI/SLO в метриках: [observability-intermediate](observability-intermediate/README.md). Инциденты на практике: [observability-advanced](observability-advanced/README.md), [gitops-*](gitops-basic/README.md).

### Networking Deep (после linux-intermediate и aws-intermediate VPC)

| Этап | Курс | Часы |
|------|------|------|
| Net | [networking-deep](networking-deep/README.md) | ~20–27 |

Предварительно: [linux-intermediate](linux-intermediate/README.md) (TCP/IP, NAT, firewall, tcpdump), [aws-intermediate/01](aws-intermediate/01-vpc-custom.md) (VPC, IGW, NAT). Лаба: [deploy/linux](../deploy/linux/README.md). Дальше: [kuber-advanced](kuber-advanced/README.md), [aws-advanced](aws-advanced/README.md) (TGW).

### DevOps Culture (после gitlab-basic, параллельно sre)

| Этап | Курс | Часы |
|------|------|------|
| DC | [devops-culture](devops-culture/README.md) | ~12–16 |

DORA, Conway, Team Topologies. Предварительно: [gitlab-basic](gitlab-basic/README.md). Дальше: [sre](sre/README.md), [gitlab-advanced](gitlab-advanced/README.md).

### AppSec Fundamentals (после kuber-intermediate и gitlab-basic)

| Этап | Курс | Часы |
|------|------|------|
| AS | [appsec-fundamentals](appsec-fundamentals/README.md) | ~14–18 |

Threat model, misconfig K8s/CI/cloud, supply chain, secure SDLC. Предварительно: [containers-basic/14](containers-basic/14-security.md), [kuber-intermediate](kuber-intermediate/README.md). Практика: [gitlab-advanced](gitlab-advanced/README.md), [kuber-advanced](kuber-advanced/README.md) (фазы 2, 4), [linux-security](linux-security/README.md). Для DevSecOps-вакансий — до или параллельно [aws-advanced](aws-advanced/README.md) security-фаза.

### FinOps (после aws-intermediate, параллельно или после aws-advanced cost-уроков)

| Этап | Курс | Часы |
|------|------|------|
| F1 | [finops](finops/README.md) | ~17–22 |

Предварительно: [aws-terraform](aws-terraform/README.md), [aws-intermediate](aws-intermediate/README.md). Краткий обзор в [aws-advanced/25–26](aws-advanced/25-cost-optimization.md); углубление — [finops](finops/README.md) (Kubecost, unit economics, governance). Опционально: `mockctl` + Helm для [finops/07](finops/07-kubecost.md).

### GitOps (после kuber-intermediate / параллельно gitlab-advanced)

| Этап | Курс | Часы |
|------|------|------|
| G1 | [gitops-basic](gitops-basic/README.md) | ~8–10 |
| G2 | [gitops-intermediate](gitops-intermediate/README.md) | ~8–12 |

Обзор: [kuber-advanced/16](kuber-advanced/16-argocd.md); split CI: [gitlab-advanced/11](gitlab-advanced/11-gitlab-and-argocd.md). Стенд: [deploy/gitops](../deploy/gitops/README.md) на **mockctl**.

### nginx (после linux-intermediate или параллельно containers-basic)

| Этап | Курс | Часы |
|------|------|------|
| N1 | [nginx-basic](nginx-basic/README.md) | ~6–8 |
| N2 | [nginx-intermediate](nginx-intermediate/README.md) | ~8–10 |

Обзор на VM: [linux-intermediate/13-nginx](linux-intermediate/13-nginx.md), TLS: [09-tls-openssl](linux-intermediate/09-tls-openssl.md). Стенд: [deploy/nginx](../deploy/nginx/README.md). Дальше: [kuber-basic/20-ingress](kuber-basic/20-ingress.md).

### Secrets / Vault (после gitlab-basic и aws-intermediate KMS)

| Этап | Курс | Часы |
|------|------|------|
| S1 | [secrets-basic](secrets-basic/README.md) | ~8–10 |
| S2 | [secrets-advanced](secrets-advanced/README.md) | ~10–14 |

Стенд: [deploy/vault](../deploy/vault/README.md). Связи: [gitlab-basic/07](gitlab-basic/07-variables-secrets.md), [aws-intermediate/11-secrets-kms](aws-intermediate/11-secrets-kms.md), [kuber-basic/12](kuber-basic/12-config-and-secret.md).

### OpenSearch / ELK (после observability-intermediate или kafka-log pipeline)

| Этап | Курс | Часы |
|------|------|------|
| Os1 | [opensearch-basic](opensearch-basic/README.md) | ~8–10 |
| Os2 | [opensearch-intermediate](opensearch-intermediate/README.md) | ~10–14 |

Предварительно: [observability-basic](observability-basic/README.md) (метрики) и желательно [observability-intermediate](observability-intermediate/README.md) (Loki — сравнение в [opensearch-basic/12](opensearch-basic/12-vs-loki-elasticsearch.md)). Поток логов из Kafka — [kafka-basic/12-patterns](kafka-basic/12-patterns.md). Стенд: [deploy/opensearch](../deploy/opensearch/README.md).

### Messaging Deep (после kafka-basic/18 или параллельно rabbitmq/aws)

| Этап | Курс | Часы |
|------|------|------|
| Msg | [messaging-deep](messaging-deep/README.md) | ~12–16 |

Сравнение брокеров: Kafka, Rabbit, SQS, Redis Streams, EventBridge. Вводная — [kafka-basic/18](kafka-basic/18-vs-queues.md). Без нового стенда.

### RabbitMQ (после kafka-basic/18 или параллельно с aws-intermediate SQS)

| Этап | Курс | Часы |
|------|------|------|
| Mq1 | [rabbitmq-basic](rabbitmq-basic/README.md) | ~8–10 |
| Mq2 | [rabbitmq-intermediate](rabbitmq-intermediate/README.md) | ~10–12 |

Сравнение брокеров: [kafka-basic/18-vs-queues](kafka-basic/18-vs-queues.md). DLQ в AWS: [aws-intermediate/07-sqs-dlq](aws-intermediate/07-sqs-dlq.md). Стенд: [deploy/rabbitmq](../deploy/rabbitmq/README.md).

### PostgreSQL (параллельно с приложением / AWS)

| Этап | Курс | Часы |
|------|------|------|
| P1 | [postgresql-basic](postgresql-basic/README.md) | ~11 |
| P2 | [postgresql-intermediate](postgresql-intermediate/README.md) | ~14 |
| P3 | [postgresql-advanced](postgresql-advanced/README.md) | ~14 |

### PostgreSQL — специализации

| Этап | Курс | Когда |
|------|------|-------|
| P4a | [postgresql-developer](postgresql-developer/README.md) | после P1 (basic) |
| P4b | [postgresql-performance](postgresql-performance/README.md) | после P2 |
| P4c | [postgresql-ops](postgresql-ops/README.md) | после P2 |
| P4d | [postgresql-security](postgresql-security/README.md) | после P2–P3 |

Параллельно можно учить **AWS** и **Kubernetes** после gitlab-basic; **Linux intermediate** логично до или вместе с kuber-basic.

## Локальная инфраструктура

| Стек | Команда |
|------|---------|
| Linux labs | `docker compose -f deploy/linux/docker-compose.yml up -d` — [deploy/linux/README.md](../deploy/linux/README.md) |
| Kubernetes | `mockctl up` — [INSTALL.md](../INSTALL.md) |
| AWS эмуляция | `docker compose -f deploy/localstack/docker-compose.yml up -d` |
| GitLab | `docker compose -f deploy/gitlab/docker-compose.yml up -d` — [deploy/gitlab/README.md](../deploy/gitlab/README.md) |
| Kafka | `docker compose -f deploy/kafka/docker-compose.yml up -d` — [deploy/kafka/README.md](../deploy/kafka/README.md) |
| Kafka (3 brokers) | `docker compose -f deploy/kafka/docker-compose.cluster.yml up -d` |
| Redis | `docker compose -f deploy/redis/docker-compose.yml up -d` — [deploy/redis/README.md](../deploy/redis/README.md) |
| Redis (cluster) | `docker compose -f deploy/redis/docker-compose.cluster.yml up -d` + `scripts/init-cluster.sh` |
| Observability | `docker compose -f deploy/observability/docker-compose.yml up -d --build` — [deploy/observability/README.md](../deploy/observability/README.md) |
| Observability (logs) | `docker compose -f deploy/observability/docker-compose.yml -f deploy/observability/docker-compose.logs.yml up -d` |
| OpenSearch | `docker compose -f deploy/opensearch/docker-compose.yml up -d` — [deploy/opensearch/README.md](../deploy/opensearch/README.md) |
| RabbitMQ | `docker compose -f deploy/rabbitmq/docker-compose.yml up -d` — [deploy/rabbitmq/README.md](../deploy/rabbitmq/README.md) |
| Containers | `docker compose -f deploy/containers/docker-compose.yml up -d --build` — [deploy/containers/README.md](../deploy/containers/README.md) |
| FastAPI | `docker compose -f deploy/fastapi/docker-compose.yml up -d --build` — [deploy/fastapi/README.md](../deploy/fastapi/README.md) |
| Python asyncio | `docker compose -f deploy/python-async/docker-compose.yml up -d --build` — [deploy/python-async/README.md](../deploy/python-async/README.md) |
| Django | `docker compose -f deploy/django/docker-compose.yml up -d --build` — [deploy/django/README.md](../deploy/django/README.md) |
| Python Celery | `docker compose -f deploy/celery/docker-compose.yml up -d --build` — [deploy/celery/README.md](../deploy/celery/README.md) |
| SQLAlchemy Deep | `docker compose -f deploy/sqlalchemy/docker-compose.yml up -d --build` — [deploy/sqlalchemy/README.md](../deploy/sqlalchemy/README.md) |
| Python AWS | `docker compose -f deploy/python-aws/docker-compose.yml up -d --build` — [deploy/python-aws/README.md](../deploy/python-aws/README.md) |
| Vault | `docker compose -f deploy/vault/docker-compose.yml up -d` — [deploy/vault/README.md](../deploy/vault/README.md) |
| nginx | `docker compose -f deploy/nginx/docker-compose.yml up -d --build` — [deploy/nginx/README.md](../deploy/nginx/README.md) |
| GitOps (Argo CD) | `mockctl up` → `deploy/gitops/scripts/install-argocd.sh` — [deploy/gitops/README.md](../deploy/gitops/README.md) |

## Capstone

Собрать end-to-end:

1. App в GitLab → CI build `image-platform`.
2. GitOps repo → Argo CD на mockctl.
3. Infra → Terraform + LocalStack (или AWS dev).
4. Security → [appsec-fundamentals](appsec-fundamentals/README.md) baseline + SAST + Trivy в MR.
5. Хост/нода → чеклист из [linux-advanced/28-final-project.md](linux-advanced/28-final-project.md).

См. [gitlab-advanced/15-final-project.md](gitlab-advanced/15-final-project.md).
