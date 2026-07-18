# Курсы

Все курсы рассчитаны на локальный кластер `mock-exams`, поднимаемый утилитой [`mockctl up`](../mockctl/README.md).

Установка кластера и `kubectl` — см. [`INSTALL.md`](../INSTALL.md).

## Маршрут обучения

```text
linux-basic  →  linux-intermediate  →  linux-advanced
       │              │
       ├── linux-shell (спец., после basic)
       └── linux-security (спец., после intermediate)

linux-basic  →  containers-basic  →  kuber-basic  →  kuber-intermediate  →  kuber-advanced
                    (deploy/containers)     ↑              │
              gitlab-intermediate (registry) ─┘              ├── mock-ckad

containers-basic + postgresql-basic  →  fastapi  (deploy/fastapi)  —  backend API, 42 урока
       ↑                    ↑
  python venv          postgresql-developer (миграции, N+1)
       │
       └── fastapi  →  python-async  (deploy/python-async)  —  asyncio углублённо, 36 уроков
              │
              └── python-testing  (examples/shop-lab)  —  pytest, 28 уроков
              │
              ├── django  (deploy/django)  —  Django+DRF, 42 урока
              ├── python-celery  (deploy/celery)  —  фоновые задачи, 36 уроков
              ├── sqlalchemy-deep  (deploy/sqlalchemy)  —  ORM 2.0, 36 уроков
              ├── python-aws  (deploy/python-aws)  —  boto3 + LocalStack, 36 уроков
              └── fastapi  →  python-async  —  сравнение API stacks
              │
              ├── api-design  (теория: REST, OpenAPI, версии, idempotency)  —  после fastapi/02 или параллельно
              ├── microservices-patterns  (теория: saga, outbox, CQRS, миграция)  —  после messaging-deep + api-design
              ├── python-algorithms  (алго-секция на Python)  —  параллельно backend-курсам
              ├── behavioral-interviews  (теория: STAR, story bank, mock)  —  перед интервью
              ├── python-deep-dive  (GIL, memory, descriptors, interview Q&A)  —  параллельно backend
              └── ood-python  (теория: SOLID, patterns, parking/LRU/rate limiter)  —  перед интервью
                                                             ├── mock-cka
                                                             └── mock-cks   [план]

aws-basic  →  aws-terraform  →  aws-intermediate  →  aws-advanced   (Docker + LocalStack / EKS)

gitlab-basic  →  gitlab-intermediate  →  gitlab-advanced   (GitLab CE + mockctl + Argo)

bare-metal  (теория)  —  параллельно

postgresql-basic  →  postgresql-intermediate  →  postgresql-advanced  (deploy/postgres)
       │                      │
       └── postgresql-developer (параллельно после basic)
                              ├── postgresql-performance
                              ├── postgresql-ops
                              └── postgresql-security (+ advanced)

linux-basic  →  kafka-basic  →  kafka-intermediate  →  kafka-advanced  (deploy/kafka)
       ↑              ↑
  aws-basic      aws-intermediate (SQS/EventBridge) — параллельно полезно

linux-basic  →  redis-basic  →  redis-intermediate  →  redis-advanced  (deploy/redis)
       ↑              ↑
  aws-basic      kafka-basic (Streams) — параллельно полезно

linux-basic / kuber-intermediate  →  observability-basic  →  intermediate  →  advanced  (deploy/observability)
       ↑                                    ↑
  kuber-advanced/14 (kube-prometheus)   aws-intermediate (CloudWatch)

observability-intermediate (Loki)  →  opensearch-basic  →  opensearch-intermediate  (deploy/opensearch)
       ↑                                      ↑
  kafka-* (log pipeline)              full-text / ISM / ingest

kafka-basic/18 (сравнение)  →  messaging-deep  (теория: Kafka/Rabbit/SQS/Redis/EventBridge)
       ↓                              ↓
  rabbitmq-basic  →  rabbitmq-intermediate  (deploy/rabbitmq)
       ↑
  aws-intermediate (SQS/DLQ)    routing, DLX, quorum

gitlab-basic / aws-intermediate  →  secrets-basic  →  secrets-advanced  (deploy/vault)
       ↑                                    ↑
  kuber-basic (K8s Secret)            PKI, rotation, Transit

linux-intermediate (обзор)  →  nginx-basic  →  nginx-intermediate  (deploy/nginx)
       ↑                              ↑
  13-nginx, 09-tls              TLS, rate limit, cache

kuber-intermediate  →  gitops-basic  →  gitops-intermediate  (deploy/gitops + mockctl)
       ↑                    ↑
  Helm, deploy          Argo CD, app-of-apps, waves

observability-basic  →  sre  (теория: SLO, инциденты, on-call, DR, org)
       ↑
  метрики; углубление SLO — observability-intermediate

gitlab-basic  →  devops-culture  (теория: DORA, Team Topologies, Conway, CI-культура)
       ↑
  sre/13, gitlab-*; дальше — sre целиком, platform/gitops

kuber-intermediate + gitlab-basic  →  appsec-fundamentals  (теория: TM, K8s/CI/cloud misconfig, supply chain)
       ↑
  containers-basic/14, linux-security/01; практика — gitlab-advanced, kuber-advanced фаза 2

linux-intermediate + aws-intermediate (VPC)  →  networking-deep  (L3–L7, BGP, overlay, troubleshooting)
       ↑
  kuber-*, nginx-*, bare-metal/07

aws-intermediate  →  aws-advanced  →  finops  (budgets, tags, rightsizing, Kubecost)
       ↑                                    ↑
  aws-terraform                        sre/15 (economics)
```

