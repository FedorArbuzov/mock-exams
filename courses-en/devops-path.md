# DevOps learning path

The complete "from zero to platform engineer" route in the mock-exams repository.

**Status:** preferred GitLab track is [`gitlab-cicd`](gitlab-cicd/README.md). Terraform labs use **`mockctl localstack`** (no Kubernetes) with [`aws-terraform`](aws-terraform/README.md). Older gitlab-basic/intermediate/advanced remain optional deep dives.

## Path diagram

```text
                    ┌─────────────────┐
                    │  linux-basic    │  shell, systemd, SSH (Docker lab)
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ containers-basic│
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  kuber-basic    │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  gitlab-cicd    │  CI → registry → mockctl → review apps
                    │  (+ finale)     │  parent/child pipelines
                    └────────┬────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
linux-intermediate     kuber-intermediate      aws-basic
     ▼                       ▼                       ▼
linux-advanced         kuber-advanced          aws-terraform
     │                       │               (mockctl localstack)
     │                 gitlab-advanced               ▼
     │                       │               aws-intermediate → …
     └───────────┬───────────┘
                 ▼
          mock-ckad / mock-cka / mock-cks
```

## Recommended order

| Stage | Course | Hours |
|------|------|------|
| 0 | [linux-basic](linux-basic/README.md) | ~14–16 |
| 1 | [bare-metal](bare-metal/README.md) (in parallel) | ~5 |
| 2 | [linux-intermediate](linux-intermediate/README.md) | ~16–18 |
| 2b | [containers-basic](containers-basic/README.md) | ~8–10 |
| 3 | [kuber-basic](kuber-basic/README.md) | ~12 |
| 4 | [gitlab-cicd](gitlab-cicd/README.md) | ~12–16 + 4–6 finale |
| 5 | [aws-basic](aws-basic/README.md) + [aws-terraform](aws-terraform/README.md) (`mockctl localstack`) | ~20 |
| 6 | [kuber-intermediate](kuber-intermediate/README.md) | ~16 |
| 7 | [linux-advanced](linux-advanced/README.md) | ~14–16 |
| 8 | [aws-intermediate](aws-intermediate/README.md) | ~16 |
| 9 | [kuber-advanced](kuber-advanced/README.md) | ~20 |
| 10 | [gitlab-advanced](gitlab-advanced/README.md) (optional platform) | ~16–22 |
| 11 | [aws-advanced](aws-advanced/README.md) | ~20 |
| 12 | [mock-ckad](mock-ckad/README.md) | ~6 |
| 12b | [mock-cka](mock-cka/README.md) | ~6 |

After [kuber-advanced](kuber-advanced/README.md) phase 1 (CKA-core) or in parallel with phase 2.

### Linux — specializations

| Stage | Course | When |
|------|------|-------|
| Ls1 | [linux-shell](linux-shell/README.md) | after linux-basic |
| Ls2 | [linux-security](linux-security/README.md) | after linux-intermediate |

### Containers (before or in parallel with kuber-basic)

| Stage | Course | Hours |
|------|------|------|
| C1 | [containers-basic](containers-basic/README.md) | ~8–10 |

Stack: [deploy/containers](../deploy/containers/README.md) (web **8088**, api/redis on compose networks). Recommended **before** [kuber-basic](kuber-basic/README.md); the registry is covered in more depth in [gitlab-intermediate/03](gitlab-intermediate/03-docker-registry.md).

### FastAPI (after containers-basic and postgresql-basic)

| Stage | Course | Hours |
|------|------|------|
| F1 | [fastapi](fastapi/README.md) | ~40–55 |

Prerequisites: [containers-basic](containers-basic/README.md), [postgresql-basic](postgresql-basic/README.md). Deeper dive: [postgresql-developer](postgresql-developer/README.md), [redis-basic](redis-basic/README.md), [observability-basic](observability-basic/README.md). Stack: [deploy/fastapi](../deploy/fastapi/README.md) (API **8090**).

### Python asyncio (after fastapi or in parallel with chapters 01–06)

