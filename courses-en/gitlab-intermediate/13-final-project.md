# 13. Final project: the image-platform pipeline

## Real-world scenario

Interview: "describe the CI/CD of your last project." A weak answer: "we have GitLab and Docker." A strong one: a multi-stage DAG, immutable tags, staging auto / prod manual, shared templates, an optional terraform plan, protected secrets, a rollback story. The final project brings together **all the chapters** on [`deploy/gitlab`](../../deploy/gitlab/README.md) + [`mockctl`](../../mockctl/README.md).

Target application: [`hello-ci`](../gitlab-basic/examples/hello-ci/) or, conceptually, [`image-platform`](../aws-intermediate/projects/image-platform/) — the main thing is a **complete pipeline**.

## Goal

```text
MR  → lint → test → docker build → push registry
main → deploy staging (auto) → deploy production (manual)
optional: a terraform plan job for infrastructure/
```

## What you submit

| Artifact | Description |
|----------|----------|
| GitLab project URL | public or a screenshot + description |
| MR link | the final MR with a green pipeline |
| README | architecture, rollback, stand constraints |
| Screenshot | pipeline graph + Environments UI |
| A 5-sentence text | "what you'd improve for production" |

---

## Requirements (submission checklist)

| # | Criterion | Chapter |
|---|----------|-------|
| 1 | Multi-stage + `needs` (fail fast) | [01](01-multi-stage.md), [02](02-lab-multi-stage.md) |
| 2 | Image in the Registry by `$CI_COMMIT_SHA` | [03](03-docker-registry.md), [04](04-lab-build-push.md) |
| 3 | Deploy to mockctl: staging + prod namespace | [05](05-deploy-kubernetes.md), [06](06-lab-deploy-mockctl.md) |
| 4 | Environments (staging auto, prod manual) | [07](07-environments.md), [08](08-lab-environments.md) |
| 5 | `include` + `extends` shared template | [09](09-ci-templates.md), [10](10-lab-templates.md) |
| 6 | Protected File variable `KUBECONFIG` | [00](00-environment.md), [06](06-lab-deploy-mockctl.md) |
| 7 | `workflow:rules` | [01](01-multi-stage.md) |
| 8 | README + pipeline graph screenshot | — |
| 9 | (Bonus) `terraform-plan` on the MR | [11](11-terraform-ci.md), [12](12-lab-terraform-ci.md) |
| 10 | (Bonus) Helm deploy | [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) |

---

## Recommended structure

```text
image-platform-ci/
├── README.md
├── .gitlab-ci.yml
├── ci/
│   ├── docker-build.yml
│   └── deploy-k8s.yml
├── Dockerfile
├── app/
├── k8s/
│   └── deployment.yaml      ← from examples/k8s-deploy/
├── tests/
└── infrastructure/         # optional, image-pipeline
```

---

## Reference `.gitlab-ci.yml` skeleton

```yaml
include:
  - local: ci/docker-build.yml
  - local: ci/deploy-k8s.yml

stages:
  - validate
  - test
  - build
  - deploy

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

lint:
  stage: validate
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install ruff && ruff check .

unit:
  stage: test
  needs: [lint]
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install pytest && pytest -q

build-image:
  extends: .docker-build
  needs: [unit]

deploy-staging:
  extends: .deploy-k8s
  environment:
    name: staging
  variables:
    K8S_NAMESPACE: hello-ci-staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  extends: .deploy-k8s
  environment:
    name: production
    deployment_tier: production
  variables:
    K8S_NAMESPACE: hello-ci-prod
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Fill out `ci/deploy-k8s.yml` with the secret, envsubst, and rollout ([08-lab-environments.md](08-lab-environments.md)).

---

## Quality criteria (self-review)

### Pipeline design

- [ ] Expensive jobs don't run on failed tests
- [ ] The MR doesn't deploy to production
- [ ] Redundant pipelines are canceled

### Security sketch

- [ ] No kubeconfig / AWS keys in Git
- [ ] Registry login via `CI_REGISTRY_*`
- [ ] Production environment protected

### Operability

- [ ] README: rollback a deployment
- [ ] README: update the kubeconfig after `mockctl up`
- [ ] Environments show the latest SHA

---

## "What you'd improve for production" (example)

1. **Kaniko** instead of privileged dind.
2. **GitLab Agent for Kubernetes** instead of a static kubeconfig.
3. **Container Scanning + SAST** ([gitlab-advanced](../gitlab-advanced/README.md)).
4. **GitOps (Argo CD)** — CI only builds/pushes.
5. **OIDC in AWS** for terraform ([aws-terraform](../aws-terraform/README.md)).

Write **your own** five points.

---

## Grading

| Level | Signs |
|---------|----------|
| Pass | criteria 1–8, pipeline green |
| Strong | + Helm or a terraform plan |
| Excellent | + tfsec, a smoke job, an SLO |

---

## Common mistakes

**A single 300-line `.gitlab-ci.yml`** — violates templates.

**Production deploy auto** — [07-environments.md](07-environments.md).

**No SHA ↔ deploy link** — check `IMAGE`.

**A screenshot of the pipeline only** — add Environments.

---

## Summary

- The final project = a complete pipeline from MR to a manual prod deploy.
- Stand: GitLab registry + mockctl cluster + optional terraform.

---

## Next

- [`gitlab-advanced`](../gitlab-advanced/README.md)
- [`devops-culture`](../devops-culture/README.md)
- [`mock-ckad`](../mock-ckad/README.md)

Preparation: [interview-cheatsheet.md](interview-cheatsheet.md) → [14-interview-qa.md](14-interview-qa.md).

**gitlab-intermediate complete.**
