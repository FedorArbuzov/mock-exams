# 10. Lab: docker-build template

## Real-world scenario

Platform engineering: "one PR into `ci-templates` — and all services get the patched dind config." On the learning GitLab, **`include: local`** in `hello-ci` is enough. The pattern is identical to production group-level templates; only `project:` and `ref:` change. Without templates, 15 microservices = 15 copies of `docker login` — drift is inevitable.

**Preconditions:** [09-ci-templates.md](09-ci-templates.md), a working `docker-build` from [04-lab-build-push.md](04-lab-build-push.md).

## What you'll do

- Extract `.docker-build` into `ci/docker-build.yml`.
- Connect it via `include: local`.
- Rename the job to `build-image` with `extends`.
- Change the template and confirm the pipeline picks up the change without editing the root script.

---

## Task 1. The template file

Create `ci/docker-build.yml`:

```yaml
.docker-build:
  stage: build
  image: docker:24-cli
  services:
    - name: docker:24-dind
      alias: docker
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_VERIFY: "1"
    DOCKER_CERT_PATH: "$DOCKER_TLS_CERTDIR/client"
  tags: [docker]
  before_script:
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - docker images | head -5
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

The name `.docker-build` with a dot is a **hidden job**; GitLab doesn't create a job in the pipeline.

`docker images | head -5` — intentional for task 3 (visibility of changes in the log).

---

## Task 2. The root `.gitlab-ci.yml`

```yaml
include:
  - local: ci/docker-build.yml

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
    - pip install --quiet ruff && ruff check . || true

unit:
  stage: test
  needs: [lint]
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install --quiet pytest
    - |
      if [ -d tests ]; then pytest -q; else echo "skip"; fi

build-image:
  extends: .docker-build
  needs: [unit]

# deploy-staging / deploy-production from lab 08
```

Remove the inline `docker-build`. **CI/CD → Editor → Validate** — valid.

**Expected result:** pipeline green, a `build-image` job, an image in the registry on [`deploy/gitlab`](../../deploy/gitlab/README.md).

| Element | Role |
|---------|------|
| `include: local` | connect YAML from the repository |
| `extends: .docker-build` | inherit dind, login, push |
| `needs: [unit]` | override just the dependencies |

---

## Task 3. Changing the template

In `ci/docker-build.yml` add to `script`:

```yaml
    - echo "Template version 2 — build OK"
```

Commit. The `build-image` log shows the new line **without** copying the script into the root `.gitlab-ci.yml`.

That's the value proposition of templates: a single source of truth.

---

## Task 4. (Bonus) Group project

Create a `platform` group, a `ci-templates` project, and copy `ci/docker-build.yml` to `/jobs/docker-build.yml`.

In the service:

```yaml
include:
  - project: platform/ci-templates
    ref: v1.0.0
    file: /jobs/docker-build.yml
```

After the first stable release — tag `v1.0.0`. Don't pin to `main` in production ([09-ci-templates.md](09-ci-templates.md)).

---

## Task 5. (Bonus) Deploy template

Extract `.deploy-base` from [08-lab-environments.md](08-lab-environments.md) into `ci/deploy-k8s.yml`:

```yaml
include:
  - local: ci/docker-build.yml
  - local: ci/deploy-k8s.yml
```

The root file stays thin: stages, workflow, lint, unit, extends.

---

## What went wrong

### `extends: .docker-build` — job not found

**Cause:** a wrong `local:` path; the file isn't in git.

**Fix:** `git add ci/docker-build.yml`; the path is `ci/docker-build.yml` with no leading `/`.

### Duplicate job names

**Cause:** the old `docker-build` + `build-image`.

**Fix:** remove the inline job entirely.

### Include invalid YAML

**Fix:** CI lint; yamllint locally.

### The template change isn't visible

**Cause:** you're looking at the old pipeline.

**Fix:** a new pipeline on the HEAD commit.

### `extends` doesn't override `rules`

**Cause:** the child job must explicitly set `rules` if it needs different behavior.

**Fix:** merging rules in the child job fully overwrites the parent's (not a merge).

---

## Summary

- `include: local` — the first step toward platform-wide templates.
- A change in `ci/` — one commit instead of editing 15 repositories.

---

## Success criteria

- [ ] `include: local: ci/docker-build.yml` works
- [ ] `build-image` extends `.docker-build`
- [ ] A change only in `ci/` is reflected in the pipeline
- [ ] No duplication of the docker script in the root
- [ ] (Bonus) a second include for deploy

---

## Related material

| Next | Content |
|--------|------------|
| [11-terraform-ci.md](11-terraform-ci.md) | template for terraform |
| [13-final-project.md](13-final-project.md) | include in the final project |

Next lesson: [11-terraform-ci.md](11-terraform-ci.md).