| Stage | Course | Hours |
|------|------|------|
| PA | [python-async](python-async/README.md) | ~18–24 |

Prerequisites: basic Python; ideally [fastapi](fastapi/README.md) (01–06). Stack: [deploy/python-async](../deploy/python-async/README.md) (gateway **8095**). Relation: [fastapi/27-async-patterns](fastapi/27-async-patterns.md).

### Python testing (after basic Python; in parallel with fastapi)

| Stage | Course | Hours |
|------|------|------|
| PT | [python-testing](python-testing/README.md) | ~14–18 |

Prerequisites: basic Python. Useful together with [fastapi](fastapi/README.md) and [gitlab-basic](gitlab-basic/README.md). Labs: [examples/shop-lab](python-testing/examples/pyproject.toml).

### Django (after postgresql-basic; in parallel with fastapi)

| Stage | Course | Hours |
|------|------|------|
| DJ | [django](django/README.md) | ~45–55 |

Prerequisites: Python, SQL ([postgresql-basic](postgresql-basic/README.md)). Stack: [deploy/django](../deploy/django/README.md) (**8092**). Comparison: [fastapi](fastapi/README.md).

### Python Celery (after fastapi or django; in parallel with rabbitmq-basic)

| Stage | Course | Hours |
|------|------|------|
| PC | [python-celery](python-celery/README.md) | ~18–24 |

Prerequisites: Python, queues ([rabbitmq-basic](rabbitmq-basic/README.md), [redis-basic](redis-basic/README.md)). Stack: [deploy/celery](../deploy/celery/README.md) (**8093**, Flower **5555**).

### SQLAlchemy Deep (after postgresql-basic; in parallel with fastapi/django)

| Stage | Course | Hours |
|------|------|------|
| SA | [sqlalchemy-deep](sqlalchemy-deep/README.md) | ~22–28 |

Prerequisites: Python, SQL ([postgresql-basic](postgresql-basic/README.md)). Stack: [deploy/sqlalchemy](../deploy/sqlalchemy/README.md) (**5433**). Relation: [fastapi/13](fastapi/13-sqlalchemy-async.md), [django/07–12](django/07-models-basics.md).

### API Design (after fastapi/02 or in parallel with fastapi/django)

| Stage | Course | Hours |
|------|------|------|
| AD | [api-design](api-design/README.md) | ~12–16 |

Prerequisites: HTTP ([nginx-basic](nginx-basic/README.md)), ideally [fastapi/02](fastapi/02-first-app.md). Practice: [fastapi/32](fastapi/32-contract-tests.md), [fastapi/39](fastapi/39-versioning-idempotency.md), [fastapi/42](fastapi/42-capstone.md). Relation: [messaging-deep](messaging-deep/README.md) (async API), [appsec-fundamentals](appsec-fundamentals/README.md).

### Python Deep Dive (in parallel with backend; Python Q&A for interviews)

| Stage | Course | Hours |
|------|------|------|
| PD | [python-deep-dive](python-deep-dive/README.md) | ~22–30 |

Prerequisites: Python in production or [fastapi](fastapi/README.md). Labs: [examples/pyproject.toml](python-deep-dive/examples/pyproject.toml). After that — [python-async](python-async/README.md) for asyncio practice. Finale: [22-synthesis](python-deep-dive/22-synthesis.md).

### Behavioral Interviews (before interviews; in parallel with algorithms and design)

| Stage | Course | Hours |
|------|------|------|
| BH | [behavioral-interviews](behavioral-interviews/README.md) | ~12–16 |

Prerequisites: experience or a capstone ([fastapi/42](fastapi/42-capstone.md), [gitlab-advanced/15](gitlab-advanced/15-final-project.md)). Together with [python-algorithms](python-algorithms/README.md) and [microservices-patterns](microservices-patterns/README.md). Finale: [20-synthesis](behavioral-interviews/20-synthesis.md) Story Portfolio.

### OOD Python (before interviews; in parallel with algorithms)

| Stage | Course | Hours |
|------|------|------|
| OOD | [ood-python](ood-python/README.md) | ~20–28 |

