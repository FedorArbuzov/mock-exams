# 14. Interview Q&A — GitLab Intermediate

~20 questions with detailed answers for a DevOps / Platform interview. First answer **out loud yourself**, then check. Short cheat sheet: [interview-cheatsheet.md](interview-cheatsheet.md). Course stand: [`deploy/gitlab`](../../deploy/gitlab/README.md), [`mockctl`](../../mockctl/README.md).

---

## Multi-stage pipelines

### 1. How does `stages` differ from `needs`?

**`stages`** sets the global order: all jobs of the current stage must finish successfully before GitLab starts the next stage. Jobs within a single stage are **parallel** by default. **`needs`** builds a directed acyclic graph between specific jobs: a job can start right after the listed dependencies, without waiting for the rest of the jobs in the same or the previous stage.

Example: `docker-build` with `needs: [unit]` doesn't wait for the slow `integration` in the `test` stage. Without `needs`, speedup is only possible by splitting stages, which complicates the config and is still stricter than a DAG.

### 2. Why `workflow:rules`?

It filters **the creation of the whole pipeline**, not individual jobs. The course pattern: a pipeline only on `merge_request_event` and on the `main` branch; a push to `feature/x` without an MR — `when: never`. It saves runner minutes and prevents accidental deploys from branches where job-level `rules` were forgotten.

`rules` on an individual job don't cancel pipeline creation — the job will be **skipped**, but the pipeline exists and is visible in the UI.

### 3. What is fail fast in CI?

Cheap checks (lint, unit, `terraform fmt`) run **before** expensive ones (docker build, deploy, terraform apply). Implementation: stage order and/or `needs`. The antipattern — `docker-build` in the same stage as `unit` without `needs`: when tests fail, the image is already being built, wasting 5–10 minutes of runner time.

### 4. When should deploy not run on a feature branch?

When there's no isolated review namespace. Production and shared staging — `main` or release tags only. A feature branch — lint/test/build without deploy, or a **dynamic environment** `review/$CI_COMMIT_REF_SLUG` with `on_stop` for cleanup. Deploy to shared staging from a feature branch is a frequent source of incidents in interviews.

---

## Container Registry

### 5. What goes into `CI_REGISTRY_IMAGE`?

The full image path **without a tag**: `<registry-host>/<namespace>/<project>`. For example `localhost:8929/root/hello-ci` on the learning [`deploy/gitlab`](../../deploy/gitlab/README.md). The tag for deploy: `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`. Credentials — `CI_REGISTRY_USER` (usually `gitlab-ci-token`) and `CI_REGISTRY_PASSWORD` (the job token).

### 6. Why a job token for registry login?

The job token is issued for the duration of the job and gives scoped access to the project's registry without a long-lived root password in CI variables. Less risk of a leak from a variable dump or logs. For cross-project pull into another namespace — a **deploy token** or a **project access token** with minimal permissions.

### 7. Docker-in-Docker vs Kaniko — when which?

**dind**: a full Docker daemon in a sidecar (`services: docker:dind`); often requires a **privileged** runner — a higher-risk zone. **Kaniko**: a build without a Docker socket on the host; preferable in a locked-down Kubernetes executor. The learning compose with `docker.sock` — dind is simpler; enterprise production — Kaniko/BuildKit rootless.

### 8. Why not deploy by the `latest` tag?

`latest` gets **overwritten** on every push; you can't reliably map a running Pod to a commit in Git; rollback is unclear ("which latest was it yesterday?"). The **immutable** `$CI_COMMIT_SHA` gives traceability: the SHA in Git = the tag in the registry = the image in `kubectl describe pod`.

---

## Deploy to Kubernetes

### 9. Why should the kubeconfig in CI be protected?

Protected CI/CD variables are available only to jobs on **protected branches/tags**. A feature MR from a fork or an untrusted contributor won't get the kubeconfig — reducing the blast radius. Type **File**, not plain text in the repo; rotation after `mockctl down` / `up` when the minikube API endpoint changes.

### 10. Why `imagePullSecrets`?

The GitLab Container Registry is **private** for the project by default. Without credentials, the kubelet gets `401 Unauthorized` when pulling → the Pod goes to `ImagePullBackOff`. A secret of type `kubernetes.io/dockerconfigjson` in the Pod spec's `imagePullSecrets`. In CI it's created idempotently: `kubectl create secret ... --dry-run=client -o yaml | kubectl apply`.

### 11. Helm vs raw `kubectl apply` in CI?

