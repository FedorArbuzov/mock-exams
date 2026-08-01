# 03. `.gitlab-ci.yml`: stages, jobs, image

## Intro: a real-world scenario

Wednesday, code review. A colleague opens an MR with a `.gitlab-ci.yml` — 80 lines, three stages, a `deploy` job with no `rules`, and a comment: "Why didn't the pipeline run on my push to `docs/fix-typo`?" A second case: the `test` job fails with `python: not found` — they forgot `image` in the YAML. A third: two jobs in different stages have the same name `test` — GitLab complains about a duplicate key. You open **CI/CD → Editor → Validate** — a YAML syntax error on a tab instead of spaces.

This chapter is the **anatomy of a pipeline**: how GitLab turns a file into a queue of jobs, and what to configure in each job.

## What you'll learn

- The structure: **pipeline → stages → jobs**.
- Job keys: `stage`, `image`, `script`, `before_script`, `rules`, `tags`.
- Parallelism within a stage and ordering between stages.
- **Predefined CI variables** (`CI_COMMIT_BRANCH`, `CI_PIPELINE_SOURCE`, …).
- Why a pipeline **isn't created** or is **empty**.
- `rules` vs the deprecated `only`/`except`.

---

## Where the config lives

The file **`.gitlab-ci.yml`** in the **root** of the repository (by default). An alternative path — Settings → CI/CD → General pipelines.

```text
hello-ci/
├── .gitlab-ci.yml    ← GitLab reads it on push/MR
├── app/
└── tests/
```

GitLab **does not execute** the YAML on the server as if it were Python — it **parses** the config and creates **jobs** for **runners**.

```text
.gitlab-ci.yml → Pipeline #42
    → Stage: test → jobs: lint, unit (in parallel)
    → Stage: build → job: package (after test succeeds)
```

---

## A minimal pipeline

```yaml
stages:
  - test

lint:
  stage: test
  image: python:3.12-slim
  script:
    - pip install ruff
    - ruff check app/
```

| Element | Role |
|---------|------|
| `stages` | an ordered list of stages |
| `lint` | the job name (unique in the pipeline) |
| `stage: test` | membership in a stage |
| `image` | the Docker image (docker executor) |
| `script` | shell commands (any nonzero exit code = fail) |

Without `stages`, GitLab uses implicit stages: `build`, `test`, `deploy` — a job without `stage` lands in `test`. An explicit `stages` is clearer for the team.

---

## Stages and execution order

```yaml
stages:
  - test
  - build
  - deploy
```

| Rule | Behavior |
|---------|-----------|
| Jobs in the **same** stage | in parallel (if there are enough runners) |
| The next stage | only if **all** jobs of the previous one succeed (or are allowed to fail) |
| One job fails | the stage fails, the following stages **don't run** (by default) |

```text
test:  [lint] [unit]  — simultaneously
         ↓       ↓
       both OK?
         ↓
build: [package]
         ↓
deploy: (in intermediate)
```

At the basic level it's often `test` + `build` without deploy — deploy is in [`gitlab-intermediate`](../gitlab-intermediate/README.md) and [`kuber-basic`](../kuber-basic/README.md).

---

## Anatomy of a job

```yaml
unit:
  stage: test
  image: python:3.12-slim
  tags:
    - docker
  before_script:
    - pip install pytest
  script:
    - pytest tests/ -v
  after_script:
    - echo "Job $CI_JOB_NAME finished with $CI_JOB_STATUS"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
  timeout: 30m
  retry: 1
```

| Key | Purpose |
|------|------------|
| `before_script` | preparation (deps); inherited from `default:` |
| `after_script` | runs **always**, even on failure (cleanup) |
| `tags` | choosing a runner with these tags |
| `rules` | when to create the job |
| `timeout` | kill a hung job |
| `retry` | retry on an infrastructure failure |
| `allow_failure: true` | the job is red but the pipeline is green (a soft gate) |

### `default` — DRY for all jobs

```yaml
default:
  image: python:3.12-slim
  tags:
    - docker
  before_script:
    - pip install --upgrade pip

lint:
  stage: test
  script:
    - pip install ruff && ruff check .
```

---

## `image` and the docker executor

With the **docker executor**, the runner does `docker run` of the specified image and executes the `script` inside the container.

```yaml
job:
  image: python:3.12-slim
  script:
    - python --version
```