Prerequisites: [python-deep-dive](python-deep-dive/README.md) (Protocol, dataclass). Labs: [examples/pyproject.toml](ood-python/examples/pyproject.toml). Together with [python-algorithms](python-algorithms/README.md). Finale: [20-synthesis](ood-python/20-synthesis.md) mock OOD.

### Python Algorithms (in parallel with backend; before interviews)

| Stage | Course | Hours |
|------|------|------|
| ALG | [python-algorithms](python-algorithms/README.md) | ~35–45 |

Prerequisites: basic Python. Practice: [examples/pyproject.toml](python-algorithms/examples/pyproject.toml), `pytest`. In parallel with system design: [microservices-patterns](microservices-patterns/README.md). Finale: [26-synthesis](python-algorithms/26-synthesis.md) mock week.

### Microservices Patterns (after messaging-deep and api-design)

| Stage | Course | Hours |
|------|------|------|
| MS | [microservices-patterns](microservices-patterns/README.md) | ~20–28 |

Prerequisites: [messaging-deep](messaging-deep/README.md), [api-design](api-design/README.md), [devops-culture/05–08](devops-culture/05-conway-law.md). Practice: [messaging-deep/10](messaging-deep/10-outbox-saga.md), [python-celery](python-celery/README.md), [python-async/34](python-async/34-system-design-async.md), [fastapi/40](fastapi/40-system-design.md). Finale — ADR in [20-synthesis](microservices-patterns/20-synthesis.md).

### Python AWS / boto3 (after aws-basic; in parallel with aws-terraform)

| Stage | Course | Hours |
|------|------|------|
| PA | [python-aws](python-aws/README.md) | ~22–28 |

Prerequisites: Python, [aws-basic](aws-basic/README.md). Stack: [deploy/python-aws](../deploy/python-aws/README.md) (LocalStack **4566**). IaC version of the pipeline: [aws-terraform/23](aws-terraform/23-final-project.md).

### Kafka (after linux-basic, in parallel with AWS queues)

| Stage | Course | Hours |
|------|------|------|
| K1 | [kafka-basic](kafka-basic/README.md) | ~10–12 |
| K2 | [kafka-intermediate](kafka-intermediate/README.md) | ~12–16 |
| K3 | [kafka-advanced](kafka-advanced/README.md) | ~14–18 |

Prerequisites: [linux-basic](linux-basic/README.md) (Docker, networking). Useful in parallel: [aws-basic](aws-basic/README.md) and [aws-intermediate](aws-intermediate/README.md) (SQS, EventBridge) — comparison in [kafka-basic/18-vs-queues.md](kafka-basic/18-vs-queues.md).

### Redis (after linux-basic, in parallel with Kafka / AWS)

| Stage | Course | Hours |
|------|------|------|
| R1 | [redis-basic](redis-basic/README.md) | ~10–12 |
| R2 | [redis-intermediate](redis-intermediate/README.md) | ~12–16 |
| R3 | [redis-advanced](redis-advanced/README.md) | ~14–18 |

Useful in parallel: [kafka-basic](kafka-basic/README.md) (Streams vs Kafka) — [redis-basic/16](redis-basic/16-vs-memcached-kafka.md); [aws-basic/07-databases](aws-basic/07-databases.md) (ElastiCache) — [redis-intermediate/19](redis-intermediate/19-managed-elasticache.md).

### Observability (after linux-basic; K8s labs — after kuber-intermediate)

| Stage | Course | Hours |
|------|------|------|
| O1 | [observability-basic](observability-basic/README.md) | ~10–12 |
| O2 | [observability-intermediate](observability-intermediate/README.md) | ~12–16 |
| O3 | [observability-advanced](observability-advanced/README.md) | ~14–18 |

Stack: [deploy/observability](../deploy/observability/README.md). In parallel: [aws-intermediate/19-cloudwatch](aws-intermediate/19-cloudwatch.md); a deeper dive into K8s — [kuber-advanced/14-observability](kuber-advanced/14-observability.md) after O2.

### SRE (theory, after observability-basic)

