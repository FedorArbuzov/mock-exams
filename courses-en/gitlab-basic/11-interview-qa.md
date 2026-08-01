# 11. Interview Q&A: GitLab CI basics

## Intro

Questions for **Junior/Middle DevOps** and backend roles with CI: not "what is Git," but a pending runner, `rules`, a secret leak, artifacts vs cache. First answer **out loud for 1–2 minutes**, then check against the breakdown. A spoiler-free cheatsheet: [interview-cheatsheet.md](interview-cheatsheet.md).

---

## Block 1. Git and workflow

### 1. Why a Merge Request if there's only one developer?

**Answer.** An MR isn't only about reviewing someone else's code: it's a **CI trigger point** on a branch, a history of discussions, and a connection to an issue (`Closes #N`), plus an audit trail. Protected `main` + MR reduces the risk of breaking the trunk and improves **Change Failure Rate** (DORA). Even solo, the "branch → MR → merge" discipline prepares you for a team.

**In the course:** [01-git-workflow.md](01-git-workflow.md), [02-gitlab-intro.md](02-gitlab-intro.md).

---

### 2. What triggers a pipeline in GitLab — push, MR, or both?

**Answer.** It depends on **`rules`** / `only` in `.gitlab-ci.yml`. Typically: `merge_request_event` for MR pipelines and separate rules for pushes to `main`. A push to a feature branch without matching rules — the pipeline may not be created, or created with a subset of jobs. The `CI_PIPELINE_SOURCE` variable distinguishes `push`, `merge_request_event`, `schedule`, `web`, and others.

**In the course:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

### 3. How does a branch differ from a tag?

**Answer.** A **branch** moves with new commits (`main`, `feature/x`). A **tag** is an immovable pointer to a commit, usually a release (`v1.0.0`). CI on a tag is configured with separate `rules` for release/deploy jobs.

**In the course:** [01-git-workflow.md](01-git-workflow.md).

---

## Block 2. Pipeline and YAML

### 4. What does a pipeline in GitLab consist of?

**Answer.** The `.gitlab-ci.yml` file → a **pipeline** → ordered **stages** → **jobs**. Jobs in the same stage run **in parallel** (if runners are available); the next stage runs after the previous one succeeds (unless there's `allow_failure` / `needs`). The runner executes the `script` in the executor's environment (a docker image).

**In the course:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

### 5. Why `image` in a job?

**Answer.** With the **docker executor**, the runner starts a container from `image` and runs the script inside. Without `image` — the runner's default image (often `alpine` without Python/Node). `image` gives a reproducible CI environment close to prod.

**In the course:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md), [05-runners.md](05-runners.md).

---

### 6. `rules` vs `only`/`except`?

**Answer.** **`rules`** is the modern declarative approach: a job lands in the pipeline if at least one rule is true; otherwise the job **isn't created**. `only`/`except` is legacy, harder to combine. New projects — `rules`.

**In the course:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

### 7. Why might a job be absent from a pipeline (not skipped)?

**Answer.** No **`rules`** matched — GitLab doesn't create the job. This differs from **skipped** (manual) or **failed**. Check `CI_PIPELINE_SOURCE`, the branch, `changes:`.

**In the course:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

## Block 3. Runners

### 8. How does the GitLab Server differ from a Runner?

**Answer.** The **server** (CE/EE) — Git, UI, CI planning, artifact storage. The **runner** — an agent that **picks up** jobs and runs the commands. A server without a runner leaves pipelines in **pending**. Scaling execution means adding runners.

**In the course:** [05-runners.md](05-runners.md), [00-environment.md](00-environment.md).

---

### 9. Why does a job hang in pending?

**Answer.** Three common causes: (1) **no online runner**; (2) the job's **tags** don't match the runner; (3) the **queue** — `concurrent` is exhausted. Less often — the runner can't reach GitLab (wrong URL).

**In the course:** [05-runners.md](05-runners.md), [06-lab-docker-runner.md](06-lab-docker-runner.md).

---

### 10. Docker vs shell executor?

**Answer.** **Docker** — each job in a container, a clean FS, any `image`; requires Docker, socket risks. **Shell** — commands directly on the runner VM, faster start, **no isolation**, a "dirty" environment. Prod CI more often uses docker/k8s.

**In the course:** [05-runners.md](05-runners.md).

---

### 11. Why tags on a runner and a job?

**Answer.** **Routing**: a job with `tags: [docker]` runs only on a runner with the `docker` tag. Separating amd64/arm, gpu, on-prem vs cloud. A typo in a tag means permanent pending.

**In the course:** [05-runners.md](05-runners.md).

---

## Block 4. Variables and security

### 12. Where to store secrets for CI?

**Answer.** **Settings → CI/CD → Variables** (project/group), the **Mask** and **Protect** flags. Not in `.gitlab-ci.yml`, not in Git. For rotation and audit — Vault ([`secrets-basic`](../secrets-basic/README.md)). File type — for kubeconfig/PEM.

**In the course:** [07-variables-secrets.md](07-variables-secrets.md).

---

### 13. Is a masked variable a guarantee that a secret won't reach the log?

**Answer.** **No 100% guarantee.** Masking works with length ≥ 8, a single line, and suitable characters. Leaks: `set -x`, echo, short values, artifacts. Don't print secrets; rotate on a leak into Git.