| Situation | Result |
|----------|-----------|
| No `image` | the default image from runner registration (`alpine:latest`) — often no `python` |
| Wrong image tag | pull error, job failed |
| Private registry | `image` + login via variables (intermediate) |

**services** — sidecar containers (Postgres, Redis) — a preview in [06-lab-docker-runner.md](06-lab-docker-runner.md).

---

## `rules`: when a job exists

The modern style (recommended):

```yaml
test-unit:
  stage: test
  script:
    - pytest
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

A job **won't appear** in the pipeline if no rule matched — it's not "skipped," it's **absent**.

Common conditions:

| Expression | When |
|-----------|-------|
| `$CI_PIPELINE_SOURCE == "merge_request_event"` | MR pipelines |
| `$CI_COMMIT_BRANCH == "main"` | push to main |
| `$CI_COMMIT_TAG` | a release by tag |
| `changes: paths` | only if files changed |

Deprecated (you'll meet it in legacy):

```yaml
only:
  - merge_requests
  - main
except:
  - schedules
```

Migrating to `rules` is easier to read and combine.

---

## Predefined variables

GitLab injects variables into every job:

| Variable | Example | Why |
|----------|--------|-------|
| `CI_COMMIT_BRANCH` | `feature/ci` | rules, script |
| `CI_COMMIT_SHA` | `a1b2c3d4` | artifacts, docker tag |
| `CI_PROJECT_NAME` | `hello-ci` | names |
| `CI_PROJECT_DIR` | `/builds/root/hello-ci` | the working directory in the job |
| `CI_PIPELINE_ID` | `42` | links |
| `CI_JOB_NAME` | `unit` | logs |
| `CI_PIPELINE_SOURCE` | `merge_request_event` | rules |
| `CI_REGISTRY` | `localhost:8929` | pushing images (CE) |

Full list: GitLab Docs → **Predefined CI/CD variables**.

Using them in a script:

```yaml
script:
  - echo "Building $CI_PROJECT_NAME@$CI_COMMIT_SHORT_SHA on branch $CI_COMMIT_BRANCH"
```

---

## Inheritance and `extends`

For repeated jobs:

```yaml
.python_test:
  image: python:3.12-slim
  before_script:
    - pip install pytest

unit:
  extends: .python_test
  stage: test
  script:
    - pytest tests/
```

Templates with a dot (`.python_test`) are a convention — the job isn't created on its own.

---

## When a pipeline doesn't run

| Cause | Diagnosis |
|---------|-------------|
| No `.gitlab-ci.yml` | add the file to root |
| YAML syntax error | CI/CD → Editor → **Validate** |
| All jobs filtered out by `rules` | Pipeline exists but empty / few jobs |
| No active runner | jobs **pending** (chapter 05) |
| CI disabled | Settings → General → Visibility |
| Invalid `stages` name | a typo in the job's `stage:` |

### Viewing a failed job's log

**CI/CD → Pipelines → pipeline #N → job name → Trace/log.**

Look at the last lines: exit code, traceback, `command not found`.

---

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| Tabs in YAML | validate fail | spaces only, 2 spaces |
| Duplicate job name | pipeline config error | unique names |
| No `image` for Python | `python: not found` | `image: python:3.12-slim` |
| `only: branches` without MR | no pipeline on the MR | `rules` + `merge_request_event` |
| Multi-line `script` without `-` | YAML parse error | a list with `-` |
| Forgot `tags: [docker]` | pending in the course | add the runner tags |

---

## Summary

- `.gitlab-ci.yml` describes **stages** and **jobs**; the runner executes the `script` in the `image`.
- Jobs in the same stage run **in parallel**; stages run **sequentially**.
- **`rules`** decide whether a job lands in the pipeline.
- **Predefined variables** — the commit/MR/project context without a manual export.
- Validating the YAML in the Editor saves a push-fail-fix cycle.

---

## Checklist

- [ ] In what order do stages run, and jobs within a stage?
- [ ] Why `image` with the docker executor?
- [ ] Why is `rules` better than `only`/`except`?
- [ ] Where do you look at a failed job's log?
- [ ] What does `CI_PIPELINE_SOURCE=merge_request_event` mean?
- [ ] Why might a job be absent from a pipeline (not skipped)?

Next lesson: [04-lab-first-pipeline.md](04-lab-first-pipeline.md).