Полный маршрут DevOps: [devops-path.md](devops-path.md).

## Курсы

| Курс | Уровень | Длительность | Описание |
|---|---|---|---|
| [kuber-basic](kuber-basic/README.md) | Junior | ~10–14 ч | Архитектура, kubectl, Pod, Deployment, Service, Ingress, Troubleshooting. Старт «с нуля». |
| [kuber-intermediate](kuber-intermediate/README.md) | Middle | ~14–20 ч | StatefulSet, RBAC, Helm, HPA, NetworkPolicy, Probes/Resources глубже, мини-проект. |
| [kuber-advanced](kuber-advanced/README.md) | Senior | ~16–24 ч | CKA-core, CKS-lite, GitOps, опционально observability/operators. 27 уроков по фазам. |
| [mock-ckad](mock-ckad/README.md) | CKAD-prep | 3 × 2 ч | Имитация экзамена CKAD: 3 захода по 7 задач, авто-проверка. |
| [mock-cka](mock-cka/README.md) | CKA-prep | 3 × 2 ч | Имитация CKA: RBAC, scheduling, etcd snapshot, PVC, troubleshooting. `mockctl`. |
| [aws-basic](aws-basic/README.md) | Junior | ~6–8 ч | AWS: регионы, IAM, VPC, EC2, S3, RDS/DynamoDB, Lambda, SQS/SNS. Теория (10 уроков). |
| [aws-terraform](aws-terraform/README.md) | Middle | ~12–16 ч | Terraform + LocalStack, 23 урока, финальный проект S3+Lambda+DynamoDB. |
| [aws-intermediate](aws-intermediate/README.md) | Middle+ | ~14–18 ч | VPC, ALB, API Gateway, SQS/DLQ, EventBridge, RDS, ECS, observability, CI security. |
| [aws-advanced](aws-advanced/README.md) | Senior | ~18–24 ч | Organizations, TGW, WAF, EKS+IRSA, GuardDuty/Config, DR, cost. 27 уроков по фазам. |
| [gitlab-basic](gitlab-basic/README.md) | Junior | ~10–14 ч | Мега-подробный Git + GitLab CI: MR, `.gitlab-ci.yml`, runners, variables, artifacts. 12 уроков + cheatsheet. `deploy/gitlab` :8929. |
| [gitlab-intermediate](gitlab-intermediate/README.md) | Middle | ~12–18 ч | Multi-stage DAG, Container Registry, deploy mockctl, environments, templates, Terraform CI. 15 уроков + cheatsheet. |
| [gitlab-advanced](gitlab-advanced/README.md) | Senior | ~16–22 ч | SAST/Trivy, GitLab Agent, OIDC AWS, K8s runners, Argo CD split, reliability. 17 уроков + capstone. |
| [linux-basic](linux-basic/README.md) | Junior | ~14–16 ч | Shell, users, systemd, LVM, SSH, cron. Docker-стенд `deploy/linux`. |
| [linux-intermediate](linux-intermediate/README.md) | Middle | ~16–18 ч | Сеть, DNS, firewall, TLS, nginx, NFS, sudo, performance. |
| [linux-advanced](linux-advanced/README.md) | Senior | ~14–16 ч | namespaces/cgroups, audit, hardening, keepalived, подготовка K8s-ноды. |
| [linux-shell](linux-shell/README.md) | Спец. | ~6–8 ч | Bash: strict mode, awk/sed, shellcheck, скрипты для CI. |
| [linux-security](linux-security/README.md) | Спец. | ~6–8 ч | SSH hardening, firewall, PKI, audit report. |
| [bare-metal](bare-metal/README.md) | Теория | ~4–6 ч | Физические серверы, BMC, стойка, PXE, RAID, K8s на metal. Без лаб. |
| [postgresql-basic](postgresql-basic/README.md) | Junior | ~10–12 ч | Администрирование PG: архитектура, роли, MVCC, индексы, pg_dump. |
| [postgresql-intermediate](postgresql-intermediate/README.md) | Middle | ~12–16 ч | WAL, репликация, PITR, vacuum, monitoring, PgBouncer. |
| [postgresql-advanced](postgresql-advanced/README.md) | Senior | ~12–16 ч | Patroni, partitioning, RLS, upgrade, CNPG/RDS, troubleshooting. |
| [postgresql-performance](postgresql-performance/README.md) | Спец. | ~6–8 ч | Планировщик, JIT, auto_explain, pgbench, hypopg. |
| [postgresql-developer](postgresql-developer/README.md) | Спец. | ~6–8 ч | Flyway, Liquibase, JSONB, FTS, advisory locks, CI. |
| [postgresql-ops](postgresql-ops/README.md) | Спец. | ~6–8 ч | pgBackRest, WAL-G, blue/green, on-call runbooks. |
| [postgresql-security](postgresql-security/README.md) | Спец. | ~6–8 ч | SCRAM, pgaudit, SSL, RLS, compliance baseline. |
| [kafka-basic](kafka-basic/README.md) | Junior | ~10–12 ч | Topic/partition/offset, producer/consumer, CLI/kcat, lag. Docker `deploy/kafka`. |
| [kafka-intermediate](kafka-intermediate/README.md) | Middle | ~12–16 ч | RF/ISR, tuning, rebalance, EOS, Schema Registry, Connect, ACL. 3-broker cluster. |
| [kafka-advanced](kafka-advanced/README.md) | Senior | ~14–18 ч | KRaft/ZK, Streams, MSK, troubleshooting, interview Q&A, system design, capstone. |
| [redis-basic](redis-basic/README.md) | Junior | ~10–12 ч | Типы данных, TTL, cache-aside, pub/sub, eviction, redis-cli. Docker `deploy/redis`. |
| [redis-intermediate](redis-intermediate/README.md) | Middle | ~12–16 ч | RDB/AOF, replication, Sentinel, Streams, ACL, Lua, backup. |
| [redis-advanced](redis-advanced/README.md) | Senior | ~14–18 ч | Cluster, hot keys, security, troubleshooting, interview Q&A, capstone. |
| [observability-basic](observability-basic/README.md) | Junior | ~10–12 ч | Prometheus, PromQL, Grafana, алерты, RED/USE. Docker `deploy/observability`. |
| [observability-intermediate](observability-intermediate/README.md) | Middle | ~12–16 ч | Loki/LogQL, SLO, Alertmanager routing, histograms, OTel metrics. |
| [observability-advanced](observability-advanced/README.md) | Senior | ~14–18 ч | Traces/Jaeger, kube-prometheus, cardinality, runbooks, interview, capstone. |
| [opensearch-basic](opensearch-basic/README.md) | Junior | ~8–10 ч | Индексы, mapping, Query DSL, bulk, Dashboards. Docker `deploy/opensearch`. |
| [opensearch-intermediate](opensearch-intermediate/README.md) | Middle | ~10–14 ч | Templates, ingest pipelines, ISM, шарды, managed OpenSearch. |
| [rabbitmq-basic](rabbitmq-basic/README.md) | Junior | ~8–10 ч | Exchanges, bindings, work queues, fanout, direct/topic, ack. `deploy/rabbitmq`. |
| [rabbitmq-intermediate](rabbitmq-intermediate/README.md) | Middle | ~10–12 ч | Quorum queues, DLX, TTL, publisher confirms, monitoring. |
| [containers-basic](containers-basic/README.md) | Junior | ~8–10 ч | Dockerfile, run/exec, сети, volumes, Compose, registry, security. `deploy/containers`. |
| [secrets-basic](secrets-basic/README.md) | Junior | ~8–10 ч | Vault KV, policies, auth, GitLab CI, K8s auth (обзор). `deploy/vault`. |
| [secrets-advanced](secrets-advanced/README.md) | Senior | ~10–14 ч | PKI, rotation, Transit, AppRole, HA/unseal, audit, interview, capstone. |
| [nginx-basic](nginx-basic/README.md) | Junior | ~6–8 ч | vhost, reverse proxy, upstream, 502, Ingress preview. `deploy/nginx`. |
| [nginx-intermediate](nginx-intermediate/README.md) | Middle | ~8–10 ч | TLS, HSTS, rate limit, gzip/cache, tuning. |
| [gitops-basic](gitops-basic/README.md) | Middle | ~8–10 ч | GitOps, Argo CD, Application, selfHeal/prune. `mockctl` + `deploy/gitops`. |
| [gitops-intermediate](gitops-intermediate/README.md) | Middle+ | ~8–12 ч | app-of-apps, sync waves, rollback, Flux сравнение, split CI/CD. |
| [sre](sre/README.md) | Middle+ | ~25–35 ч | Теория SRE: SLI/SLO, error budget, инциденты, on-call, capacity, DR, org. 16 глав «книгой». |
| [networking-deep](networking-deep/README.md) | Middle+ | ~20–27 ч | Сети: L2–L7, маршруты, NAT, VPC, overlay, BGP, DNS/TLS, K8s path, troubleshooting. 16 глав + лаба `deploy/linux`. |
| [finops](finops/README.md) | Middle+ | ~17–22 ч | FinOps: теги, Cost Explorer/CUR, budgets, rightsizing, EKS cost, Kubecost, SP/Spot, governance. 15 глав + лабы AWS. |
| [devops-culture](devops-culture/README.md) | Middle+ | ~12–16 ч | Теория: DORA, Conway, Team Topologies, stream/platform, CI-культура, антипаттерны. 14 глав «книгой». |
| [messaging-deep](messaging-deep/README.md) | Middle+ | ~12–16 ч | Теория: queue vs log, Kafka/Rabbit/SQS/Redis Streams, DLQ, outbox, system design. Без нового стенда. |
| [appsec-fundamentals](appsec-fundamentals/README.md) | Middle+ | ~14–18 ч | Теория DevSecOps: threat model, OWASP, K8s/CI/cloud misconfig, supply chain, IaC policy, compliance. Без стенда. |
| [fastapi](fastapi/README.md) | Middle+ | ~40–55 ч | Полный курс FastAPI: Pydantic, DI, async SQLAlchemy, JWT, Redis, тесты, observability, Docker/nginx. 42 урока + capstone. `deploy/fastapi`. |
| [python-async](python-async/README.md) | Спец. | ~18–24 ч | Asyncio: event loop, TaskGroup, httpx, asyncpg, Redis asyncio, executors, pytest-asyncio. 36 уроков + capstone. `deploy/python-async`. |
| [python-testing](python-testing/README.md) | Спец. | ~14–18 ч | pytest: fixtures, mock, coverage, Hypothesis, integration, CI. 28 уроков + capstone. `examples/shop-lab`. |
| [django](django/README.md) | Middle+ | ~45–55 ч | Django 5 + DRF: ORM, admin, migrations, API, JWT, Redis, tests, gunicorn/nginx. 42 урока + capstone. `deploy/django`. |
| [python-celery](python-celery/README.md) | Middle+ | ~18–24 ч | Celery 5: RabbitMQ, Redis backend, retries, idempotency, canvas, Beat, Flower, Docker. 36 уроков + capstone. `deploy/celery`. |
| [sqlalchemy-deep](sqlalchemy-deep/README.md) | Middle+ | ~22–28 ч | SQLAlchemy 2.0: Core, ORM, async, relationships, Alembic, N+1, Repository. 36 уроков + capstone. `deploy/sqlalchemy`. |
| [python-aws](python-aws/README.md) | Middle+ | ~22–28 ч | boto3: S3, DynamoDB, Lambda, SQS, SNS, EventBridge, Secrets, moto/LocalStack. 36 уроков + capstone. `deploy/python-aws`. |
| [api-design](api-design/README.md) | Middle+ | ~12–16 ч | Теория: REST, HTTP, OpenAPI, ошибки, версии, idempotency, auth, webhooks, границы сервисов. 14 глав + ADR. Без стенда. |
| [microservices-patterns](microservices-patterns/README.md) | Middle+ | ~20–28 ч | Теория: монолит vs micro, DDD, saga, outbox, CQRS, resilience, observability, тесты, миграция. 20 глав + подзадачи + ADR. Без стенда. |
| [python-algorithms](python-algorithms/README.md) | Middle | ~35–45 ч | Алгоритмы на Python: паттерны, сложность, 26 глав + подзадачи, pytest-лабы, mock-неделя. [examples/](python-algorithms/examples/pyproject.toml). |
| [behavioral-interviews](behavioral-interviews/README.md) | Middle+ | ~12–16 ч | Поведенческие собеседования: STAR, story bank, конфликт/провал/мотивация, mock. 20 глав + Story Portfolio. Без стенда. |
| [python-deep-dive](python-deep-dive/README.md) | Middle+ | ~22–30 ч | Устройство Python: CPython, GIL, GC, MRO, descriptors, metaclass, typing, concurrency. 22 главы + pytest-лабы. [examples/](python-deep-dive/examples/pyproject.toml). |
| [ood-python](ood-python/README.md) | Middle+ | ~20–28 ч | OOD на собеседовании: SOLID, паттерны, классические задачи (parking, LRU, rate limiter). 20 глав + подзадачи, pytest-лабы. Без стенда. |
| [javascript-basic](javascript-basic/README.md) | Junior | ~14–18 ч | Чистый JS: типы, scope, closures, `this`, прототипы, Promises, modules, `fetch`. 40 уроков + capstone. Node на хосте. |
| [typescript-basic](typescript-basic/README.md) | Junior+ | ~12–16 ч | TS поверх JS: union, generics, `strict`, tsconfig, Zod, typed `fetch`. 34 урока + capstone. Node на хосте. |
| [react-basic](react-basic/README.md) | Middle | ~16–20 ч | React: компоненты, hooks, формы, React Router, TanStack Query к FastAPI `:8090`. 38 уроков + capstone. Vite на хосте. |
| [react-intermediate](react-intermediate/README.md) | Middle+ | ~18–22 ч | Auth (JWT refresh), error boundaries, performance, MSW, Django admin. 40 уроков + capstone. |
| [nextjs-basic](nextjs-basic/README.md) | Middle+ | ~20–24 ч | Next.js App Router: SSR, RSC, Route Handlers, Server Actions, metadata, Docker `:8098`. 40 уроков + capstone. |
| [nodejs-basic](nodejs-basic/README.md) | Middle | ~16–20 ч | Node.js BFF: event loop, libuv, streams, Express, pino, прокси к FastAPI `:8090`. 40 уроков + capstone. Node на хосте. |
| [go-basic](go-basic/README.md) | Junior | ~14–18 ч | Базовый Go: типы, structs, interfaces, errors, slices/maps, пакеты, `go test`, линтеры. 38 уроков + capstone. Go на хосте. |

