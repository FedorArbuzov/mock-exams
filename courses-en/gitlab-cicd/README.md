# GitLab CI/CD

One practical course: from the first `.gitlab-ci.yml` to a **parent/child** delivery pipeline with **review apps**, staging, and manual production on the local [`mockctl`](../../mockctl/README.md) stand.

**Time:** ~12–16 hours (theory + labs) + **4–6 hours** final project.  
**Replaces the long path** `gitlab-basic` → `gitlab-intermediate` for most learners. The older three courses remain as deep-dive references.

> After [`kuber-basic`](../kuber-basic/README.md). Full map: [`courses/README.md`](../README.md) · DevOps path: [`devops-path.md`](../devops-path.md).

---

## Prerequisites

| You need | Why |
|---|---|
| Git (branch, MR, push) | Pipelines are triggered by Git events |
| Docker basics | Runner executor + image build |
| [`kuber-basic`](../kuber-basic/README.md) | Deploy jobs use Deployment / Service / Ingress |
| **8+ GB RAM** | GitLab CE + minikube together |

---

## Local stand

```bash
# from mock-exams root
mockctl up --gitlab --lb
```

| Component | URL / path |
|---|---|
| GitLab UI | http://localhost:8929 |
| Edge LB → Ingress | http://localhost:8080 |
| kubeconfig | `output/kubeconfig.yaml` |
| Compose (fallback) | [`deploy/gitlab`](../../deploy/gitlab/README.md) |

Login: `root`. Initial password:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

Runner tags after bootstrap: `docker`, `local`.

---

## Curriculum

| # | Lesson | Type |
|---|--------|------|
| 00 | [Environment](00-environment.md) | setup |
| 01 | [CI YAML and runners](01-ci-yaml-and-runners.md) | theory |
| 02 | [Lab: first pipeline](02-lab-first-pipeline.md) | lab |
| 03 | [Stages, needs, workflow, rules](03-needs-workflow-rules.md) | theory |
| 04 | [Lab: DAG pipeline](04-lab-dag-pipeline.md) | lab |
| 05 | [Variables, artifacts, cache](05-variables-artifacts-cache.md) | theory |
| 06 | [Build and Container Registry](06-build-and-registry.md) | theory |
| 07 | [Lab: build and push](07-lab-build-push.md) | lab |
| 08 | [Deploy to mockctl](08-deploy-mockctl.md) | theory |
| 09 | [Environments and review apps](09-environments-review-apps.md) | theory |
| 10 | [Child pipelines and templates](10-child-pipelines-and-templates.md) | theory |
| 11 | [Lab: parent orchestrator](11-lab-orchestrator.md) | lab |
| 12 | [Final project](12-final-project.md) | capstone |
| 13 | [How we verify](13-verification.md) | checklist + scripts |
| — | [Interview cheatsheet](interview-cheatsheet.md) | review |

---

## Learning arc

```text
Part A — runner only     Part B — cluster          Part C — platform shape
validate / test          build → registry          parent + child pipelines
artifacts / cache        deploy staging            review apps /r/<slug>/
                         Environments              staging auto / prod manual
```

---

## Examples

| Path | Use |
|---|---|
| [`examples/hello-ci/`](examples/hello-ci/) | App + tests for early labs (from gitlab-basic) |
| [`examples/k8s-deploy/`](examples/k8s-deploy/) | Dockerfile + Deployment template for deploy labs |

---

## Related (optional deep dives)

| Course | When to open |
|---|---|
| [`gitlab-basic`](../gitlab-basic/README.md) | More Git/MR detail |
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | Terraform-in-CI, longer templates track |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | SAST, Agent, Argo split, OIDC, K8s runners |
