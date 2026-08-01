# GitLab DevOps — Advanced

An advanced course on **platform CI/CD and DevSecOps** for engineers who already know how to build a Docker image and deploy to Kubernetes from GitLab CI and are ready to adopt **shift-left security**, **GitLab Agent**, **OIDC into AWS**, **runners on Kubernetes**, **separation of CI (GitLab) and CD (Argo CD)**, and **pipeline reliability**.

Format — a **megacourse** (~150–220 lines per lesson): real-world scenario → theory → code → common mistakes → checklist. Style reference: [`postgresql-basic/01-architecture.md`](../postgresql-basic/01-architecture.md).

**Who it's for:** DevOps / Platform Engineer / SRE with GitLab CI and Kubernetes experience who design delivery pipelines for teams of 5 to 50+ developers.

> Start of the DevOps track: [`devops-path.md`](../devops-path.md). Map of all tracks: [`courses/README.md`](../README.md).

---

## What you'll master by the end of the course

| Skill | Artifact | Lesson |
|-------|----------|------|
| Security gates in MRs | SAST + secret detection + container scan; critical blocks merge | [01](01-security-scanning.md)–[04](04-lab-container-scan.md) |
| No long-lived secrets | GitLab Agent instead of kubeconfig; OIDC instead of AWS keys | [05](05-gitlab-agent.md)–[08](08-lab-oidc-aws.md) |
| Scaling CI | Kubernetes executor, limits, ResourceQuota | [09](09-runners-kubernetes.md)–[10](10-lab-k8s-runner.md) |
| GitOps split | CI only build/scan/bump; Argo CD — the only CD | [11](11-gitlab-and-argocd.md)–[12](12-lab-split-ci-cd.md) |
| Reliability | `interruptible`, `resource_group`, runbook | [13](13-pipeline-reliability.md)–[14](14-lab-reliability.md) |
| Capstone | Production-style platform pipeline + documentation | [15](15-final-project.md) |

By the end of the course you'll be able to **explain in an interview** the full path from MR to production: security gate → verified image → gitops bump → Argo sync — without long-lived credentials in CI variables.

---

## Prerequisites (required)

The course does **not** repeat the basics of `.gitlab-ci.yml`, Docker build, and deploy. Before starting, complete three blocks:

| Course | What you should have in hand | Key lessons |
|------|--------------------------|----------------|
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | Multi-stage pipeline, Docker build/push to GitLab Registry, deploy to `mockctl`, environments, `include`, Terraform plan on MR | [01-multi-stage](../gitlab-intermediate/01-multi-stage.md), [04-lab-build-push](../gitlab-intermediate/04-lab-build-push.md), [06-lab-deploy-mockctl](../gitlab-intermediate/06-lab-deploy-mockctl.md) |
| [`kuber-advanced`](../kuber-advanced/README.md) — **phase 3 (GitOps)** | Argo CD: Application, sync, rollback, selfHeal | [16-argocd.md](../kuber-advanced/16-argocd.md), [17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md); stand [`deploy/gitops`](../../deploy/gitops/README.md) |
| [`aws-advanced`](../aws-advanced/README.md) — **OIDC** | The `AssumeRoleWithWebIdentity` pattern; trust policy with `sub` | [06-lab-oidc-ci.md](../aws-advanced/06-lab-oidc-ci.md) (GitHub → AWS; for GitLab — your own issuer) |

**Recommended in parallel (theory):**

| Course | Relation to gitlab-advanced |
|------|-------------------------|
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | DevSecOps (ch. 01), attacks on CI/CD (07), supply chain (08), secure SDLC (12) |
| [`gitops-intermediate`](../gitops-intermediate/README.md) | Split CI/CD, app-of-apps, rollback |
| [`secrets-basic`](../secrets-basic/README.md) | Why not to store kubeconfig and AWS keys in variables |

### Readiness checklist before starting

