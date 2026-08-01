# 10. Final project: CI for hello-ci

## Intro: a real-world scenario

End of the sprint. Product owner: "Every MR into `hello-ci` must pass lint, unit with coverage, and build a wheel — just like in prod." You assemble a **reference basic pipeline**: protected `main`, variables, artifacts, cache, and an MR history of failed → fixed. This is a portfolio artifact and an entry ticket to [`gitlab-intermediate`](../gitlab-intermediate/README.md) (docker build + registry on `:8929`).

The project is graded by a **checklist**, not "by eye." Time: **2–3 hours**.

## What you submit

- A GitLab project (local `:8929` or screenshots).
- An MR with meaningful commits and **one** intentional-failure cycle.
- A README in the project: local run + a description of the CI.
- A `.gitlab-ci.yml` that satisfies the requirements table.

---

## Goal

A complete **basic pipeline** for [`examples/hello-ci/`](examples/hello-ci/):

```text
MR / push main
    → stage test: lint (ruff) ∥ unit (pytest + coverage)
    → stage build: package (wheel artifact + APP_VERSION)
```

Connection to **DORA**: frequent small MRs with automated checks lower **Change Failure Rate** and give fast feedback ([`devops-culture`](../devops-culture/03-dora-metrics.md)).

---

## Requirements (submission checklist)

| # | Criterion | How to verify |
|---|----------|---------------|
| 1 | Protected branch `main`, merge via MR | push to main rejected |
| 2 | Stages: `test`, `build` (in this order) | UI pipeline |
| 3 | Jobs `lint` and `unit` are parallel in `test` | graph |
| 4 | `rules`: MR + `main` on the main jobs | push a feature without rules — no extra jobs |
| 5 | Masked variable `APP_VERSION` in build | Settings → Variables; used in the script |
| 6 | Artifacts: wheel in `out/` + `coverage.xml` | Download artifacts |
| 7 | pip cache with a key from the lockfile/requirements | the second pipeline is faster |
| 8 | `tags: [docker]` on jobs | no pending |
| 9 | An MR with a failed → fixed pipeline | MR history |
| 10 | README: local pytest + what the CI does | file in the repo |

Optional: a **pipeline badge** in the README:

```markdown
[![pipeline status](http://localhost:8929/root/hello-ci/badges/main/pipeline.svg)](http://localhost:8929/root/hello-ci/-/commits/main)
```

---

## Recommended `.gitlab-ci.yml` structure

Assemble it **yourself** — below is a guide, don't copy it blindly without understanding:

```yaml
stages:
  - test
  - build

default:
  image: python:3.12-slim
  tags:
    - docker
  cache:
    key:
      files:
        - requirements-dev.txt
    paths:
      - .cache/pip

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

.workflow_rules:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

lint:
  stage: test
  extends: .workflow_rules
  script:
    - pip install ruff
    - ruff check app/ tests/

unit:
  stage: test
  extends: .workflow_rules
  script:
    - pip install pytest pytest-cov
    - pip install -e .
    - pytest tests/ -v --cov=app --cov-report=xml:coverage.xml
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - coverage.xml
    expire_in: 1 week

package:
  stage: build
  extends: .workflow_rules
  script:
    - pip install build
    - echo "Building version $APP_VERSION"
  # ADD: python -m build, copy the whl, artifacts paths out/
  artifacts:
    paths:
      - out/
    expire_in: 1 day
```

**Your task:** complete `package` (build the wheel, `out/`), and create `APP_VERSION` in CI/CD Variables (masked if you like — it's not a secret, so masking versions isn't required).

---

## The APP_VERSION variable

**Settings → CI/CD → Variables:**

| Key | Value | Mask | Protect |
|-----|-------|------|---------|
| `APP_VERSION` | `1.0.0-ci` | optional | optional |

In the `package` script:

```yaml
- test -n "$APP_VERSION"
- echo "$APP_VERSION" > out/VERSION
```

Don't hard-code the version in Git if the PO changes it in variables.

---

## Project README (template)

```markdown
# hello-ci

Demo app for GitLab CI basic course.

## Local

pip install -r requirements-dev.txt
pytest tests/ -v
ruff check app/ tests/

## CI

| Stage | Jobs |
|-------|------|
| test | lint (ruff), unit (pytest + coverage) |
| build | package (wheel) |

Triggers: merge request and main branch.
Secrets: none in repo; APP_VERSION in CI variables.

GitLab: http://localhost:8929/root/hello-ci
```

---

## Submission process (self-check)

1. Create an issue "Final CI pipeline".
2. Branch `feature/final-ci`.
3. Commits with Conventional Commits (`feat(ci): ...`, `fix(test): ...`).
4. MR → wait for green.
5. Deliberately break lint (an unused import) → push → fix → push.
6. Merge into `main` → the pipeline on main is green.
7. Check against the requirements table.

---

## Common mistakes on the finale

| Mistake | How it's caught |
|--------|-------------|
| `unit` in the `build` stage | the test-before-build order is violated |
| Coverage artifact without pytest-cov | an empty coverage.xml |
| APP_VERSION in git | security review fail |
| No protected main | requirement #1 |
| One giant job instead of lint∥unit | no parallelism |
| Forgot `pip install -e .` | unit ModuleNotFoundError |

---

## Next

| Course | Topic |
|------|------|
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | Docker build, push to the `:8929` registry, deploy |
| [`kuber-basic`](../kuber-basic/README.md) | a cluster for deploy |
| [`devops-culture`](../devops-culture/README.md) | DORA, team topologies |
| [`secrets-basic`](../secrets-basic/README.md) | Vault in CI |

After submission: [interview-cheatsheet.md](interview-cheatsheet.md) and [11-interview-qa.md](11-interview-qa.md).

---

## Summary

The final project combines the Git workflow, YAML, runners, variables, artifacts, and cache — a minimal **production-like** CI for a Python service on GitLab CE.

---

## Course completion checklist

- [ ] All 10 items of the requirements table are done
- [ ] An MR with a fail/fix history
- [ ] The README is up to date
- [ ] You can explain the pipeline to a colleague in 5 minutes
- [ ] You're ready for intermediate

---

**gitlab-basic is complete.**