| Stage | Course | Hours |
|------|------|------|
| SRE | [sre](sre/README.md) | ~25–35 |

SLI/SLO in metrics: [observability-intermediate](observability-intermediate/README.md). Incidents in practice: [observability-advanced](observability-advanced/README.md), [gitops-*](gitops-basic/README.md).

### Networking Deep (after linux-intermediate and aws-intermediate VPC)

| Stage | Course | Hours |
|------|------|------|
| Net | [networking-deep](networking-deep/README.md) | ~20–27 |

Prerequisites: [linux-intermediate](linux-intermediate/README.md) (TCP/IP, NAT, firewall, tcpdump), [aws-intermediate/01](aws-intermediate/01-vpc-custom.md) (VPC, IGW, NAT). Lab: [deploy/linux](../deploy/linux/README.md). Next: [kuber-advanced](kuber-advanced/README.md), [aws-advanced](aws-advanced/README.md) (TGW).

### DevOps Culture (after gitlab-basic, in parallel with sre)

| Stage | Course | Hours |
|------|------|------|
| DC | [devops-culture](devops-culture/README.md) | ~12–16 |

DORA, Conway, Team Topologies. Prerequisites: [gitlab-basic](gitlab-basic/README.md). Next: [sre](sre/README.md), [gitlab-advanced](gitlab-advanced/README.md).

### AppSec Fundamentals (after kuber-intermediate and gitlab-basic)

| Stage | Course | Hours |
|------|------|------|
| AS | [appsec-fundamentals](appsec-fundamentals/README.md) | ~14–18 |

Threat model, misconfig in K8s/CI/cloud, supply chain, secure SDLC. Prerequisites: [containers-basic/14](containers-basic/14-security.md), [kuber-intermediate](kuber-intermediate/README.md). Practice: [gitlab-advanced](gitlab-advanced/README.md), [kuber-advanced](kuber-advanced/README.md) (phases 2, 4), [linux-security](linux-security/README.md). For DevSecOps roles — before or in parallel with the [aws-advanced](aws-advanced/README.md) security phase.

### FinOps (after aws-intermediate, in parallel with or after the aws-advanced cost lessons)

| Stage | Course | Hours |
|------|------|------|
| F1 | [finops](finops/README.md) | ~17–22 |

Prerequisites: [aws-terraform](aws-terraform/README.md), [aws-intermediate](aws-intermediate/README.md). Brief overview in [aws-advanced/25–26](aws-advanced/25-cost-optimization.md); deeper dive — [finops](finops/README.md) (Kubecost, unit economics, governance). Optional: `mockctl` + Helm for [finops/07](finops/07-kubecost.md).

### GitOps (after kuber-intermediate / in parallel with gitlab-advanced)

| Stage | Course | Hours |
|------|------|------|
| G1 | [gitops-basic](gitops-basic/README.md) | ~8–10 |
| G2 | [gitops-intermediate](gitops-intermediate/README.md) | ~8–12 |

Overview: [kuber-advanced/16](kuber-advanced/16-argocd.md); split CI: [gitlab-advanced/11](gitlab-advanced/11-gitlab-and-argocd.md). Stack: [deploy/gitops](../deploy/gitops/README.md) on **mockctl**.

### nginx (after linux-intermediate or in parallel with containers-basic)

| Stage | Course | Hours |
|------|------|------|
| N1 | [nginx-basic](nginx-basic/README.md) | ~6–8 |
| N2 | [nginx-intermediate](nginx-intermediate/README.md) | ~8–10 |

Overview on a VM: [linux-intermediate/13-nginx](linux-intermediate/13-nginx.md), TLS: [09-tls-openssl](linux-intermediate/09-tls-openssl.md). Stack: [deploy/nginx](../deploy/nginx/README.md). Next: [kuber-basic/20-ingress](kuber-basic/20-ingress.md).

### Secrets / Vault (after gitlab-basic and aws-intermediate KMS)

| Stage | Course | Hours |
|------|------|------|
| S1 | [secrets-basic](secrets-basic/README.md) | ~8–10 |
| S2 | [secrets-advanced](secrets-advanced/README.md) | ~10–14 |

