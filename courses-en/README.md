# Courses

All courses target the local `mock-exams` cluster brought up with [`mockctl up`](../mockctl/README.md).

For cluster and `kubectl` setup, see [`INSTALL.md`](../INSTALL.md).

## Learning path

```text
linux-basic  →  linux-intermediate  →  linux-advanced
       │              │
       ├── linux-shell (spec., after basic)
       └── linux-security (spec., after intermediate)

linux-basic  →  containers-basic  →  kuber-basic  →  kuber-intermediate  →  kuber-advanced
                    (deploy/containers)     ↑              │
              gitlab-intermediate (registry) ─┘              ├── mock-ckad

containers-basic + postgresql-basic  →  fastapi  (deploy/fastapi)  —  backend API, 42 lessons
       ↑                    ↑
  python venv          postgresql-developer (migrations, N+1)
       │
       └── fastapi  →  python-async  (deploy/python-async)  —  asyncio in depth, 36 lessons
              │
              └── python-testing  (examples/shop-lab)  —  pytest, 28 lessons
              │
              ├── django  (deploy/django)  —  Django+DRF, 42 lessons
              ├── python-celery  (deploy/celery)  —  background tasks, 36 lessons
              ├── sqlalchemy-deep  (deploy/sqlalchemy)  —  ORM 2.0, 36 lessons
              ├── python-aws  (deploy/python-aws)  —  boto3 + LocalStack, 36 lessons
              └── fastapi  →  python-async  —  comparison of API stacks
              │
              ├── api-design  (theory: REST, OpenAPI, versioning, idempotency)  —  after fastapi/02 or in parallel
              ├── microservices-patterns  (theory: saga, outbox, CQRS, migration)  —  after messaging-deep + api-design
              ├── python-algorithms  (algo section in Python)  —  in parallel with backend courses
              ├── behavioral-interviews  (theory: STAR, story bank, mock)  —  before interviews
              ├── python-deep-dive  (GIL, memory, descriptors, interview Q&A)  —  in parallel with backend
              └── ood-python  (theory: SOLID, patterns, parking/LRU/rate limiter)  —  before interviews
                                                             ├── mock-cka
                                                             └── mock-cks   [planned]

aws-basic  →  aws-terraform  →  aws-intermediate  →  aws-advanced   (Docker + LocalStack / EKS)

gitlab-cicd  (recommended)  ·  gitlab-basic → gitlab-intermediate → gitlab-advanced  (deep dives)

bare-metal  (theory)  —  in parallel

postgresql-basic  →  postgresql-intermediate  →  postgresql-advanced  (deploy/postgres)
       │                      │
       └── postgresql-developer (in parallel after basic)
                              ├── postgresql-performance
                              ├── postgresql-ops
                              └── postgresql-security (+ advanced)

linux-basic  →  kafka-basic  →  kafka-intermediate  →  kafka-advanced  (deploy/kafka)
       ↑              ↑
  aws-basic      aws-intermediate (SQS/EventBridge) — useful in parallel

linux-basic  →  redis-basic  →  redis-intermediate  →  redis-advanced  (deploy/redis)
       ↑              ↑
  aws-basic      kafka-basic (Streams) — useful in parallel

linux-basic / kuber-intermediate  →  observability-basic  →  intermediate  →  advanced  (deploy/observability)
       ↑                                    ↑
  kuber-advanced/14 (kube-prometheus)   aws-intermediate (CloudWatch)

observability-intermediate (Loki)  →  opensearch-basic  →  opensearch-intermediate  (deploy/opensearch)
       ↑                                      ↑
  kafka-* (log pipeline)              full-text / ISM / ingest

kafka-basic/18 (comparison)  →  messaging-deep  (theory: Kafka/Rabbit/SQS/Redis/EventBridge)
       ↓                              ↓
  rabbitmq-basic  →  rabbitmq-intermediate  (deploy/rabbitmq)
       ↑
  aws-intermediate (SQS/DLQ)    routing, DLX, quorum

gitlab-basic / aws-intermediate  →  secrets-basic  →  secrets-advanced  (deploy/vault)
       ↑                                    ↑
  kuber-basic (K8s Secret)            PKI, rotation, Transit

linux-intermediate (overview)  →  nginx-basic  →  nginx-intermediate  (deploy/nginx)
       ↑                              ↑
  13-nginx, 09-tls              TLS, rate limit, cache

kuber-intermediate  →  gitops-basic  →  gitops-intermediate  (deploy/gitops + mockctl)
       ↑                    ↑
  Helm, deploy          Argo CD, app-of-apps, waves

observability-basic  →  sre  (theory: SLO, incidents, on-call, DR, org)
       ↑
  metrics; deeper SLO — observability-intermediate

gitlab-basic  →  devops-culture  (theory: DORA, Team Topologies, Conway, CI culture)
       ↑
  sre/13, gitlab-*; then — full sre, platform/gitops

kuber-intermediate + gitlab-basic  →  appsec-fundamentals  (theory: TM, K8s/CI/cloud misconfig, supply chain)
       ↑
  containers-basic/14, linux-security/01; practice — gitlab-advanced, kuber-advanced phase 2

linux-intermediate + aws-intermediate (VPC)  →  networking-deep  (L3–L7, BGP, overlay, troubleshooting)
       ↑
  kuber-*, nginx-*, bare-metal/07

aws-intermediate  →  aws-advanced  →  finops  (budgets, tags, rightsizing, Kubecost)
       ↑                                    ↑
  aws-terraform                        sre/15 (economics)
```

