# 09. Runners on Kubernetes

## Сценарий с работы

Понедельник утро: 40 pipelines в очереди, Docker runner на одной VM — disk 98%, builds падают с `no space left on device`. Platform lead: «Переносим CI compute в кластер, job = pod, autoscale nodes». Это фаза 3 курса.

На [`gitlab-basic`](../gitlab-basic/README.md) runner с **Docker executor** на VM: каждый job — контейнер на хосте. При росте команды:

- Очередь jobs растёт быстрее, чем VM
- Один `docker build` съедает disk и CPU соседних jobs
- Изоляция слабая — shared Docker daemon
- Autoscaling VM — медленно (минуты)

**Kubernetes executor** создаёт **отдельный pod** на job в mockctl.

```text
GitLab → runner manager pod → job pod
              ↓
    namespace gitlab-runner
              ↓
    job container + services (dind, postgres)
              ↓
    pod terminated после job
```

---

## Что вы узнаете

- Kubernetes executor vs Docker executor.
- Helm chart `gitlab-runner` и конфигурацию.
- RBAC, isolation, autoscaling.
- Docker build на K8s runner и trade-off `privileged`.

---

## Kubernetes executor vs Docker executor

| | Docker executor | Kubernetes executor |
|---|-----------------|---------------------|
| Единица work | container на runner host | pod в K8s |
| Изоляция | средняя | namespace + pod boundary |
| Autoscale | новые VM | HPA / cluster autoscaler |
| DinD build | privileged на host | privileged pod *(осторожно)* |
| Ops complexity | ниже | Helm, RBAC, quotas |

**Когда окупается:** >20 parallel jobs, ephemeral CI, есть K8s platform team.

**Когда не нужен:** малый team, один shared runner, редкие pipelines.

---

## Helm chart `gitlab-runner`

```bash
helm repo add gitlab https://charts.gitlab.io
helm install gitlab-runner gitlab/gitlab-runner \
  -n gitlab-runner \
  --create-namespace \
  -f runner-values.yaml
```

### runner-values.yaml (учебный)

```yaml
gitlabUrl: http://host.docker.internal:8929
runnerRegistrationToken: "<from-gitlab-admin>"
rbac:
  create: true
runners:
  config: |
    [[runners]]
      name = "mockctl-k8s"
      [runners.kubernetes]
        namespace = "gitlab-runner"
        image = "alpine:latest"
        cpu_limit = "1"
        memory_limit = "2Gi"
        cpu_request = "250m"
        memory_request = "512Mi"
        privileged = true   # docker:dind build
```

| Поле | Зачем |
|------|-------|
| `namespace` | Куда создавать job pods |
| `cpu/memory_*` | Защита от OOM |
| `privileged` | Docker-in-Docker |
| `gitlabUrl` | URL GitLab CE в Docker |

Токен: Admin → CI/CD → Runners → Register instance runner.

---

## Где хранится runner config

1. **Helm values** `runners.config` — TOML в ConfigMap
2. **GitLab UI** — runner, tags, locked
3. **Не в `.gitlab-ci.yml`** — runner config ≠ pipeline config

`helm upgrade` → manager перезагружает config.

---

## RBAC для runner

Runner SA нужны права **создавать pods** в `gitlab-runner`:

- `pods`, `pods/exec`, `pods/log`, `secrets`

Chart с `rbac.create: true` создаёт RoleBinding. **Не давайте** cluster-admin — compromise runner = compromise cluster.

---

## Isolation CI workloads

Production apps и CI в одном кластере — риск:

| Практика | Действие |
|----------|----------|
| Dedicated namespace | `gitlab-runner` |
| Node pool / taint | `ci=true:NoSchedule` |
| ResourceQuota | max pods, CPU |
| NetworkPolicy | CI pods не ходят в prod DB |

См. [kuber-advanced/05-scheduling-taints](../kuber-advanced/05-scheduling-taints.md).

---

## Autoscaling

| Уровень | Механизм |
|---------|----------|
| Job pods | один pod = один job |
| Runner manager | обычно 1 replica |
| Nodes | Cluster Autoscaler |

Bottleneck — nodes для job pods, не manager replicas.

---

## Docker build на K8s runner

```yaml
docker-build:
  tags: [k8s]
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
```

`privileged = true` — **security trade-off**. Альтернатива: **Kaniko**, **buildkit** rootless.

---

## Tags и job routing

```yaml
k8s-test:
  tags: [gitlab-runner, k8s]
```

Без tags job попадёт на старый Docker runner.

Стратегия: `tags: [shell]` legacy; `tags: [k8s]` platform jobs.

---

## Мониторинг

- `OOMKilled` → увеличить `memory_limit`
- Pending pods → insufficient resources
- Image pull slow → pull-through cache

Runbook: [13-pipeline-reliability.md](13-pipeline-reliability.md).

---

## Сравнение с managed GitLab.com runners

Self-managed K8s runners дают контроль над:

- NetworkPolicy и data residency
- Cost на своих nodes
- Custom images и cache volumes

Trade-off — вы ops chart, upgrades, RBAC.

---

## Самопроверка

1. Executor kubernetes vs docker — единица изоляции?
2. Где хранится runner config?
3. Зачем RBAC для runner SA?
4. Риск `privileged: true`?
5. Когда K8s runner не окупается?

---

## Резюме

Kubernetes executor переносит CI в кластер с pod-per-job и quotas. Требует Helm, RBAC, осознанный `privileged` для DinD. Практика: [10-lab-k8s-runner.md](10-lab-k8s-runner.md).
