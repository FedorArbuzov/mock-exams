# GitLab DevOps — Intermediate

An in-depth course on **advanced GitLab CI/CD**: a multi-stage pipeline with a DAG, building and pushing a Docker image to the **GitLab Container Registry**, **deploying to Kubernetes** via [`mockctl`](../../mockctl/README.md), **environments** (staging / production), reusable **CI templates**, and **Terraform plan** on a Merge Request.

**14 lessons** (00–13) + an interview cheatsheet + ~20 interview questions. Each chapter is a **complete textbook chapter** (~150–220 lines): a real-world scenario → theory → code → common mistakes → checklist. Style reference: [`postgresql-basic/01-architecture.md`](../postgresql-basic/01-architecture.md).

> Start of the DevOps track: [`devops-path.md`](../devops-path.md). Map of all tracks: [`courses/README.md`](../README.md).

---

## Who this course is for

You have completed [`gitlab-basic`](../gitlab-basic/README.md) and can write a `.gitlab-ci.yml` with stages, runners, and variables. Now you need to **close the delivery loop**: commit → test → **immutable image** in the registry → **deploy to the cluster** → staging/production with a manual gate. The course targets engineers preparing for a **Platform / DevOps** role who want to explain their pipeline in an interview, not just "copy the YAML from the wiki".

---

## Prerequisites (required)

Without these courses, intermediate turns into "copying YAML without understanding why the job is pending".

| Course / tool | What you should be able to do | Readiness check |
|---|---|---|
| [`gitlab-basic`](../gitlab-basic/README.md) | `.gitlab-ci.yml`, stages, jobs, runners, variables, artifacts | Basic final project: runner with the `docker` tag, green pipeline |
| [`kuber-basic`](../kuber-basic/README.md) | `kubectl`, Deployment, Service, namespace | `kubectl get pods` in any namespace |
| [`mockctl`](../../mockctl/README.md) | `mockctl up`, `kubectl get nodes`, kubeconfig in `output/` | `mockctl status` → node Ready |

**Recommended (in parallel or before the final project):**

| Material | Why it matters in intermediate |
|---|---|
| [`kuber-intermediate/07-helm.md`](../kuber-intermediate/07-helm.md) | alternative to raw YAML at deploy time (bonus in lab 06) |
| [`kuber-intermediate/08-lab-helm.md`](../kuber-intermediate/08-lab-helm.md) | hands-on Helm upgrade in CI |
| [`aws-terraform`](../aws-terraform/README.md) | Terraform plan/apply in CI (chapters 11–12, `image-pipeline` project) |
| [`aws-intermediate`](../aws-intermediate/README.md) | the `image-platform` concept — the target application of the final project |

---

## Local environment

| Component | Path / command | Port / artifact |
|---|---|---|
| GitLab CE + runner | [`deploy/gitlab`](../../deploy/gitlab/README.md) | UI **8929**, registry on the same host |
| Kubernetes cluster | `mockctl up` — `mock-exams` profile | kubeconfig: `output/kubeconfig.yaml` |
| Application examples | [`examples/k8s-deploy/`](examples/k8s-deploy/) | Dockerfile + `k8s/deployment.yaml` |

Before the first lesson, work through **[00-environment.md](00-environment.md)** (~45–60 min): checking GitLab, the runner, the registry, the kubectl context, and the examples structure.

```bash
# from the mock-exams root
docker compose -f deploy/gitlab/docker-compose.yml up -d
docker exec mock-gitlab gitlab-ctl status   # wait for run:
mockctl install && mockctl up && mockctl status
```

### Hardware requirements

| RAM | GitLab CE | GitLab + mockctl at the same time |
|-----|-----------|-------------------------------|
| < 4 GB | GitLab may fail to start | not recommended |
| 6 GB | OK for a single user | tight — close extra IDEs |
| 8+ GB | comfortable | **recommended minimum** for the course |

Docker Desktop (or Docker Engine) must be running **before** `mockctl up` and `docker compose up` for GitLab. On Windows, make sure minikube and the GitLab compose see the **same** Docker daemon.

---

## How to read the chapters

Each lesson is a **complete textbook chapter**, not a cheat sheet. The author moves from a **real-world scenario** (ImagePullBackOff, deploy to prod from a feature branch, dind without privileged) to concepts, YAML, commands, and common mistakes.

1. **Theory** (`NN-topic.md`) — "Real-world scenario" → "What you'll learn" → detailed content → code examples → "Common mistakes" → "Summary" → "Checklist".
2. **Lab** (`NN-lab-topic.md`) — hands-on on `:8929` and mockctl: push, MR, pipeline graph, registry, deploy. The "if something went wrong" table is at the end of the lab.
3. Reinforce the checklist **in your own words** before moving to the next chapter.
4. Commit your `.gitlab-ci.yml` in a dedicated GitLab project (`hello-ci-intermediate` or a fork of [`hello-ci`](../gitlab-basic/examples/hello-ci/)).
5. Before the interview: [interview-cheatsheet.md](interview-cheatsheet.md) → [14-interview-qa.md](14-interview-qa.md) **without peeking**.

**Time:** ~25–50 min per "theory + lab" pair; the whole course **~12–18 hours**; the final project — **2–4 hours** separately.

---

## Curriculum by phase

### Phase 0 — environment (P0)

| # | File | Time | Content |
|---|------|-------|------------|
| 0 | [00-environment.md](00-environment.md) | ~45–60 min | GitLab, runner, registry, mockctl, `examples/` structure |

### Phase 1 — pipeline and image (P0)