**In the course:** [07-variables-secrets.md](07-variables-secrets.md).

---

### 14. Why `CI_JOB_TOKEN`?

**Answer.** A short-lived job token for accessing the GitLab API/registry on behalf of the pipeline: cloning another project (with permissions), `docker login` into the project registry. Restrict the scope in **Job token permissions**.

**In the course:** [07-variables-secrets.md](07-variables-secrets.md).

---

## Block 5. Artifacts and cache

### 15. Artifacts vs cache?

**Answer.** **Artifacts** — reliable transfer of files **between jobs** and download from the UI; `paths`, `expire_in`, `reports`. **Cache** — best-effort speed-up of **repeated** pipelines (pip, node_modules); it may miss or go stale. Build output → artifacts; dependencies → cache.

**In the course:** [08-artifacts-cache.md](08-artifacts-cache.md).

---

### 16. Why `dependencies` in a job?

**Answer.** It specifies **which jobs' artifacts** to download. By default a job may pull the artifacts of all previous stages — heavy. `dependencies: [build]` — only from `build`.

**In the course:** [08-artifacts-cache.md](08-artifacts-cache.md), [09-lab-artifacts.md](09-lab-artifacts.md).

---

### 17. Why `expire_in` on artifacts?

**Answer.** A TTL on GitLab storage — wheels, logs, and reports don't pile up forever. Compliance and disk cost. `never` — only when required by policy.

**In the course:** [08-artifacts-cache.md](08-artifacts-cache.md).

---

## Block 6. Practice and DORA

### 18. A pipeline failed on an MR but merging is allowed. Is that normal?

**Answer.** It depends on the **protected branch** settings: "Pipelines must succeed." Without that — a merge is possible (bad practice). The goal is a **quality gate**: red CI blocks a merge into `main`, lowering **Change Failure Rate**.

**In the course:** [02-gitlab-intro.md](02-gitlab-intro.md), [`devops-culture`](../devops-culture/03-dora-metrics.md).

---

### 19. How is CI connected to DORA metrics?

**Answer.** Automated tests in an MR → fewer defects in prod (**CFR**). A fast green pipeline → a shorter **Lead Time**. Frequent small MRs + deploy → **Deployment Frequency**. Good logs/artifacts → **MTTR**. CI is the technical enabler of the capabilities from Accelerate.

**In the course:** [README.md](README.md), [`devops-culture/03-dora-metrics`](../devops-culture/03-dora-metrics.md).

---

### 20. Describe a minimal pipeline for a Python service.

**Answer.** Stages `test` → `build`. Jobs: `lint` (ruff), `unit` (pytest) in parallel in `test`; `package` (wheel) in `build` with artifacts. `image: python:3.12-slim`, `tags: [docker]`, `rules` for MR and `main`, pip **cache**, secrets in variables, runner online.

**In the course:** [04-lab-first-pipeline.md](04-lab-first-pipeline.md), [10-final-project.md](10-final-project.md).

---

### 21. A secret got into `.gitlab-ci.yml` in Git. Your steps?

**Answer.** (1) **Rotate** the secret immediately — consider it compromised. (2) Remove it from the file, store it in CI variables. (3) Clean the Git history (`git filter-repo`) or a security process — not "just a new commit." (4) A blameless postmortem ([`devops-culture`](../devops-culture/11-trust-and-incidents.md)). (5) Pre-commit/gitleaks in CI later.

**In the course:** [07-variables-secrets.md](07-variables-secrets.md).

---

### 22. What are `services` in a job?

**Answer.** Sidecar containers next to the job (docker executor): Postgres, Redis. The DNS name is the **`alias`** (for example `db`). The job connects to `host: db`. For integration tests without an external DB.

**In the course:** [06-lab-docker-runner.md](06-lab-docker-runner.md).

---

### 23. Local GitLab CE on :8929 — why in learning?

**Answer.** The full cycle of Git + CI + runner + registry **without the cloud**; the same concepts as EE/SaaS. The mock-exams environment: [`deploy/gitlab`](../../deploy/gitlab/README.md). The skills are portable to a corporate instance.

**In the course:** [00-environment.md](00-environment.md).

---

### 24. What's next after gitlab-basic?

**Answer.** [`gitlab-intermediate`](../gitlab-intermediate/README.md) — docker build/push to the `:8929` registry, environments, deploy. [`kuber-basic`](../kuber-basic/README.md) — a cluster. [`gitlab-advanced`](../gitlab-advanced/README.md) — K8s executor, GitOps.

**In the course:** [10-final-project.md](10-final-project.md), [README.md](README.md).

---

### 25. `before_script` vs `script` vs `after_script`?

**Answer.** **`before_script`** — preparation (install deps), inherited from `default`. **`script`** — the main commands; exit ≠ 0 → job failed. **`after_script`** — runs **always** (even on failure), cleanup, notifications; a separate shell context.

**In the course:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

## How to prepare

1. Go through [interview-cheatsheet.md](interview-cheatsheet.md) with the cards covered.
2. For each question — a **mini-story from work** (pending runner, secret in git).
3. Draw on a whiteboard: push → pipeline → runner → artifacts.
4. Tie the answer to **one DORA metric**.

**The gitlab-basic interview block is complete.**
