# 09. Runners on Kubernetes

## Real-world scenario

Monday morning: 40 pipelines in the queue, the Docker runner on a single VM — disk at 98%, builds failing with `no space left on device`. Platform lead: "We're moving CI compute into the cluster, job = pod, autoscale nodes." This is phase 3 of the course.

In [`gitlab-basic`](../gitlab-basic/README.md) the runner uses the **Docker executor** on a VM: each job is a container on the host. As the team grows:

- The job queue grows faster than the VM
- A single `docker build` eats the disk and CPU of neighboring jobs
- Isolation is weak — a shared Docker daemon
- VM autoscaling is slow (minutes)

The **Kubernetes executor** creates a **separate pod** per job in mockctl.

```text
GitLab → runner manager pod → job pod
              ↓
    namespace gitlab-runner
              ↓
    job container + services (dind, postgres)
              ↓
    pod terminated after the job
```

---

## What you'll learn

- Kubernetes executor vs Docker executor.
- The `gitlab-runner` Helm chart and its configuration.
- RBAC, isolation, autoscaling.
- Docker build on a K8s runner and the `privileged` trade-off.

---

## Kubernetes executor vs Docker executor

| | Docker executor | Kubernetes executor |
|---|-----------------|---------------------|
| Unit of work | container on the runner host | pod in K8s |
| Isolation | medium | namespace + pod boundary |
| Autoscale | new VMs | HPA / cluster autoscaler |
| DinD build | privileged on the host | privileged pod *(careful)* |
| Ops complexity | lower | Helm, RBAC, quotas |

**When it pays off:** >20 parallel jobs, ephemeral CI, you have a K8s platform team.

**When you don't need it:** a small team, one shared runner, infrequent pipelines.

---

## The `gitlab-runner` Helm chart

```bash
helm repo add gitlab https://charts.gitlab.io
helm install gitlab-runner gitlab/gitlab-runner \
  -n gitlab-runner \
  --create-namespace \
  -f runner-values.yaml
```

### runner-values.yaml (training)

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

| Field | Why |
|------|-------|
| `namespace` | Where to create job pods |
| `cpu/memory_*` | Protection against OOM |
| `privileged` | Docker-in-Docker |
| `gitlabUrl` | URL of GitLab CE in Docker |

Token: Admin → CI/CD → Runners → Register instance runner.

---

## Where the runner config is stored

1. **Helm values** `runners.config` — TOML in a ConfigMap
2. **GitLab UI** — runner, tags, locked
3. **Not in `.gitlab-ci.yml`** — runner config ≠ pipeline config

`helm upgrade` → the manager reloads the config.

---

## RBAC for the runner

The runner SA needs rights to **create pods** in `gitlab-runner`:

- `pods`, `pods/exec`, `pods/log`, `secrets`

The chart with `rbac.create: true` creates a RoleBinding. **Don't grant** cluster-admin — a compromised runner = a compromised cluster.

---

## Isolation of CI workloads

Production apps and CI in the same cluster — a risk:

| Practice | Action |
|----------|----------|
| Dedicated namespace | `gitlab-runner` |
| Node pool / taint | `ci=true:NoSchedule` |
| ResourceQuota | max pods, CPU |
| NetworkPolicy | CI pods don't reach the prod DB |

See [kuber-advanced/05-scheduling-taints](../kuber-advanced/05-scheduling-taints.md).

---

## Autoscaling

| Level | Mechanism |
|---------|----------|
| Job pods | one pod = one job |
| Runner manager | usually 1 replica |
| Nodes | Cluster Autoscaler |

The bottleneck is the nodes for job pods, not the manager replicas.

---

## Docker build on a K8s runner

```yaml
docker-build:
  tags: [k8s]
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
```

`privileged = true` is a **security trade-off**. Alternative: **Kaniko**, **buildkit** rootless.

---

## Tags and job routing

```yaml
k8s-test:
  tags: [gitlab-runner, k8s]
```

Without tags, a job will land on the old Docker runner.

Strategy: `tags: [shell]` legacy; `tags: [k8s]` platform jobs.

---

## Monitoring

- `OOMKilled` → increase `memory_limit`
- Pending pods → insufficient resources
- Image pull slow → pull-through cache

Runbook: [13-pipeline-reliability.md](13-pipeline-reliability.md).

---

## Comparison with managed GitLab.com runners

Self-managed K8s runners give control over:

- NetworkPolicy and data residency
- Cost on your own nodes
- Custom images and cache volumes

The trade-off — you operate the chart, upgrades, RBAC.

---

## Self-check

1. Kubernetes vs docker executor — the unit of isolation?
2. Where is the runner config stored?
3. Why RBAC for the runner SA?
4. The risk of `privileged: true`?
5. When does a K8s runner not pay off?

---

## Summary

The Kubernetes executor moves CI into the cluster with pod-per-job and quotas. It requires Helm, RBAC, and a deliberate `privileged` for DinD. Practice: [10-lab-k8s-runner.md](10-lab-k8s-runner.md).