| # | File | Time | Content |
|---|------|-------|------------|
| 1 | [01-multi-stage.md](01-multi-stage.md) | ~25 min | stages, `needs`, DAG, `workflow:rules`, fail fast |
| 2 | [02-lab-multi-stage.md](02-lab-multi-stage.md) | ~40 min | validate → test → build (stub) |
| 3 | [03-docker-registry.md](03-docker-registry.md) | ~25 min | Container Registry, dind, Kaniko, tags |
| 4 | [04-lab-build-push.md](04-lab-build-push.md) | ~45 min | real build + push to the registry |

### Phase 2 — deploy to Kubernetes (P0)

| # | File | Time | Content |
|---|------|-------|------------|
| 5 | [05-deploy-kubernetes.md](05-deploy-kubernetes.md) | ~25 min | kubectl vs Helm, kubeconfig, imagePullSecrets |
| 6 | [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | ~50 min | deploy `hello-ci` to a mockctl namespace |

### Phase 3 — environments (P1)

| # | File | Time | Content |
|---|------|-------|------------|
| 7 | [07-environments.md](07-environments.md) | ~25 min | staging/production, manual, dynamic review |
| 8 | [08-lab-environments.md](08-lab-environments.md) | ~45 min | two namespaces, variables per environment |

### Phase 4 — reusing CI (P1)

| # | File | Time | Content |
|---|------|-------|------------|
| 9 | [09-ci-templates.md](09-ci-templates.md) | ~25 min | `include`, `extends`, hidden jobs |
| 10 | [10-lab-templates.md](10-lab-templates.md) | ~40 min | move docker-build into a shared template |

### Phase 5 — Terraform in CI (P1)

| # | File | Time | Content |
|---|------|-------|------------|
| 11 | [11-terraform-ci.md](11-terraform-ci.md) | ~25 min | fmt, validate, plan artifact, manual apply |
| 12 | [12-lab-terraform-ci.md](12-lab-terraform-ci.md) | ~50 min | `image-pipeline` from aws-terraform |

### Phase 6 — final project and interview (P0)

| # | File | Time | Content |
|---|------|-------|------------|
| 13 | [13-final-project.md](13-final-project.md) | ~2–4 h | full image-platform pipeline |
| — | [interview-cheatsheet.md](interview-cheatsheet.md) | ~15 min | cheat sheet before the interview |
| 14 | [14-interview-qa.md](14-interview-qa.md) | ~30 min | ~20 questions with detailed answers |

---

## Learning pipeline architecture

```text
MR / push main
    │
    ▼
┌──────────┐   ┌──────┐   ┌─────────────┐   ┌─────────────────────────┐
│ validate │──▶│ test │──▶│ docker build│──▶│ deploy (staging / prod) │
│ lint     │   │ unit │   │ push registry│  │ mockctl + kubectl/helm  │
└──────────┘   └──────┘   └─────────────┘   └─────────────────────────┘
                                  │                      ▲
                                  └──── pull ────────────┘
```

Registry: `localhost:8929` ([`deploy/gitlab`](../../deploy/gitlab/README.md)). Cluster: minikube `mock-exams` ([`mockctl`](../../mockctl/README.md)). Manifests: [`examples/k8s-deploy/k8s/deployment.yaml`](examples/k8s-deploy/k8s/deployment.yaml).

---

## What you should end up with

- You write a multi-stage pipeline with `needs` and `workflow:rules` — expensive jobs don't run on every push.
- You build an image and push it to the GitLab Container Registry with the `$CI_COMMIT_SHA` tag.
- You deploy the application to `mockctl` (kubectl or Helm) and configure `imagePullSecrets`.
- You separate **staging** (auto) and **production** (`when: manual`, protected environment).
- You extract repeated jobs into `include` / `extends`.
- You run `terraform fmt/validate/plan` on an MR without apply; apply is manual only on `main`.

---

## Related courses

| Course | Integration into intermediate |
|---|---|
| [`gitlab-basic`](../gitlab-basic/README.md) | runners, variables — the foundation for the whole course |
| [`kuber-basic`](../kuber-basic/README.md) | Deployment/Service — the target of the deploy job |
| [`kuber-intermediate`](../kuber-intermediate/README.md) | Helm chart instead of raw YAML (bonus in lab 06) |
| [`aws-terraform`](../aws-terraform/README.md) | the `image-pipeline` project — plan/apply jobs |
| [`aws-intermediate`](../aws-intermediate/README.md) | `image-platform` — the target application of the final project |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | security scanning, GitLab Agent, GitOps split |
| [`devops-culture`](../devops-culture/README.md) | DORA, deployment frequency, lead time |

---

## Directory structure

```text
courses/gitlab-intermediate/
├── README.md                 ← you are here
├── 00-environment.md
├── 01-multi-stage.md … 13-final-project.md
├── 14-interview-qa.md
├── interview-cheatsheet.md
└── examples/
    └── k8s-deploy/
        ├── Dockerfile
        ├── app/              ← static files for http.server
        └── k8s/
            └── deployment.yaml
```

The examples do **not** bring the service up themselves — the pipeline builds them and the deploy job ships them to the cluster.

---

## How to take the course

1. Complete [gitlab-basic](../gitlab-basic/README.md) up to the final project (runner with the `docker` tag).
2. Work through [00-environment.md](00-environment.md) — don't start the labs without a green checklist.
3. Read the theory (`NN-topic.md`), then the lab (`NN-lab-topic.md`) in the same chapter.
4. After each lab, commit to GitLab — the pipeline graph history will be useful in interviews.
5. Before the interview: [interview-cheatsheet.md](interview-cheatsheet.md) → [14-interview-qa.md](14-interview-qa.md).

**Next:** [`gitlab-advanced`](../gitlab-advanced/README.md) — SAST, Container Scanning, Agent for Kubernetes, separating CI and GitOps.