Full DevOps path: [devops-path.md](devops-path.md).

## Courses

| Course | Level | Duration | Description |
|---|---|---|---|
| [kuber-basic](kuber-basic/README.md) | Junior | ~10–14 h | Architecture, kubectl, Pod, Deployment, Service, Ingress, Troubleshooting. A "from scratch" start. |
| [kuber-intermediate](kuber-intermediate/README.md) | Middle | ~14–20 h | StatefulSet, RBAC, Helm, HPA, NetworkPolicy, Probes/Resources deeper, mini-project. |
| [kuber-advanced](kuber-advanced/README.md) | Senior | ~16–24 h | CKA-core, CKS-lite, GitOps, optional observability/operators. 27 lessons by phase. |
| [mock-ckad](mock-ckad/README.md) | CKAD-prep | 3 × 2 h | CKAD exam simulation: 3 runs of 7 tasks, auto-graded. |
| [mock-cka](mock-cka/README.md) | CKA-prep | 3 × 2 h | CKA simulation: RBAC, scheduling, etcd snapshot, PVC, troubleshooting. `mockctl`. |
| [aws-basic](aws-basic/README.md) | Junior | ~6–8 h | AWS: regions, IAM, VPC, EC2, S3, RDS/DynamoDB, Lambda, SQS/SNS. Theory (10 lessons). |
| [aws-terraform](aws-terraform/README.md) | Middle | ~12–16 h | Terraform + LocalStack via `mockctl localstack` (no k8s). Final: S3→Lambda→DynamoDB + `verify-final.sh`. |
| [aws-intermediate](aws-intermediate/README.md) | Middle+ | ~14–18 h | VPC, ALB, API Gateway, SQS/DLQ, EventBridge, RDS, ECS, observability, CI security. |
| [aws-advanced](aws-advanced/README.md) | Senior | ~18–24 h | Organizations, TGW, WAF, EKS+IRSA, GuardDuty/Config, DR, cost. 27 lessons by phase. |
| [gitlab-cicd](gitlab-cicd/README.md) | Junior–Middle | ~12–16 h + finale | **Recommended** single track: CI → registry → mockctl deploy → parent/child pipelines → review apps. Capstone + `verify-final.sh`. |
| [gitlab-basic](gitlab-basic/README.md) | Junior | ~10–14 h | Deep-dive Git + GitLab CI basics (optional if you take gitlab-cicd). |
| [gitlab-intermediate](gitlab-intermediate/README.md) | Middle | ~12–18 h | Deep-dive registry/deploy/templates/Terraform CI (optional). |
| [gitlab-advanced](gitlab-advanced/README.md) | Senior | ~16–22 h | SAST/Trivy, Agent, OIDC, K8s runners, Argo split — after gitlab-cicd finale. |
| [linux-basic](linux-basic/README.md) | Junior | ~14–16 h | Shell, users, systemd, LVM, SSH, cron. Docker stack `deploy/linux`. |
| [linux-intermediate](linux-intermediate/README.md) | Middle | ~16–18 h | Networking, DNS, firewall, TLS, nginx, NFS, sudo, performance. |
| [linux-advanced](linux-advanced/README.md) | Senior | ~14–16 h | namespaces/cgroups, audit, hardening, keepalived, preparing a K8s node. |
| [linux-shell](linux-shell/README.md) | Spec. | ~6–8 h | Bash: strict mode, awk/sed, shellcheck, scripts for CI. |
| [linux-security](linux-security/README.md) | Spec. | ~6–8 h | SSH hardening, firewall, PKI, audit report. |
| [bare-metal](bare-metal/README.md) | Theory | ~4–6 h | Physical servers, BMC, rack, PXE, RAID, K8s on metal. No labs. |
| [postgresql-basic](postgresql-basic/README.md) | Junior | ~10–12 h | PG administration: architecture, roles, MVCC, indexes, pg_dump. |
| [postgresql-intermediate](postgresql-intermediate/README.md) | Middle | ~12–16 h | WAL, replication, PITR, vacuum, monitoring, PgBouncer. |
| [postgresql-advanced](postgresql-advanced/README.md) | Senior | ~12–16 h | Patroni, partitioning, RLS, upgrade, CNPG/RDS, troubleshooting. |
| [postgresql-performance](postgresql-performance/README.md) | Spec. | ~6–8 h | Planner, JIT, auto_explain, pgbench, hypopg. |
| [postgresql-developer](postgresql-developer/README.md) | Spec. | ~6–8 h | Flyway, Liquibase, JSONB, FTS, advisory locks, CI. |
| [postgresql-ops](postgresql-ops/README.md) | Spec. | ~6–8 h | pgBackRest, WAL-G, blue/green, on-call runbooks. |
| [postgresql-security](postgresql-security/README.md) | Spec. | ~6–8 h | SCRAM, pgaudit, SSL, RLS, compliance baseline. |
| [kafka-basic](kafka-basic/README.md) | Junior | ~10–12 h | Topic/partition/offset, producer/consumer, CLI/kcat, lag. Docker `deploy/kafka`. |
| [kafka-intermediate](kafka-intermediate/README.md) | Middle | ~12–16 h | RF/ISR, tuning, rebalance, EOS, Schema Registry, Connect, ACL. 3-broker cluster. |
| [kafka-advanced](kafka-advanced/README.md) | Senior | ~14–18 h | KRaft/ZK, Streams, MSK, troubleshooting, interview Q&A, system design, capstone. |
| [redis-basic](redis-basic/README.md) | Junior | ~10–12 h | Data types, TTL, cache-aside, pub/sub, eviction, redis-cli. Docker `deploy/redis`. |
| [redis-intermediate](redis-intermediate/README.md) | Middle | ~12–16 h | RDB/AOF, replication, Sentinel, Streams, ACL, Lua, backup. |
| [redis-advanced](redis-advanced/README.md) | Senior | ~14–18 h | Cluster, hot keys, security, troubleshooting, interview Q&A, capstone. |
| [observability-basic](observability-basic/README.md) | Junior | ~10–12 h | Prometheus, PromQL, Grafana, alerts, RED/USE. Docker `deploy/observability`. |
| [observability-intermediate](observability-intermediate/README.md) | Middle | ~12–16 h | Loki/LogQL, SLO, Alertmanager routing, histograms, OTel metrics. |
| [observability-advanced](observability-advanced/README.md) | Senior | ~14–18 h | Traces/Jaeger, kube-prometheus, cardinality, runbooks, interview, capstone. |
| [opensearch-basic](opensearch-basic/README.md) | Junior | ~8–10 h | Indexes, mapping, Query DSL, bulk, Dashboards. Docker `deploy/opensearch`. |
| [opensearch-intermediate](opensearch-intermediate/README.md) | Middle | ~10–14 h | Templates, ingest pipelines, ISM, shards, managed OpenSearch. |
| [rabbitmq-basic](rabbitmq-basic/README.md) | Junior | ~8–10 h | Exchanges, bindings, work queues, fanout, direct/topic, ack. `deploy/rabbitmq`. |
| [rabbitmq-intermediate](rabbitmq-intermediate/README.md) | Middle | ~10–12 h | Quorum queues, DLX, TTL, publisher confirms, monitoring. |
| [containers-basic](containers-basic/README.md) | Junior | ~8–10 h | Dockerfile, run/exec, networks, volumes, Compose, registry, security. `deploy/containers`. |
| [secrets-basic](secrets-basic/README.md) | Junior | ~8–10 h | Vault KV, policies, auth, GitLab CI, K8s auth (overview). `deploy/vault`. |
| [secrets-advanced](secrets-advanced/README.md) | Senior | ~10–14 h | PKI, rotation, Transit, AppRole, HA/unseal, audit, interview, capstone. |
| [nginx-basic](nginx-basic/README.md) | Junior | ~6–8 h | vhost, reverse proxy, upstream, 502, Ingress preview. `deploy/nginx`. |
| [nginx-intermediate](nginx-intermediate/README.md) | Middle | ~8–10 h | TLS, HSTS, rate limit, gzip/cache, tuning. |
| [gitops-basic](gitops-basic/README.md) | Middle | ~8–10 h | GitOps, Argo CD, Application, selfHeal/prune. `mockctl` + `deploy/gitops`. |
| [gitops-intermediate](gitops-intermediate/README.md) | Middle+ | ~8–12 h | app-of-apps, sync waves, rollback, Flux comparison, split CI/CD. |
| [sre](sre/README.md) | Middle+ | ~25–35 h | SRE theory: SLI/SLO, error budget, incidents, on-call, capacity, DR, org. 16 chapters as a "book". |
| [networking-deep](networking-deep/README.md) | Middle+ | ~20–27 h | Networking: L2–L7, routes, NAT, VPC, overlay, BGP, DNS/TLS, K8s path, troubleshooting. 16 chapters + lab `deploy/linux`. |
| [finops](finops/README.md) | Middle+ | ~17–22 h | FinOps: tags, Cost Explorer/CUR, budgets, rightsizing, EKS cost, Kubecost, SP/Spot, governance. 15 chapters + AWS labs. |
| [devops-culture](devops-culture/README.md) | Middle+ | ~12–16 h | Theory: DORA, Conway, Team Topologies, stream/platform, CI culture, anti-patterns. 14 chapters as a "book". |
| [messaging-deep](messaging-deep/README.md) | Middle+ | ~12–16 h | Theory: queue vs log, Kafka/Rabbit/SQS/Redis Streams, DLQ, outbox, system design. No new stack. |
| [appsec-fundamentals](appsec-fundamentals/README.md) | Middle+ | ~14–18 h | DevSecOps theory: threat model, OWASP, K8s/CI/cloud misconfig, supply chain, IaC policy, compliance. No stack. |
| [fastapi](fastapi/README.md) | Middle+ | ~40–55 h | Full FastAPI course: Pydantic, DI, async SQLAlchemy, JWT, Redis, tests, observability, Docker/nginx. 42 lessons + capstone. `deploy/fastapi`. |
| [python-async](python-async/README.md) | Spec. | ~18–24 h | Asyncio: event loop, TaskGroup, httpx, asyncpg, Redis asyncio, executors, pytest-asyncio. 36 lessons + capstone. `deploy/python-async`. |
| [python-testing](python-testing/README.md) | Spec. | ~14–18 h | pytest: fixtures, mock, coverage, Hypothesis, integration, CI. 28 lessons + capstone. `examples/shop-lab`. |
| [django](django/README.md) | Middle+ | ~45–55 h | Django 5 + DRF: ORM, admin, migrations, API, JWT, Redis, tests, gunicorn/nginx. 42 lessons + capstone. `deploy/django`. |
| [python-celery](python-celery/README.md) | Middle+ | ~18–24 h | Celery 5: RabbitMQ, Redis backend, retries, idempotency, canvas, Beat, Flower, Docker. 36 lessons + capstone. `deploy/celery`. |
| [sqlalchemy-deep](sqlalchemy-deep/README.md) | Middle+ | ~22–28 h | SQLAlchemy 2.0: Core, ORM, async, relationships, Alembic, N+1, Repository. 36 lessons + capstone. `deploy/sqlalchemy`. |
| [python-aws](python-aws/README.md) | Middle+ | ~22–28 h | boto3: S3, DynamoDB, Lambda, SQS, SNS, EventBridge, Secrets, moto/LocalStack. 36 lessons + capstone. `deploy/python-aws`. |
| [api-design](api-design/README.md) | Middle+ | ~12–16 h | Theory: REST, HTTP, OpenAPI, errors, versioning, idempotency, auth, webhooks, service boundaries. 14 chapters + ADR. No stack. |
| [microservices-patterns](microservices-patterns/README.md) | Middle+ | ~20–28 h | Theory: monolith vs micro, DDD, saga, outbox, CQRS, resilience, observability, tests, migration. 20 chapters + subtasks + ADR. No stack. |
| [python-algorithms](python-algorithms/README.md) | Middle | ~35–45 h | Algorithms in Python: patterns, complexity, 26 chapters + subtasks, pytest labs, mock week. [examples/](python-algorithms/examples/pyproject.toml). |
| [behavioral-interviews](behavioral-interviews/README.md) | Middle+ | ~12–16 h | Behavioral interviews: STAR, story bank, conflict/failure/motivation, mock. 20 chapters + Story Portfolio. No stack. |
| [python-deep-dive](python-deep-dive/README.md) | Middle+ | ~22–30 h | Python internals: CPython, GIL, GC, MRO, descriptors, metaclass, typing, concurrency. 22 chapters + pytest labs. [examples/](python-deep-dive/examples/pyproject.toml). |
| [ood-python](ood-python/README.md) | Middle+ | ~20–28 h | OOD at interviews: SOLID, patterns, classic problems (parking, LRU, rate limiter). 20 chapters + subtasks, pytest labs. No stack. |
| [javascript-basic](javascript-basic/README.md) | Junior | ~14–18 h | Pure JS: types, scope, closures, `this`, prototypes, Promises, modules, `fetch`. 40 lessons + capstone. Node on host. |
| [typescript-basic](typescript-basic/README.md) | Junior+ | ~12–16 h | TS on top of JS: union, generics, `strict`, tsconfig, Zod, typed `fetch`. 34 lessons + capstone. Node on host. |
| [react-basic](react-basic/README.md) | Middle | ~16–20 h | React: components, hooks, forms, React Router, TanStack Query to FastAPI `:8090`. 38 lessons + capstone. Vite on host. |
| [react-intermediate](react-intermediate/README.md) | Middle+ | ~18–22 h | Auth (JWT refresh), error boundaries, performance, MSW, Django admin. 40 lessons + capstone. |
| [nextjs-basic](nextjs-basic/README.md) | Middle+ | ~20–24 h | Next.js App Router: SSR, RSC, Route Handlers, Server Actions, metadata, Docker `:8098`. 40 lessons + capstone. |
| [nodejs-basic](nodejs-basic/README.md) | Middle | ~16–20 h | Node.js BFF: event loop, libuv, streams, Express, pino, proxy to FastAPI `:8090`. 40 lessons + capstone. Node on host. |
| [go-basic](go-basic/README.md) | Junior | ~6–8 h | Fast Go on-ramp: syntax, structs, errors, packages, tests, mini-CLI. 11 lessons. Bridge to `go-intermediate`. |
| [go-intermediate](go-intermediate/README.md) | Middle | ~20–24 h | Chi shop API: layers, pgx, migrations, JWT, slog, graceful shutdown. 25 lessons + capstone. [`deploy/go-api`](../deploy/go-api/README.md) `:8099`. |