- [ ] The pipeline from intermediate successfully builds and pushes an image to the GitLab Registry
- [ ] `mockctl up` brings up the cluster; `kubectl get nodes` — Ready
- [ ] Argo CD is installed in namespace `argocd` (or you're ready to install it per [00-environment.md](00-environment.md))
- [ ] Chapters [appsec-fundamentals/01](../appsec-fundamentals/01-intro-devsecops.md) and [07](../appsec-fundamentals/07-cicd-attacks.md) have been read
- [ ] You understand the difference between a CI job and a GitOps controller (Argo CD)
- [ ] The [`templates/security-pipeline.yml`](templates/security-pipeline.yml) template is copied into the pet-project

---

## Local environment

| Component | Path / command |
|-----------|----------------|
| GitLab CE + runner | [`deploy/gitlab`](../../deploy/gitlab/README.md) — port **8929** |
| Kubernetes | `mockctl up` — kubeconfig in `output/kubeconfig.yaml` |
| Argo CD | namespace `argocd` — see [00-environment.md](00-environment.md) |
| Security template | [`templates/security-pipeline.yml`](templates/security-pipeline.yml) |

Before the first lesson, go through **[00-environment.md](00-environment.md)** (~60–90 min).

### Hardware requirements

| RAM | GitLab CE | GitLab + mockctl + Argo |
|-----|-----------|-------------------------|
| < 4 GB | GitLab may not start | not recommended |
| 6 GB | OK for a single user | tight |
| 8+ GB | comfortable | **recommended minimum** |

Docker Desktop (or Docker Engine) must be running **before** `mockctl up` and `docker compose up` for GitLab.

### Network diagram of the training stand

```text
┌─────────────────────────────────────────────────────────────┐
│  Host (Windows / Linux / macOS)                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ GitLab CE    │    │ mockctl K8s  │    │ (optional)   │   │
│  │ :8929        │    │ API :6443    │    │ AWS dev acct │   │
│  │ Docker runner│    │ Argo / Agent │    │ OIDC lab 08  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

GitLab in Docker reaches the cluster via `host.docker.internal` (Windows/macOS) or the host IP (Linux).

---

## How to take the course

1. Read [00-environment.md](00-environment.md) and bring up GitLab + `mockctl` + (optionally) Argo CD.
2. Go **phase by phase** — theory (odd numbers) → lab (even numbers).
3. Copy [`templates/security-pipeline.yml`](templates/security-pipeline.yml) into the pet-project's `.gitlab/ci/`.
4. Before an interview: [interview-cheatsheet.md](interview-cheatsheet.md) → [16-interview-qa.md](16-interview-qa.md).

**Time estimate:** ~**20–28 hours** (theory + labs + final project 4–6 h).

**Pet-project:** one GitLab project (`hello-ci-advanced` or `platform-hello-ci`) for all labs; a separate gitops repo for phase 4.

### Recommended pace

| Week | Phases | Hours |
|--------|------|------|
| 1 | 00 + phase 1 (security) | 6–8 |
| 2 | phase 2 (Agent + OIDC) | 6–8 |
| 3 | phase 3 (K8s runners) | 3–4 |
| 4 | phase 4 (Argo split) | 4–5 |
| 5 | phase 5 + capstone | 5–7 |

### Chapter format

Each chapter follows a textbook structure:

1. **Real-world scenario** — why the topic is needed in production.
2. **Theory** — tables, diagrams, YAML with explanations.
3. **Related courses** — appsec, kuber-advanced, aws-advanced.
4. **Common mistakes** — what breaks on real stands.
5. **Self-check** — questions before moving to the next chapter.

---

## Curriculum across five phases

### Phase 1 — Security scanning (shift-left)

**Goal:** security jobs in MRs **block merge** on critical findings; understanding CE vs Ultimate and open-source fallback.

| # | Lesson | Type | ~time | Contents |
|---|------|-----|--------|------------|
| 01 | [Security scanning overview](01-security-scanning.md) | theory | 45 min | DevSecOps, SAST/secret/dependency/container, CE vs Ultimate, policy |
| 02 | [Lab: SAST and secret detection](02-lab-sast.md) | practice | 90 min | templates, intentional vuln, fix, gitleaks fallback |
| 03 | [Container scanning](03-container-scanning.md) | theory | 40 min | Trivy, severity policy, SBOM, base image hygiene |
| 04 | [Lab: scan image in pipeline](04-lab-container-scan.md) | practice | 90 min | `needs: docker-build`, alpine demo, deploy gate |

**Phase artifact:** MR with an intentional secret → fix → green pipeline; `container-scan` after `docker-build`.

**Related:** [appsec-fundamentals](../appsec-fundamentals/README.md), [templates/security-pipeline.yml](templates/security-pipeline.yml).

**Key phase question:** "Why doesn't a green SAST guarantee a safe image?"

---

### Phase 2 — Kubernetes integration and cloud authentication

**Goal:** remove long-lived kubeconfig and AWS keys from CI variables; outbound Agent; OIDC trust policy.

| # | Lesson | Type | ~time | Contents |
|---|------|-----|--------|------------|
| 05 | [GitLab Agent for Kubernetes](05-gitlab-agent.md) | theory | 50 min | KAS, outbound tunnel, `ci_access`, vs kubeconfig |
| 06 | [Lab: agent connection](06-lab-agent.md) | practice | 120 min | Helm install, deploy job, fallback doc |
| 07 | [OIDC: GitLab → AWS](07-oidc-cloud.md) | theory | 50 min | `id_tokens`, trust policy, fork MR risks |
| 08 | [Lab: deploy without static keys](08-lab-oidc-aws.md) | practice | 120 min | STS smoke, terraform plan, `docs/oidc-aws.md` |

**Phase artifact:** deploy via Agent (or `docs/agent-vs-kubeconfig.md`); `aws sts get-caller-identity` via OIDC **or** `docs/oidc-aws.md`.

**Related:** [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md), [appsec-fundamentals/04](../appsec-fundamentals/04-secrets-credentials.md).

**Key phase question:** "What is the blast radius of a kubeconfig in a protected variable?"

---

### Phase 3 — Scale runners

**Goal:** Kubernetes executor, isolation of CI workloads, resource limits.

| # | Lesson | Type | ~time | Contents |
|---|------|-----|--------|------------|
| 09 | [Runners on Kubernetes](09-runners-kubernetes.md) | theory | 45 min | Helm chart, RBAC, privileged DinD, autoscaling |
| 10 | [Lab: kubernetes executor](10-lab-k8s-runner.md) | practice | 120 min | registration token, job pod in `gitlab-runner` ns |

**Phase artifact:** a job tagged `k8s` runs in a pod; the pod is deleted after the job; limits in `values.yaml`.

**Related:** [kuber-advanced/05-scheduling-taints](../kuber-advanced/05-scheduling-taints.md).

**Key phase question:** "Why is `privileged: true` on a CI runner a security trade-off?"

---

### Phase 4 — GitOps split (CI ≠ CD)

**Goal:** GitLab only **build + scan + bump gitops**; Argo CD — the only CD mechanism.

| # | Lesson | Type | ~time | Contents |
|---|------|-----|--------|------------|
| 11 | [GitLab CI + Argo CD](11-gitlab-and-argocd.md) | theory | 55 min | split pattern, bump job, anti-patterns, rollback |
| 12 | [Lab: CI build, Argo sync](12-lab-split-ci-cd.md) | practice | 150 min | remove kubectl, E2E, drift test |

**Phase artifact:** CI without `kubectl apply`; Argo Application `Synced`/`Healthy`; rollback via `git revert`.

**Related:** [kuber-advanced/17](../kuber-advanced/17-lab-argocd.md), [gitops-intermediate/09](../gitops-intermediate/09-split-ci-cd.md), [`deploy/gitops`](../../deploy/gitops/README.md).

**Key phase question:** "Who is the only writer to the production cluster?"

---

### Phase 5 — Reliability and capstone

**Goal:** `interruptible`, `resource_group`, runbook; building a production-style platform pipeline.

| # | Lesson | Type | ~time | Contents |
|---|------|-----|--------|------------|
| 13 | [Pipeline reliability](13-pipeline-reliability.md) | theory | 45 min | retry, timeout, workflow rules, monitoring |
| 14 | [Lab: retries, interruptible](14-lab-reliability.md) | practice | 90 min | cancel demo, `docs/ci-runbook.md` |
| 15 | [Final project: Platform pipeline](15-final-project.md) | capstone | 4–6 h | rubric of 10 criteria, 10-min demo |

**Interview:** [interview-cheatsheet.md](interview-cheatsheet.md), [16-interview-qa.md](16-interview-qa.md).

**Key phase question:** "Pipeline green on main — does that mean the deploy succeeded?"

---

## Templates and examples (`templates/`)

| Path | Purpose |
|------|------------|
| [`templates/security-pipeline.yml`](templates/security-pipeline.yml) | Fragment: security stages, SAST/secret templates, Trivy scan with `needs: docker-build` |
| [`deploy/gitlab`](../../deploy/gitlab/README.md) | GitLab CE in Docker |
| [`deploy/gitops`](../../deploy/gitops/README.md) | GitOps repo / Argo on mockctl |
| [`gitlab-intermediate/examples/k8s-deploy/`](../gitlab-intermediate/examples/k8s-deploy/) | Basic deploy from intermediate |

### Including the template in a project

```yaml
include:
  - local: .gitlab/ci/security-pipeline.yml   # copy from templates/

stages:
  - test
  - security
  - build
  - deploy
```

The `security-pipeline.yml` template defines:

- `.stages_security` — recommended order of stages
- `.sast_jobs` — include GitLab Security templates
- `.trivy_scan` / `container-scan` — gate after `docker-build`

Extend it in the main `.gitlab-ci.yml` via `extends:` and `needs:`.

### What to add to your project on top of the template

| File | Why |
|------|-------|
| `.gitlab/ci/security-pipeline.yml` | DRY for SAST + Trivy |
| `.gitlab/ci/bump-gitops.yml` | Phase 4: bump image tag |
| `.gitlab/agents/mockctl/config.yaml` | Phase 2: Agent ci_access |
| `docs/ci-runbook.md` | Phase 5: on-call scenarios |

---

## What you should end up with by the end of the course

- **Security gate:** SAST + secret detection + container scan; critical blocks merge (not an "eternal" `allow_failure`).
- **No long-lived secrets in CI:** Agent instead of kubeconfig in Git; OIDC instead of `AWS_ACCESS_KEY_ID` in variables.
- **GitOps split:** CI pushes the image and updates the tag in the gitops repo; Argo synchronizes the cluster.
- **Reliability:** `interruptible` on test jobs, `resource_group` on production deploy, runbook `docs/ci-runbook.md`.
- **Documentation:** CI/CD diagram, Agent vs kubeconfig table, severity policy.

---

## Relation to the mock-exams DevOps track

```text
gitlab-basic → gitlab-intermediate → gitlab-advanced (this course)
                      ↓
              kuber-intermediate → kuber-advanced (Argo)
                      ↓
              appsec-fundamentals (theory) + aws-advanced (OIDC)
```

| Course topic | Where to go deeper |
|------------|----------------------|
| Security SDLC | [appsec-fundamentals/12](../appsec-fundamentals/12-secure-sdlc.md) |
| Argo CD advanced | [kuber-advanced/16](../kuber-advanced/16-argocd.md) |
| EKS + OIDC | [aws-advanced/13](../aws-advanced/13-eks-architecture.md) |
| Secrets management | [secrets-basic](../secrets-basic/README.md) |
| SRE release | [sre/11](../sre/11-change-and-release.md) |

---

## Quick start

```bash
# 1. GitLab (see deploy/gitlab)
docker compose -f deploy/gitlab/docker-compose.yml up -d

# 2. Cluster
mockctl up

# 3. (optional) Argo CD — kuber-advanced/17
kubectl create namespace argocd
# ... see 00-environment.md

# 4. Security template
mkdir -p .gitlab/ci
cp courses/gitlab-advanced/templates/security-pipeline.yml .gitlab/ci/
```

First lesson: [00-environment.md](00-environment.md) → [01-security-scanning.md](01-security-scanning.md).