**kubectl + envsubst** — minimal dependencies, transparent manifests ([`examples/k8s-deploy`](examples/k8s-deploy/)). **Helm** — templates, values per environment, `helm rollback` ([kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md)). **GitOps** (Argo CD, Flux) removes kubectl from CI — CI only builds/pushes; CD from Git — [`gitlab-advanced`](../gitlab-advanced/README.md).

### 12. GitOps vs CI deploy — the trade-off?

**CI deploy**: the pipeline calls `kubectl`/`helm` after merge — quick to adopt, with a drift risk (manual `kubectl edit`s aren't reflected in Git). **GitOps**: desired state in Git; a controller syncs the cluster; CI only publishes the image. Intermediate teaches CI deploy as the foundation before GitOps.

### 13. What does `kubectl rollout status` do in a deploy job?

It blocks the job until the Deployment rollout finishes (the new ReplicaSet Pods are Ready). On timeout or crash loop the job is **failed** — the pipeline is red, alerting the team. Rollback: `kubectl rollout undo` or a redeploy of a previous SHA from the registry.

---

## Environments

### 14. `when: manual` on a job vs `rules: when: manual`?

Both create a job that requires clicking **Play** in the UI. **`rules`** are more flexible — you can hide the job on an MR via a final `when: never`. A manual job **is created** in the pipeline graph and is visible; a skipped job isn't. Don't confuse it with **Run pipeline** (a manual pipeline as a whole).

### 15. Why a protected environment?

It restricts who can deploy to `production` (the Maintainer+ role in CE). Merge into `main` automatically ≠ a prod deploy. In GitLab EE — deployment approvals, multiple approvers. The pairing: protected environment + a protected kubeconfig variable.

### 16. What is `on_stop`?

It links an environment with a **cleanup job** (`environment.action: stop`). For `review/$CI_COMMIT_REF_SLUG`, when the MR is closed or the Stop button in the UI is clicked, a job runs that deletes the namespace — otherwise review apps pile up and eat resources.

### 17. Variables scoped to an environment — an example?

`REPLICAS=1` scope `staging`, `REPLICAS=3` scope `production`. GitLab substitutes the variable by the job's `environment:name` at run time. One key — different values without duplicating job definitions ([08-lab-environments.md](08-lab-environments.md)).

---

## CI templates

### 18. `include` vs copy-paste across 10 repositories?

**include** (project/local/remote) — a single source of truth; updating dind TLS, login, and tags in one MR to the template repo. Copy-paste — inevitable drift ("service B forgot `DOCKER_TLS_CERTDIR`"). Version with `ref: v1.2.0`, not `main`. Hidden job `.docker-build` + `extends` in the services.

### 19. What is a hidden job?

A job name starts with a **`.`** (for example `.docker-build`) — GitLab **doesn't create** an executable job in the pipeline; it's an object only for `extends` / `!reference`. It allows DRY without "empty" jobs in the graph.

---

## Terraform CI

### 20. Why a `terraform plan` artifact and apply from `plan.cache`?

**Plan** on the MR captures the exact infrastructure diff for human review; `plan -out=plan.cache` — a binary plan. **Apply** on protected `main` uses the **same** plan file from the artifact — apply matches the reviewed diff. In the MR: `terraform init -backend=false` — don't write to remote state. Apply — **manual**, not on every push. `terraform fmt -check` in CI; `TF_IN_AUTOMATION=true`. Code: [`image-pipeline`](../aws-terraform/projects/image-pipeline/).

---

## Summary table "question → one phrase"

| Topic | Phrase |
|------|-------|
| needs | speeds up the DAG, doesn't wait for the whole stage |
| workflow:rules | don't create unnecessary pipelines |
| CI_COMMIT_SHA | immutable image tag |
| imagePullSecrets | pull from a private GitLab Registry |
| staging / prod | auto vs manual + different namespaces |
| include | DRY for CI, pin a ref tag |
| plan.cache | the reviewed plan = the same apply |

---

## How to prepare

1. Complete [13-final-project.md](13-final-project.md) — the answers will come from experience, not from memory.
2. Open the pipeline graph in GitLab and **explain out loud** each `needs` arrow.
3. Show the Environments UI after staging + a manual prod deploy.
4. Read [interview-cheatsheet.md](interview-cheatsheet.md) **without** the course chapters open.
5. Repeat the self-check from the cheat sheet; then check against the answers above.

---

**Course complete.** [13-final-project.md](13-final-project.md) → [interview-cheatsheet.md](interview-cheatsheet.md) → [`gitlab-advanced`](../gitlab-advanced/README.md).
