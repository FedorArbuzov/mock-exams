# GitLab Intermediate — Interview Cheatsheet

A reference **after** completing the course. First answer **without peeking**, then check here and in [14-interview-qa.md](14-interview-qa.md).

Course: [README.md](README.md). Stand: [`deploy/gitlab`](../../deploy/gitlab/README.md), [`mockctl`](../../mockctl/README.md). Examples: [`examples/k8s-deploy/`](examples/k8s-deploy/).

---

## Multi-stage pipeline

| Question | Answer |
|--------|-------|
| Stage order | all jobs of stage N finish → stage N+1 |
| `needs` | DAG: a job starts after the listed jobs, not the whole stage |
| `workflow:rules` | whether to create the pipeline at all |
| Fail fast | build/deploy after test via `needs` |
| `rules` vs `only` | prefer `rules` (top to bottom, first match) |
| `CI_PIPELINE_SOURCE` | `merge_request_event`, `push`, `schedule` |

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

docker-build:
  stage: build
  needs: [unit]
```

---

## Container Registry

| Variable | Purpose |
|----------|------------|
| `CI_REGISTRY` | hostname (`localhost:8929`) |
| `CI_REGISTRY_IMAGE` | image path without a tag |
| `CI_REGISTRY_USER` | `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | job token (lifetime = job) |

| Topic | Answer |
|------|-------|
| Tag for deploy | `$CI_COMMIT_SHA` (immutable) |
| dind | `services: docker:dind`, `privileged` runner |
| Kaniko | build without a Docker socket / privileged |
| `latest` | gets overwritten — not for prod deploy |
| `.dockerignore` | smaller context, faster build |

```yaml
before_script:
  - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
script:
  - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
  - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

---

## Kubernetes deploy

| Method | When |
|--------|-------|
| `kubectl apply` + `envsubst` | [`examples/k8s-deploy`](examples/k8s-deploy/), mockctl |
| `helm upgrade --install` | values per env ([kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md)) |
| GitOps (Argo CD) | CI build only — [`gitlab-advanced`](../gitlab-advanced/README.md) |

| Problem | Solution |
|----------|---------|
| ImagePullBackOff | `imagePullSecrets: gitlab-reg` |
| Unauthorized API | an up-to-date kubeconfig File variable |
| Wrong version | deploy by SHA, not `latest` |
| Runner can't see the API | host runner / minikube IP in the kubeconfig |

```yaml
deploy:
  needs: [docker-build]
  script:
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -f -
    - kubectl rollout status deployment/hello-ci --timeout=120s
```

---

## Environments

| Construct | Effect |
|-------------|--------|
| `environment: name` | deploy history in Operate → Environments |
| `when: manual` | a Play button |
| Protected environment | Maintainer+ deploy only |
| `on_stop` | cleanup of a review environment |
| Scoped variables | different `REPLICAS` staging/prod |
| `deployment_tier` | staging / production for DORA |

```yaml
deploy-staging:
  environment: staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  environment: production
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

---

## CI templates

| Construct | Purpose |
|-------------|------------|
| `include: local` | YAML from the same repo |
| `include: project` | a shared template repo |
| `.hidden-job` | a template, doesn't create a job |
| `extends` | inheriting configuration |
| `ref: v1.0.0` | pin a template version |
| `!reference` | reuse of script fragments |

```yaml
include:
  - local: ci/docker-build.yml

build-image:
  extends: .docker-build
  needs: [unit]
```

---

## Terraform CI

| Job | Command |
|-----|---------|
| Format | `terraform fmt -check -recursive` |
| Validate | `terraform validate` |
| Plan (MR) | `init -backend=false` + `plan -out=plan.cache` |
| Apply | `apply plan.cache` — **manual**, main |

| Variable | Why |
|------------|-------|
| `TF_IN_AUTOMATION` | non-interactive CI |
| `TF_INPUT` | `false` — no prompts |
| Plan artifact | the same plan on apply |

Project: [`image-pipeline`](../aws-terraform/projects/image-pipeline/). **Don't apply on every MR** without review.

---

## Variables (frequent)

| Variable | Usage |
|----------|---------------|
| `CI_COMMIT_SHA` | image tag |
| `CI_COMMIT_REF_SLUG` | DNS-safe branch name / review ns |
| `CI_COMMIT_BRANCH` | `main`, feature branches |
| `KUBECONFIG` (File) | access to the mockctl cluster |

---

## mockctl / kubectl / docker commands

```bash
# Stand
docker compose -f deploy/gitlab/docker-compose.yml up -d
mockctl up && mockctl status
mockctl kubeconfig

# K8s
kubectl get pods -n hello-ci
kubectl rollout undo deployment/hello-ci -n hello-ci
kubectl port-forward -n hello-ci svc/hello-ci 8080:80

# Registry
docker login localhost:8929 -u root -p PASSWORD
docker pull localhost:8929/root/hello-ci:SHA
```

---

## Related courses

| Course | Topic |
|------|------|
| [`gitlab-basic`](../gitlab-basic/README.md) | runners, variables, artifacts |
| [`kuber-basic`](../kuber-basic/README.md) | Deployment, Service |
| [`kuber-intermediate`](../kuber-intermediate/README.md) | Helm deploy |
| [`aws-terraform`](../aws-terraform/README.md) | image-pipeline, LocalStack |
| [`aws-intermediate`](../aws-intermediate/README.md) | image-platform app |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | scanning, Agent, OIDC |

---

## Quick self-check (5 min)

1. Draw the DAG: lint → unit → build → deploy.
2. Name the 4 `CI_REGISTRY*` variables.
3. Why `imagePullSecrets` for `localhost:8929`?
4. Staging auto vs production manual — what's the difference?
5. Why `terraform plan -out` + artifact on apply?

Detailed answers: [14-interview-qa.md](14-interview-qa.md).