Stack: [deploy/vault](../deploy/vault/README.md). Relations: [gitlab-basic/07](gitlab-basic/07-variables-secrets.md), [aws-intermediate/11-secrets-kms](aws-intermediate/11-secrets-kms.md), [kuber-basic/12](kuber-basic/12-config-and-secret.md).

### OpenSearch / ELK (after observability-intermediate or a kafka-log pipeline)

| Stage | Course | Hours |
|------|------|------|
| Os1 | [opensearch-basic](opensearch-basic/README.md) | ~8–10 |
| Os2 | [opensearch-intermediate](opensearch-intermediate/README.md) | ~10–14 |

Prerequisites: [observability-basic](observability-basic/README.md) (metrics) and ideally [observability-intermediate](observability-intermediate/README.md) (Loki — comparison in [opensearch-basic/12](opensearch-basic/12-vs-loki-elasticsearch.md)). Log stream from Kafka — [kafka-basic/12-patterns](kafka-basic/12-patterns.md). Stack: [deploy/opensearch](../deploy/opensearch/README.md).

### Messaging Deep (after kafka-basic/18 or in parallel with rabbitmq/aws)

| Stage | Course | Hours |
|------|------|------|
| Msg | [messaging-deep](messaging-deep/README.md) | ~12–16 |

Broker comparison: Kafka, Rabbit, SQS, Redis Streams, EventBridge. Introduction — [kafka-basic/18](kafka-basic/18-vs-queues.md). No new stack.

### RabbitMQ (after kafka-basic/18 or in parallel with aws-intermediate SQS)

| Stage | Course | Hours |
|------|------|------|
| Mq1 | [rabbitmq-basic](rabbitmq-basic/README.md) | ~8–10 |
| Mq2 | [rabbitmq-intermediate](rabbitmq-intermediate/README.md) | ~10–12 |

Broker comparison: [kafka-basic/18-vs-queues](kafka-basic/18-vs-queues.md). DLQ in AWS: [aws-intermediate/07-sqs-dlq](aws-intermediate/07-sqs-dlq.md). Stack: [deploy/rabbitmq](../deploy/rabbitmq/README.md).

### PostgreSQL (in parallel with the application / AWS)

| Stage | Course | Hours |
|------|------|------|
| P1 | [postgresql-basic](postgresql-basic/README.md) | ~11 |
| P2 | [postgresql-intermediate](postgresql-intermediate/README.md) | ~14 |
| P3 | [postgresql-advanced](postgresql-advanced/README.md) | ~14 |

### PostgreSQL — specializations

| Stage | Course | When |
|------|------|-------|
| P4a | [postgresql-developer](postgresql-developer/README.md) | after P1 (basic) |
| P4b | [postgresql-performance](postgresql-performance/README.md) | after P2 |
| P4c | [postgresql-ops](postgresql-ops/README.md) | after P2 |
| P4d | [postgresql-security](postgresql-security/README.md) | after P2–P3 |

You can learn **AWS** and **Kubernetes** in parallel after gitlab-basic; **Linux intermediate** logically fits before or together with kuber-basic.

## Local infrastructure

| Stack | Command |
|------|---------|
| Linux labs | `docker compose -f deploy/linux/docker-compose.yml up -d` — [deploy/linux/README.md](../deploy/linux/README.md) |
| Kubernetes | `mockctl up` — [INSTALL.md](../INSTALL.md) |
| AWS emulation | `docker compose -f deploy/localstack/docker-compose.yml up -d` |
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

Build it end-to-end:

1. App in GitLab → CI build `image-platform`.
2. GitOps repo → Argo CD on mockctl.
3. Infra → Terraform + LocalStack (or AWS dev).
4. Security → [appsec-fundamentals](appsec-fundamentals/README.md) baseline + SAST + Trivy in the MR.
5. Host/node → checklist from [linux-advanced/28-final-project.md](linux-advanced/28-final-project.md).

See [gitlab-advanced/15-final-project.md](gitlab-advanced/15-final-project.md).