JS-маршрут: [javascript-path.md](javascript-path.md). Go-маршрут: [golang-path.md](golang-path.md).

## Требования к кластеру

| Курс | Дополнительно сверх дефолта |
|---|---|
| `kuber-basic` | `metrics-server`, `ingress` (включаются `mockctl up`) |
| `kuber-intermediate` | то же + `helm` (ставится в курсе) |
| `kuber-advanced` | то же + `calico` CNI (для NetworkPolicy и mesh-разделов), `kube-prometheus-stack`; Argo CD — см. `gitops-*` |
| `gitops-*` | `mockctl up` + [`deploy/gitops`](../deploy/gitops/README.md) — Argo CD в кластере; fork GitHub для Application |
| `sre` | Только чтение; практика SLO — опционально [`observability-*`](../deploy/observability/README.md), `mockctl` |
| `networking-deep` | Теория без кластера; лаба — [`deploy/linux`](../deploy/linux/README.md); K8s-глава — опционально `mockctl` |
| `finops` | Теория без AWS; лабы — Terraform + [LocalStack](../deploy/localstack/docker-compose.yml) или dev account; Kubecost — `mockctl` + Helm |
| `devops-culture` | Только чтение |
| `messaging-deep` | Только чтение; практика — [kafka-*](kafka-basic/README.md), [rabbitmq-*](rabbitmq-basic/README.md), [aws-intermediate](aws-intermediate/README.md) |
| `appsec-fundamentals` | Только чтение; практика — [gitlab-advanced](gitlab-advanced/README.md), [kuber-advanced](kuber-advanced/README.md), [secrets-*](secrets-basic/README.md), [aws-intermediate/21](aws-intermediate/21-security-ci.md) |
| `api-design` | Только чтение; практика — [fastapi](fastapi/README.md), [django](django/README.md), [fastapi/32](fastapi/32-contract-tests.md), [fastapi/39](fastapi/39-versioning-idempotency.md) |
| `microservices-patterns` | Только чтение; практика — [messaging-deep](messaging-deep/README.md), [api-design](api-design/README.md), [python-async](python-async/README.md), [python-celery](python-celery/README.md), `mockctl` |
| `python-algorithms` | venv + [examples](python-algorithms/examples/pyproject.toml); опционально [python-testing](python-testing/README.md) |
| `behavioral-interviews` | Только чтение + свой `story-bank.md`; техника — [python-algorithms](python-algorithms/README.md), [microservices-patterns](microservices-patterns/README.md) |
| `python-deep-dive` | venv + [examples](python-deep-dive/examples/pyproject.toml); после базового Python |
| `ood-python` | venv + [examples](ood-python/examples/pyproject.toml); после [python-deep-dive](python-deep-dive/README.md) глав 03, 11–15 |
| `mock-ckad` | то же, что у `kuber-intermediate` |
| `mock-cka` | `mockctl up`; прогон 03 — `minikube ssh` для etcd; желательно `kuber-advanced` фаза 1 |

