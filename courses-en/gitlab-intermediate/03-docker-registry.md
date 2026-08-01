# 03. Docker build and Container Registry

## Real-world scenario

Friday, release day. DevOps: "the image is in the registry under the `latest` tag." You deploy — and production runs **yesterday's** code: someone overwrote `latest` from another branch. Second case: CI fails with `Cannot connect to the Docker daemon` — the runner isn't privileged, dind didn't come up. Third: security asks "why the `/var/run/docker.sock` socket?" — the trade-off between **Docker-in-Docker** and **Kaniko**.

This lesson wires the `build` job from [01-multi-stage.md](01-multi-stage.md) to the **GitLab Container Registry** — the built-in registry on [`deploy/gitlab`](../../deploy/gitlab/README.md) (port 8929).

## What you'll learn

- The `CI_REGISTRY*` variables and authentication via the job token.
- The **docker login → build → tag → push** pattern.
- **Docker-in-Docker** (`services: docker:dind`) on the learning runner.
- The **Kaniko** alternative (no privileged).
- The **image tag** strategy (SHA vs branch vs latest).

---

## GitLab Container Registry

The registry is built into GitLab CE/EE. The image path:

```text
<registry-host>/<namespace>/<project>:<tag>
```

Locally: `localhost:8929/root/hello-ci:abc123def...`

| Variable | Purpose |
|----------|------------|
| `CI_REGISTRY` | the registry hostname (`localhost:8929`) |
| `CI_REGISTRY_IMAGE` | the full path **without a tag** |
| `CI_REGISTRY_USER` | usually `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | the **CI job token** — lives only while the job runs |

**Why the job token:** don't store a long-lived root password in variables; scoped access for the duration of the job.

View: **Deploy → Container Registry** in the project UI.

---

## A minimal build job

```yaml
docker-build:
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
    - docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Line by line:

- `services: docker:dind` — a sidecar with a Docker daemon in the job's network.
- `DOCKER_TLS_CERTDIR` — TLS between the cli and dind (GitLab default pattern).
- The **SHA** tag — the main one for deploy ([05-deploy-kubernetes.md](05-deploy-kubernetes.md)).
- The **ref slug** tag — branch debugging (not for prod).

The Dockerfile from [`examples/k8s-deploy/Dockerfile`](examples/k8s-deploy/Dockerfile) is a minimal Python http.server for the labs.

---

## Docker-in-Docker vs Kaniko

| | Docker dind | Kaniko |
|---|-------------|--------|
| Privileged runner | often **yes** | **no** |
| Docker socket | not needed on the host | not needed |
| Speed | faster with a cache | slower cold start |
| Production | teams move to Kaniko/BuildKit rootless | preferred in locked-down k8s |

The learning [`deploy/gitlab/docker-compose.yml`](../../deploy/gitlab/docker-compose.yml) mounts `docker.sock` into the runner — dind is simpler for the course.

Kaniko (for reference):

```yaml
kaniko-build:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:debug
    entrypoint: [""]
  script:
    - /kaniko/executor
        --context "$CI_PROJECT_DIR"
        --dockerfile Dockerfile
        --destination "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

---

## Configuring the runner for dind

In the `mock-gitlab-runner` container, the file `/etc/gitlab-runner/config.toml`:

```toml
[[runners]]
  [runners.docker]
    privileged = true
```

After editing: `docker restart mock-gitlab-runner`.

**Production:** a privileged runner is a higher-risk zone; isolate it from production secrets.

---

## Tag strategy

| Tag | When | Risk |
|-----|-------|------|
| `$CI_COMMIT_SHA` | deploy, audit, rollback | none |
| `$CI_COMMIT_REF_SLUG` | dev/review | overwritten on a new push |
| `latest` | main only, documentation | **high** |
| semver `v1.2.3` | releases by git tag | low with discipline |

```yaml
  script:
    - |
      if [ "$CI_COMMIT_BRANCH" = "main" ]; then
        docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:latest"
        docker push "$CI_REGISTRY_IMAGE:latest"
      fi
```

Deploy to production **always** by SHA, not by `latest`.

---

## Docker layer cache

```yaml
variables:
  DOCKER_BUILDKIT: "1"
script:
  - docker build --cache-from "$CI_REGISTRY_IMAGE:cache" -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
  - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
  - docker tag "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" "$CI_REGISTRY_IMAGE:cache"
  - docker push "$CI_REGISTRY_IMAGE:cache"
```

On the local CE the cache works, but it isn't required for the course.

---

## Connection to Kubernetes

The [`mockctl`](../../mockctl/README.md) cluster has to **pull** the image from `localhost:8929`. For a private registry — `imagePullSecrets` ([05-deploy-kubernetes.md](05-deploy-kubernetes.md)). Without the secret: `ImagePullBackOff`.

---

## Common mistakes

**`Cannot connect to the Docker daemon`.** dind didn't start; wrong `DOCKER_HOST`; runner not privileged.

**`denied: access forbidden` on push.** `docker login` wasn't called; the registry is disabled in the project.

**The image is huge.** No `.dockerignore`; the base image isn't slim.

**You push only `latest`.** You can't roll back to a specific commit.

**Root password in a CI variable.** Use `CI_REGISTRY_*`.

---

## Summary

- The registry is on the same GitLab instance; login via the job token.
- dind + privileged — the learning path; Kaniko — the production alternative.
- The immutable `$CI_COMMIT_SHA` tag — the contract between CI and the Kubernetes deploy.

---

## Related material

| Material | Relation |
|----------|-------|
| [04-lab-build-push.md](04-lab-build-push.md) | lab with `examples/k8s-deploy/Dockerfile` |
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | deploy by `$CI_COMMIT_SHA` |
| [`deploy/gitlab`](../../deploy/gitlab/README.md) | bringing up the registry |
| [gitlab-advanced](../gitlab-advanced/README.md) | Container Scanning after push |

---

## Checklist

- [ ] You know the four `CI_REGISTRY*` variables
- [ ] You can explain dind vs Kaniko in an interview
- [ ] You understand why deploy is by SHA, not by latest
- [ ] You can read the image path in the Registry UI
- [ ] You know why `privileged` is needed on the learning runner

Next lesson: [04-lab-build-push.md](04-lab-build-push.md).