JS path: [javascript-path.md](javascript-path.md). Go path: [golang-path.md](golang-path.md).

## Cluster requirements

| Course | Extra beyond the default |
|---|---|
| `kuber-basic` | `metrics-server`, `ingress` (enabled by `mockctl up`) |
| `kuber-intermediate` | same + `helm` (installed within the course) |
| `kuber-advanced` | same + `calico` CNI (for NetworkPolicy and mesh sections), `kube-prometheus-stack`; Argo CD — see `gitops-*` |
| `gitops-*` | `mockctl up` + [`deploy/gitops`](../deploy/gitops/README.md) — Argo CD in the cluster; fork GitHub for Application |
| `sre` | Reading only; SLO practice — optional [`observability-*`](../deploy/observability/README.md), `mockctl` |
| `networking-deep` | Theory without a cluster; lab — [`deploy/linux`](../deploy/linux/README.md); K8s chapter — optional `mockctl` |
| `finops` | Theory without AWS; labs — Terraform + [LocalStack](../deploy/localstack/docker-compose.yml) or dev account; Kubecost — `mockctl` + Helm |
| `devops-culture` | Reading only |
| `messaging-deep` | Reading only; practice — [kafka-*](kafka-basic/README.md), [rabbitmq-*](rabbitmq-basic/README.md), [aws-intermediate](aws-intermediate/README.md) |
| `appsec-fundamentals` | Reading only; practice — [gitlab-advanced](gitlab-advanced/README.md), [kuber-advanced](kuber-advanced/README.md), [secrets-*](secrets-basic/README.md), [aws-intermediate/21](aws-intermediate/21-security-ci.md) |
| `api-design` | Reading only; practice — [fastapi](fastapi/README.md), [django](django/README.md), [fastapi/32](fastapi/32-contract-tests.md), [fastapi/39](fastapi/39-versioning-idempotency.md) |
| `microservices-patterns` | Reading only; practice — [messaging-deep](messaging-deep/README.md), [api-design](api-design/README.md), [python-async](python-async/README.md), [python-celery](python-celery/README.md), `mockctl` |
| `python-algorithms` | venv + [examples](python-algorithms/examples/pyproject.toml); optional [python-testing](python-testing/README.md) |
| `behavioral-interviews` | Reading only + your own `story-bank.md`; technical — [python-algorithms](python-algorithms/README.md), [microservices-patterns](microservices-patterns/README.md) |
| `python-deep-dive` | venv + [examples](python-deep-dive/examples/pyproject.toml); after basic Python |
| `ood-python` | venv + [examples](ood-python/examples/pyproject.toml); after [python-deep-dive](python-deep-dive/README.md) chapters 03, 11–15 |
| `mock-ckad` | same as `kuber-intermediate` |
| `mock-cka` | `mockctl up`; run 03 — `minikube ssh` for etcd; `kuber-advanced` phase 1 recommended |

