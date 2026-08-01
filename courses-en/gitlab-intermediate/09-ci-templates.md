# 09. `include` and CI templates

## Real-world scenario

The company has 15 microservices. Each `.gitlab-ci.yml` is a copy-paste of a 40-line `docker-build`. You bump `docker:24` → `docker:26` — editing 15 repositories, and forgetting in three of them. The platform team introduces **group-level templates**: a `platform/ci-templates` repository, projects connect via `include`. An MR into the template — rollout via `ref: v1.3.0`.

Intermediate: **`include`**, **hidden jobs** (`.` prefix), **`extends`** — up to [10-lab-templates.md](10-lab-templates.md).

## What you'll learn

- Why DRY matters for CI and where to store templates.
- The **`include`** syntax (project, local, remote).
- **Hidden jobs** and **`extends`**.
- Versioning `ref` (tag vs branch).
- Limitations and antipatterns.

---

## The copy-paste problem

```text
service-a/.gitlab-ci.yml   ──┐
service-b/.gitlab-ci.yml   ──┼──▶ the same docker-build block
service-c/.gitlab-ci.yml   ──┘
```

A change (dind TLS, login, tags) — **in one place**. Otherwise drift and "service B has the old login".

The same pattern applies to terraform jobs — see [11-terraform-ci.md](11-terraform-ci.md) and [`aws-terraform`](../aws-terraform/README.md).

---

## `include` — connecting files

### From another GitLab project

```yaml
include:
  - project: "platform/ci-templates"
    ref: v1.2.0
    file:
      - "/jobs/docker-build.yml"
      - "/jobs/terraform-plan.yml"

stages:
  - test
  - build

unit:
  extends: .pytest
  stage: test
```

`project` — the `group/subgroup/repo` path. `ref` — a branch, tag, or SHA.

### A local file

```yaml
include:
  - local: "ci/docker-build.yml"
  - local: "ci/deploy-k8s.yml"
```

Convenient for a monorepo and for learning without a second GitLab project.

### Remote (with caution)

```yaml
include:
  - remote: "https://example.com/ci/base.yml"
```

A supply-chain risk — often forbidden in enterprise.

---

## Hidden job and `extends`

File `ci/docker-build.yml`:

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
```

A name with a **`.`** — the job isn't created (a hidden template).

```yaml
build-app:
  extends: .docker-build
  needs: [unit]
```

`extends` **merges** keys; the child overrides the parent.

---

## Versioning templates

| ref | Pro | Con |
|-----|------|-------|
| `main` | always fresh | breaks without warning |
| `v1.2.0` tag | reproducibility | needs a release process |
| commit SHA | pinned forever | inconvenient to update |

**Recommendation:** a semantic tag; services update `ref` via a deliberate MR.

---

## Composition with stages and rules

An included file doesn't have to declare `stages` — they live in the root. A hidden job specifies `stage: build` — the stage must exist.

**Important:** `rules` in the child job **fully replace** the parent's, they don't merge.

---

## `!reference` (briefly)

```yaml
.script-docker-login:
  - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"

build:
  before_script:
    - !reference [.script-docker-login]
```

An alternative to `extends` for small fragments.

---

## Antipatterns

**A God template** at 500 lines.

**A cyclic extends** — GitLab will reject it.

**Secrets in the template repo** — variables only.

**include without a pinned ref** — sudden breakages.

---

## Connection to Terraform and deploy

```text
platform/ci-templates/
├── jobs/
│   ├── docker-build.yml
│   ├── deploy-k8s.yml
│   └── terraform-plan.yml
```

[11-terraform-ci.md](11-terraform-ci.md) — `.terraform-plan`; [08-lab-environments.md](08-lab-environments.md) — `.deploy-base`.

---

## Common mistakes

**`extends` job not found`** — a typo; a wrong include path.

**Included pipeline invalid** — run the YAML lint in GitLab.

**Template breaking change without a major tag** — a contract violation.

---

## Summary

- `include` + `extends` — DRY for docker build, deploy, terraform.
- Hidden jobs (`.` prefix) — templates without extra jobs in the graph.
- Pin `ref` to a tag — stability for production services.

---

## Related material

| Material | Relation |
|----------|-------|
| [10-lab-templates.md](10-lab-templates.md) | lab on local include |
| [03-docker-registry.md](03-docker-registry.md) | the template contents |
| [11-terraform-ci.md](11-terraform-ci.md) | terraform template |

---

## Checklist

- [ ] `include` project vs local vs remote
- [ ] Hidden job — why the dot in the name
- [ ] `extends` overrides the parent's fields
- [ ] Why `ref: v1.0.0`, not `main`
- [ ] Secrets not in the template YAML

Next lesson: [10-lab-templates.md](10-lab-templates.md).
