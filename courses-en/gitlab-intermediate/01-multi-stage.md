# 01. Multi-stage pipelines

## Real-world scenario

Wednesday, 10:00. Feature branch — push. Pipeline: lint 30 s, unit 2 min, **docker build 8 min**, deploy staging 3 min. You change one line in the README — **13 minutes** again. The tech lead: "why does the build run before the tests?" In `.gitlab-ci.yml` all jobs in the `build` stage start **in parallel** with `unit`. Second case: the pipeline on `feature/foo` deploys to staging — you forgot `workflow:rules`. Third: the MR pipeline and the branch pipeline are duplicated — double the runner-minute cost.

Intermediate starts with a **managed chain**: validate → test → build → deploy, with a **DAG** (`needs`) and a **pipeline filter** (`workflow:rules`). The foundation for the registry ([03](03-docker-registry.md)), mockctl deploy ([05](05-deploy-kubernetes.md)), and Terraform ([11](11-terraform-ci.md)).

Stand: [00-environment.md](00-environment.md). YAML basics: [gitlab-basic/03-gitlab-ci-yaml.md](../gitlab-basic/03-gitlab-ci-yaml.md).

## What you'll learn

- Why you need several **stages** and how GitLab orders them.
- How **`needs`** builds a DAG and speeds up the pipeline.
- How **`workflow:rules`** disables unnecessary pipelines.
- The **fail fast** pattern — expensive jobs only after green tests.
- The difference between `only/except` (legacy) and **`rules`**.

---

## A typical DevOps chain

```text
commit / MR
    │
    ▼
┌───────────┐    ┌──────────┐    ┌─────────────┐    ┌──────────────┐
│ validate  │───▶│   test   │───▶│    build    │───▶│    deploy    │
│ lint, fmt │    │ unit,    │    │ docker push │    │ helm/kubectl │
│ tf validate│   │ integration│  │ scan (stub) │    │ (env-specific)│
└───────────┘    └──────────┘    └─────────────┘    └──────────────┘
```

On an **MR**: validate + test + build (no prod deploy). On **main**: + auto staging + manual production ([07-environments.md](07-environments.md)).

In [`deploy/gitlab`](../../deploy/gitlab/README.md) the runner minutes are limited to a single agent — DAG optimization is felt immediately.

---

## Stages: the default order

```yaml
stages:
  - validate
  - test
  - build
  - deploy
```

| Stage | Typical jobs | Cost |
|-------|---------------|-----------|
| validate | ruff, `terraform fmt -check`, `yamllint` | low |
| test | pytest, `go test`, smoke API | medium |
| build | `docker build`, compile artifacts | **high** |
| deploy | kubectl, helm, terraform apply | high + risk |

**GitLab rule:** all jobs in stage `N` must **finish successfully** before stage `N+1` starts (unless `needs` introduces cross-stage dependencies).

A job with no explicit `stage` lands in the first one in the list — a common beginner mistake.

```yaml
lint:
  stage: validate
  image: python:3.12-slim
  script:
    - pip install ruff && ruff check .

unit:
  stage: test
  image: python:3.12-slim
  script:
    - pip install pytest && pytest -q
```

Line by line: `stage:` defines the pipeline "floor"; jobs in the same stage are **parallel** by default.

---

## `needs` — directed acyclic graph (DAG)

Without `needs`, the `docker-build` job in the `build` stage waits for **all** jobs in the `test` stage — including the slow integration one, even though unit is already green.

```yaml
docker-build:
  stage: build
  needs:
    - job: unit
      artifacts: false
  tags: [docker]
  image: docker:24-cli
  services:
    - docker:24-dind
  script:
    - echo "Would build $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

| Aspect | Behavior |
|--------|-----------|
| `needs: [unit]` | build starts right after **unit**, doesn't wait for other test jobs |
| `artifacts: false` | don't download unit's artifacts (faster start) |
| Cycles | GitLab forbids cyclic `needs` |

In the UI, **CI/CD → Pipelines → Graph**, the `needs` arrows are shown explicitly — check them after a refactor.

**Limitation:** deploy must not depend only on lint, bypassing test — that breaks fail fast.

---

## `workflow:rules` — when a pipeline exists

`rules` on a job filter an **individual job**. `workflow:rules` filter the **whole pipeline**.

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never
```

| Event | Pipeline? |
|---------|-----------|
| Push to an MR | yes (MR pipeline) |
| Push to `main` | yes |
| Push to `feature/x` without an MR | **no** |

Saves runner minutes and prevents accidental deploys from a feature branch.

At the job level:

```yaml
deploy-staging:
  stage: deploy
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  script:
    - echo deploy
```

---

## Fail fast

**Antipattern:** `docker-build` in the `test` stage "for speed" — the image is built before pytest.

**Pattern:**

1. Cheap checks in `validate` (in parallel).
2. `unit` after validate (stage or `needs`).
3. `docker-build` with `needs: [unit]`.
4. `deploy` with `needs: [docker-build]` + `rules` for `main` only.

```yaml
scan-image:
  stage: build
  needs: [docker-build]
  script:
    - echo "trivy stub"
  allow_failure: true
```

In production, `allow_failure: true` for a security scan is a deliberate exception, not the default.

---

## `rules` vs the legacy `only/except`

```yaml
# legacy — don't use in new projects
deploy-production:
  only:
    - main
  when: manual
```

Equivalent:

```yaml
deploy-production:
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
    - when: never
```

`rules` are read top to bottom; **the first match wins**.

---

## Pipeline variables (cheat sheet)

| Variable | Purpose |
|----------|------------|
| `CI_COMMIT_SHA` | immutable image tag |
| `CI_COMMIT_REF_SLUG` | safe branch name for a namespace |
| `CI_PIPELINE_SOURCE` | `push`, `merge_request_event`, `schedule` |
| `CI_REGISTRY_IMAGE` | image path ([03-docker-registry.md](03-docker-registry.md)) |

---

## Common mistakes

**Build and test in parallel.** One stage, or `needs` is missing.

**Two pipelines on one push to an MR.** Configure `workflow:rules` or the GitLab options for branch pipelines while an MR is open.

**`needs` on a job from a future stage.** Depend only on previous stages.

**Deploy on every commit to main without a manual prod step.** Staging auto is OK; production should be `when: manual`.

**Empty `stages:`** — jobs land in the default `test` stage.

---

## Summary

- **Stages** — the global order; **needs** — a fine-grained DAG within and across stages.
- **workflow:rules** — don't create a pipeline on every push to a feature branch without an MR.
- **Fail fast** — docker build and deploy only after green tests.
- In an interview, draw the graph: lint → unit → build → deploy.

---

## Related material

| Material | Relation |
|----------|-------|
| [02-lab-multi-stage.md](02-lab-multi-stage.md) | practice validate → test → build stub |
| [03-docker-registry.md](03-docker-registry.md) | real build job |
| [09-ci-templates.md](09-ci-templates.md) | extract `.docker-build` into a template |
| [gitlab-basic/03](../gitlab-basic/03-gitlab-ci-yaml.md) | basics of jobs and images |

---

## Checklist

- [ ] You can explain the difference between **stage order** and **`needs`**
- [ ] You can write `workflow:rules` for "MR and main only"
- [ ] You know why docker build runs after unit, not in parallel
- [ ] You understand `CI_PIPELINE_SOURCE` for MR pipelines
- [ ] You can draw a DAG of 4 jobs on a whiteboard

Next lesson: [02-lab-multi-stage.md](02-lab-multi-stage.md).