If `mockctl up` already works, nothing more is needed: 2 vCPU and 4 GB RAM in Docker Desktop is enough for all courses except a few heavy labs in `kuber-advanced` (which need 4 vCPU / 6 GB).

## AWS courses (separate from Kubernetes)

| Course | What you need |
|---|---|
| `aws-basic` | Reading only; practice — later in labs / `aws-terraform` |
| `aws-terraform` | `mockctl localstack up`, Terraform, optional `pip install terraform-local`; AWS CLI for verify |
| `aws-intermediate` | same + completed `aws-terraform`; 4+ GB RAM for Docker |
| `aws-advanced` | LocalStack + **kubectl**; EKS/Organizations — real AWS dev ([optional](aws-advanced/optional-aws-advanced.md)) |
| `gitlab-*` | [GitLab CE](../../deploy/gitlab/README.md) 4+ GB RAM; intermediate+ needs `mockctl up` |
| `postgresql-*` | [PostgreSQL Docker](../../deploy/postgres/README.md) — `docker compose build`, port 5432; performance/security — hypopg, pgaudit |
| `postgresql-developer` | + [Flyway CLI](https://flywaydb.org/download); optional Liquibase |
| `postgresql-ops` | optional MinIO: `docker-compose.ops.yml` |
| `linux-*` | [`deploy/linux`](../deploy/linux/README.md) — `docker compose up`, 4+ GB RAM; advanced keepalived: overlay compose |
| `kafka-*` | [`deploy/kafka`](../deploy/kafka/README.md) — `docker compose up`, port `9094`; intermediate: `docker-compose.cluster.yml`; 4+ GB RAM |
| `redis-*` | [`deploy/redis`](../deploy/redis/README.md) — `docker compose up`, port `6379`; replication/sentinel/cluster overlays; 2+ GB RAM |
| `observability-*` | [`deploy/observability`](../deploy/observability/README.md) — `docker compose up --build`, ports `9090`/`3000`; 4+ GB RAM; advanced K8s: `mockctl` + kube-prometheus-stack |
| `opensearch-*` | [`deploy/opensearch`](../deploy/opensearch/README.md) — `docker compose up`, ports `9200`/`5601`; 2+ GB RAM (heap 512m) |
| `rabbitmq-*` | [`deploy/rabbitmq`](../deploy/rabbitmq/README.md) — `docker compose up`, AMQP `5672`, UI `15672`; quorum: cluster compose |
| `containers-basic` | [`deploy/containers`](../deploy/containers/README.md) — `docker compose up --build`, web `8088`; registry overlay `5000`; 2+ GB RAM |
| `secrets-*` | [`deploy/vault`](../deploy/vault/README.md) — `docker compose up`, API `8200`, dev token `course`; `init-engines.sh` for PKI |
| `nginx-*` | [`deploy/nginx`](../deploy/nginx/README.md) — `docker compose up --build`, HTTP `8080`, HTTPS `8443` after `gen-certs.sh` |
| `fastapi` | [`deploy/fastapi`](../deploy/fastapi/README.md) — `docker compose up --build`, API `8090`; 4+ GB RAM with postgres+redis |
| `python-async` | [`deploy/python-async`](../deploy/python-async/README.md) — `docker compose up --build`, gateway `8095`; labs also on host in venv |
| `python-testing` | [`courses/python-testing/examples`](python-testing/examples/pyproject.toml) — venv + `pytest`; integration — `deploy/python-async` :8095 |
| `django` | [`deploy/django`](../deploy/django/README.md) — `docker compose up --build`, web **8092**; postgres+redis inside compose |
| `python-celery` | [`deploy/celery`](../deploy/celery/README.md) — `docker compose up --build`, API **8093**, Flower **5555**; rabbitmq+redis inside compose |
| `sqlalchemy-deep` | [`deploy/sqlalchemy`](../deploy/sqlalchemy/README.md) — `docker compose up --build`, Postgres **5433**; lab container + Alembic |
| `python-aws` | [`deploy/python-aws`](../deploy/python-aws/README.md) — `docker compose up --build`, LocalStack **4566**; lab container + boto3 |
| `javascript-basic` | Node.js LTS on host; labs — [`courses/javascript-basic/examples`](javascript-basic/examples/package.json) |
| `typescript-basic` | Node.js LTS; labs — [`courses/typescript-basic/examples`](typescript-basic/examples/package.json); labs 27/30/capstone — optional [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090` |
| `react-basic` | Node.js LTS; labs — [`courses/react-basic/examples`](react-basic/examples/package.json); API labs — [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090` (proxy `/api` in Vite or CORS) |
| `react-intermediate` | Node.js LTS; labs — [`courses/react-intermediate/examples`](react-intermediate/examples/package.json); API — [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090`, Django `:8092` |
| `nextjs-basic` | Node.js LTS; labs — [`courses/nextjs-basic/examples`](nextjs-basic/examples/package.json); API — [`deploy/fastapi`](../deploy/fastapi/README.md) `:8090`; Docker capstone — port `:8098` (see ch. 35) |
| `go-basic` | Go 1.22+ on host; labs — [`courses-en/go-basic/examples`](go-basic/examples/go.mod); `go run ./lab/…` from the examples directory |
| `go-intermediate` | Go 1.22+; [`deploy/go-api`](../deploy/go-api/README.md) — `docker compose up --build`, API `:8099`; labs also under [`go-intermediate/examples`](go-intermediate/examples/go.mod) |
| `gitops-*` | [`deploy/gitops`](../deploy/gitops/README.md) — `mockctl up`, `scripts/install-argocd.sh`, UI port-forward `8080` |
