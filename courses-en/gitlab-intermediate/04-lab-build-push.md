# 04. Lab: build and push an image

## Real-world scenario

"Building an image in CI" is a base DevOps skill. The pipeline artifact isn't a jar on the runner's disk, but an **immutable image** in the GitLab Container Registry that Kubernetes picks up. Without a push to the registry, the deploy job has nothing to roll out a Pod from. In this lab you replace `build-stub` from [02-lab-multi-stage.md](02-lab-multi-stage.md) with a real **docker build + push** for [`examples/k8s-deploy/`](examples/k8s-deploy/).

**Preconditions:** [03-docker-registry.md](03-docker-registry.md), a privileged runner (dind), the Dockerfile and `app/` in the repository, GitLab on [`deploy/gitlab`](../../deploy/gitlab/README.md).

## What you'll do

- Prepare the Dockerfile and static files in `app/`.
- Add a `docker-build` job with Docker-in-Docker.
- Confirm that the image appeared in the Registry with the SHA tag.
- Wire build to `needs: [unit]` — fail fast.

---

## Task 1. Project structure

```text
hello-ci/
├── .gitlab-ci.yml
├── Dockerfile
├── .dockerignore
├── app/
│   └── index.html
└── tests/              # optional, from gitlab-basic
    └── test_app.py
```

`app/index.html`:

```html
<!DOCTYPE html>
<html>
<head><title>hello-ci</title></head>
<body><h1>GitLab intermediate lab 04</h1></body>
</html>
```

`Dockerfile` (from [`examples/k8s-deploy/Dockerfile`](examples/k8s-deploy/Dockerfile)):

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY app/ ./app/
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "-m", "http.server", "8080", "--directory", "app"]
```

`.dockerignore`:

```text
.git
.gitlab-ci.yml
tests/
*.md
k8s/
```

`.dockerignore` shrinks the build context — without it `.git` and extra files end up in the image; the build is slower and the image is fatter.

---

## Task 2. Privileged runner (if not done yet)

In the `mock-gitlab-runner` container:

```toml
# /etc/gitlab-runner/config.toml
[[runners]]
  [runners.docker]
    privileged = true
```

```bash
docker restart mock-gitlab-runner
```

Without `privileged`, dind often fails with `Cannot connect to the Docker daemon`. Details: [03-docker-registry.md](03-docker-registry.md).

---

## Task 3. The docker-build job

Add to `.gitlab-ci.yml` (keep the stages and workflow from lab 02):

```yaml
docker-build:
  stage: build
  needs: [unit]
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
    - docker info
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - echo "Pushed $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Remove `build-stub` (`when: never` or delete it) so as not to duplicate the build stage.

**Expected result:** the job is **passed**, and the log shows `Pushed localhost:8929/...`.

| Line | Why |
|--------|-------|
| `services: docker:dind` | sidecar with a Docker daemon |
| `DOCKER_TLS_CERTDIR` | TLS between the cli and dind |
| `docker login` with `CI_REGISTRY_*` | push without the root password |
| tag `$CI_COMMIT_SHA` | immutable for deploy |

---

## Task 4. Check in the UI and locally

1. **Deploy → Container Registry** — an image with tag = the full commit SHA.
2. On the host:

```bash
docker login localhost:8929 -u root -p 'YOUR_ROOT_PASSWORD'
docker pull localhost:8929/root/hello-ci:YOUR_COMMIT_SHA
docker run --rm -p 8080:8080 localhost:8929/root/hello-ci:YOUR_COMMIT_SHA
curl -s localhost:8080 | head
```

3. Pipeline graph — `unit` → `docker-build`. Break a test on purpose — build **must not** start.

---

## Task 5. (Bonus) Branch tags and latest

Add a push of `$CI_COMMIT_REF_SLUG` for non-main; for `main` — optionally `latest` ([03-docker-registry.md](03-docker-registry.md)):

```yaml
    - docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
```

Document the tagging rule in the project README: **deploy by SHA only**.

---

## What went wrong

### `error during connect: Post "http://docker:2376/...`

**Cause:** dind isn't ready or the TLS vars are wrong; the runner isn't privileged.

**Fix:** `privileged = true`; `sleep 5` in `before_script` (temporarily); reconcile `DOCKER_*` with [03-docker-registry.md](03-docker-registry.md).

### `COPY failed: file not found`

**Cause:** there's no `app/` in the repository.

**Fix:** `git add app/`; the context is the root containing the Dockerfile.

### Push 401 Unauthorized

**Cause:** login wasn't performed; the registry is disabled.

**Fix:** Settings → General → Container Registry enabled; check `before_script`.

### The image exists, but pull from the host doesn't work

**Cause:** wrong group/name path.

**Fix:** the pull command from the Registry UI (copy button).

### Build on a failed unit

**Cause:** no `needs: [unit]`.

**Fix:** add `needs` — otherwise fail fast is broken.

### Image 500+ MB

**Cause:** no `.dockerignore`; the whole repository is pulled in.

**Fix:** the `.dockerignore` from task 1; `python:3.12-slim` is already a reasonable base.

---

## Summary

- A real docker build + push replaces the stub; the image in the registry is the entry point for deploy.
- Fail fast via `needs: [unit]`; the SHA tag is the contract with Kubernetes.

---

## Success criteria

- [ ] The image is in the Container Registry with the **commit SHA** tag
- [ ] `docker-build` runs only after a successful `unit`
- [ ] Local `docker pull` and `curl` work
- [ ] `.dockerignore` excludes `.git` and tests
- [ ] The README describes the image tags

---

## Related material

| Next | Content |
|--------|------------|
| [05-deploy-kubernetes.md](05-deploy-kubernetes.md) | how k8s uses the image |
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | deploy to the cluster via [`mockctl`](../../mockctl/README.md) |
| [09-ci-templates.md](09-ci-templates.md) | extract the job into a template |

Next lesson: [05-deploy-kubernetes.md](05-deploy-kubernetes.md).