Если `mockctl up` уже работал — ничего больше делать не нужно: 2 vCPU и 4 ГБ RAM в Docker Desktop хватит для всех курсов, кроме отдельных тяжёлых лаб в `kuber-advanced` (там потребуется 4 vCPU / 6 ГБ).

## AWS-курсы (отдельно от Kubernetes)

| Курс | Что нужно |
|---|---|
| `aws-basic` | Только чтение; практика — позже в лабах / `aws-terraform` |
| `aws-terraform` | Docker, [LocalStack](https://localstack.cloud/) или [MiniStack](https://github.com/ministackorg/ministack), Terraform, опционально `pip install terraform-local` |
| `aws-intermediate` | то же + пройденный `aws-terraform`; 4+ ГБ RAM для Docker |
| `aws-advanced` | LocalStack + **kubectl**; EKS/Organizations — real AWS dev ([optional](aws-advanced/optional-aws-advanced.md)) |
| `gitlab-*` | [GitLab CE](../../deploy/gitlab/README.md) 4+ GB RAM; intermediate+ нужен `mockctl up` |
| `postgresql-*` | [PostgreSQL Docker](../../deploy/postgres/README.md) — `docker compose build`, порт 5432; performance/security — hypopg, pgaudit |
| `postgresql-developer` | + [Flyway CLI](https://flywaydb.org/download); опционально Liquibase |
| `postgresql-ops` | опционально MinIO: `docker-compose.ops.yml` |
| `linux-*` | [`deploy/linux`](../deploy/linux/README.md) — `docker compose up`, 4+ ГБ RAM; advanced keepalived: overlay compose |
| `kafka-*` | [`deploy/kafka`](../deploy/kafka/README.md) — `docker compose up`, порт `9094`; intermediate: `docker-compose.cluster.yml`; 4+ ГБ RAM |
| `redis-*` | [`deploy/redis`](../deploy/redis/README.md) — `docker compose up`, порт `6379`; replication/sentinel/cluster overlays; 2+ ГБ RAM |
| `observability-*` | [`deploy/observability`](../deploy/observability/README.md) — `docker compose up --build`, порты `9090`/`3000`; 4+ ГБ RAM; advanced K8s: `mockctl` + kube-prometheus-stack |
| `opensearch-*` | [`deploy/opensearch`](../deploy/opensearch/README.md) — `docker compose up`, порты `9200`/`5601`; 2+ ГБ RAM (heap 512m) |
| `rabbitmq-*` | [`deploy/rabbitmq`](../deploy/rabbitmq/README.md) — `docker compose up`, AMQP `5672`, UI `15672`; quorum: cluster compose |
| `containers-basic` | [`deploy/containers`](../deploy/containers/README.md) — `docker compose up --build`, web `8088`; registry overlay `5000`; 2+ ГБ RAM |
| `secrets-*` | [`deploy/vault`](../deploy/vault/README.md) — `docker compose up`, API `8200`, dev token `course`; `init-engines.sh` для PKI |
| `nginx-*` | [`deploy/nginx`](../deploy/nginx/README.md) — `docker compose up --build`, HTTP `8080`, HTTPS `8443` после `gen-certs.sh` |
| `fastapi` | [`deploy/fastapi`](../deploy/fastapi/README.md) — `docker compose up --build`, API `8090`; 4+ ГБ RAM с postgres+redis |
| `python-async` | [`deploy/python-async`](../deploy/python-async/README.md) — `docker compose up --build`, gateway `8095`; лабы также на хосте в venv |
| `python-testing` | [`courses/python-testing/examples`](python-testing/examples/pyproject.toml) — venv + `pytest`; integration — `deploy/python-async` :8095 |
| `django` | [`deploy/django`](../deploy/django/README.md) — `docker compose up --build`, web **8092**; postgres+redis inside compose |
| `python-celery` | [`deploy/celery`](../deploy/celery/README.md) — `docker compose up --build`, API **8093**, Flower **5555**; rabbitmq+redis inside compose |
| `sqlalchemy-deep` | [`deploy/sqlalchemy`](../deploy/sqlalchemy/README.md) — `docker compose up --build`, Postgres **5433**; lab container + Alembic |
| `python-aws` | [`deploy/python-aws`](../deploy/python-aws/README.md) — `docker compose up --build`, LocalStack **4566**; lab container + boto3 |
| `javascript-basic` | Node.js LTS на хосте; лабы — [`courses/javascript-basic/examples`](javascript-basic/examples/package.json) |
| `typescript-basic` | Node.js LTS; лабы — [`courses/typescript-basic/examples`](typescript-basic/examples/package.json); лабы 27/30/capstone — опционально [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090` |
| `react-basic` | Node.js LTS; лабы — [`courses/react-basic/examples`](react-basic/examples/package.json); API-лабы — [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090` (proxy `/api` в Vite или CORS) |
| `react-intermediate` | Node.js LTS; лабы — [`courses/react-intermediate/examples`](react-intermediate/examples/package.json); API — [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090`, Django `:8092` |
| `nextjs-basic` | Node.js LTS; лабы — [`courses/nextjs-basic/examples`](nextjs-basic/examples/package.json); API — [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090`; Docker capstone — порт `:8098` (см. гл. 35) |
| `go-basic` | Go 1.22+ на хосте; лабы — [`courses/go-basic/examples`](go-basic/examples/go.mod); `go run ./lab/…` из каталога examples |
| `gitops-*` | [`deploy/gitops`](../deploy/gitops/README.md) — `mockctl up`, `scripts/install-argocd.sh`, UI port-forward `8080` |
