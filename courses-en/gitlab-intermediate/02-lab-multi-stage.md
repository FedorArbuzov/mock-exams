# 02. Lab: validate → test → build (stub)

## Real-world scenario

In an interview they ask: "describe your CI." The answer "we have stages" — without a DAG or branch filter — sounds weak. Real teams lock in that an **MR doesn't build the image** until lint and unit pass; a **feature branch without an MR** doesn't burn runner minutes; a **new push to an MR** cancels the old pipeline. This lab is the minimal skeleton that in chapters 03–06 you'll fill with Docker build and deploy to mockctl.

**Preconditions:** [00-environment.md](00-environment.md), the `hello-ci` project in GitLab on [`deploy/gitlab`](../../deploy/gitlab/README.md), a runner with the `docker` tag. Theory: [01-multi-stage.md](01-multi-stage.md).

## What you'll do

- Assemble a `.gitlab-ci.yml` with stages `validate` → `test` → `build`.
- Set up `needs` between jobs — a DAG instead of "the whole test stage waits for integration".
- Add `workflow:rules` for MR and `main` — a feature push without an MR doesn't create a pipeline.
- Check the pipeline graph and auto-cancel redundant pipelines.

---

## Task 1. Basic pipeline

Create or replace `.gitlab-ci.yml` in the project root:

```yaml
stages:
  - validate
  - test
  - build

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
    - pip install --quiet ruff
    - ruff check . || true    # remove || true once you add code

unit:
  stage: test
  needs: [lint]
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install --quiet pytest
    - |
      if [ -d tests ]; then pytest -q; else echo "no tests yet — OK"; fi

build-stub:
  stage: build
  needs: [unit]
  image: alpine:3.19
  tags: [docker]
  script:
    - echo "Would build image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - echo "Registry host $CI_REGISTRY"
```

**Expected result:** the pipeline is **passed**, and the `build-stub` log shows `CI_COMMIT_SHA` (40 hex characters) and the `CI_REGISTRY_IMAGE` path.

If you carried over the tests from [`gitlab-basic/examples/hello-ci`](../gitlab-basic/examples/hello-ci/) — remove `|| true` from ruff.

| Job | Dependency | What it checks |
|-----|-------------|---------------|
| `lint` | — | code style, fail fast |
| `unit` | `needs: [lint]` | business logic |
| `build-stub` | `needs: [unit]` | readiness for docker (echo for now) |

Line by line: `workflow:rules` with `when: never` at the end is the **key** pattern of the course; without it a push to `feature/x` creates a pipeline.

---

## Task 2. Merge Request and the dependency graph

1. Branch `feature/multi-stage-lab`.
2. Commit + push → **Merge Request** into `main`.
3. **CI/CD → Pipelines → Graph**.

**Check:**

| Statement | How to verify |
|-------------|---------------|
| `lint` → `unit` → `build-stub` | `needs` arrows in the graph |
| `build-stub` doesn't start before `unit` | job timestamps |
| A push without an MR doesn't create a pipeline | branch `feature/no-mr`, push, no pipeline |

A screenshot of the graph is for [13-final-project.md](13-final-project.md) and your portfolio.

**Why an MR pipeline:** `CI_PIPELINE_SOURCE == "merge_request_event"` — a separate pipeline with MR context; merging into `main` will trigger a branch pipeline on `main` with deploy (later).

---

## Task 3. Auto-cancel redundant pipelines

**Settings → CI/CD → General pipelines → Auto-cancel redundant pipelines** — enable it.

1. Open an MR.
2. Two quick pushes (`git commit --allow-empty -m "trigger"`).
3. The first pipeline → **canceled**, the second runs.

The standard in a busy monorepo: don't spend runners on a stale commit. On the learning GitLab there is a single runner — the time savings are noticeable.

---

## Task 4. (Optional) Slow down integration

```yaml
integration:
  stage: test
  needs: [lint]
  image: alpine
  tags: [docker]
  script:
    - sleep 30
    - echo "slow test"
```

Confirm: `build-stub` with `needs: [unit]` **does not wait** for `integration` — only for `unit`. A demonstration of the DAG from [01-multi-stage.md](01-multi-stage.md).

Alternative without `needs`: move `integration` into a separate stage `integration-test` **after** `build` — but then build waits for integration. A DAG is more flexible.

---

## Task 5. (Optional) Variables in the log

Add to `build-stub`:

```yaml
  script:
    - echo "SHA=$CI_COMMIT_SHA"
    - echo "REF=$CI_COMMIT_REF_NAME"
    - echo "SOURCE=$CI_PIPELINE_SOURCE"
    - echo "Would build $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

On an MR: `CI_PIPELINE_SOURCE=merge_request_event`. On main after merge: `push` to a protected branch.

---

## What went wrong

### Pipeline pending forever

**Symptom:** yellow icon, no runner.

**Cause:** the tags `[docker]` don't match the runner.

**Fix:** Settings → CI/CD → Runners; `docker ps` — `mock-gitlab-runner` is alive. See [00-environment.md](00-environment.md).

### `build-stub` started before `unit`

**Cause:** you forgot `needs: [unit]`, or both jobs are in the same stage without a dependency.

**Fix:** check `stage:` and `needs:`; in the graph there should be no parallel lint/unit/build without arrows.

### Pipeline on a feature branch without an MR

**Cause:** no `when: never` at the end of `workflow:rules`.

**Fix:** the `workflow` block from task 1.

### ruff fails on an empty repo

**Fix:** `app/__init__.py`, or temporarily `allow_failure: true` on lint.

### YAML invalid

**Cause:** tabs instead of spaces.

**Fix:** CI/CD → Editor → Validate.

### Two pipelines on one push to an MR

**Cause:** GitLab creates both a branch and an MR pipeline (project setting).

**Fix:** Settings → CI/CD → "Merge request pipelines" / disable branch pipelines for MRs — or keep both, but `workflow:rules` will trim the extra ones.

---

## Summary

- Pipeline skeleton: validate → test → build with `needs` and `workflow:rules`.
- MR pipeline — the main review path; main — for deploy (later).
- Auto-cancel — a must-have to save runner time.

---

## Success criteria

- [ ] The DAG `lint` → `unit` → `build-stub` is visible in the pipeline graph
- [ ] `workflow:rules` — pipeline only on MR and `main`
- [ ] Auto-cancel redundant pipelines is enabled and verified
- [ ] The build-stub log has correct `$CI_REGISTRY_IMAGE` and `$CI_COMMIT_SHA`
- [ ] The MR can be merged (pipeline green)

---

## Related material

| Next | Content |
|--------|------------|
| [03-docker-registry.md](03-docker-registry.md) | replace the stub with a real docker build |
| [04-lab-build-push.md](04-lab-build-push.md) | push to the registry |
| [gitlab-basic/04](../gitlab-basic/04-lab-first-pipeline.md) | if you're stuck on the basics |

Next lesson: [03-docker-registry.md](03-docker-registry.md).
