# 12. Registry: tag, push, pull

## Intro: "the image only exists on my laptop"

CI built `myapp:abc123`, but staging pulls an **old latest** from another machine. You need a **registry** — an HTTP API for storing images by **digest** and **tags**. Locally for the labs — **registry:2** on `localhost:5000`; in a company — GitLab Container Registry ([`gitlab-intermediate/03-docker-registry`](../gitlab-intermediate/03-docker-registry.md)), ECR, Harbor.

## What you'll learn

- The naming **`registry/repository:tag`**.
- The **tag**, **push**, **pull** commands.
- The local registry in [`docker-compose.registry.yml`](../../deploy/containers/docker-compose.registry.yml).
- **Insecure registry** only for the learning localhost.

## Image name

```text
localhost:5000/course/api:1.0.0
│          │      │    └── tag (mutable)
│          │      └── repository (often project/app)
│          └── registry host:port
```

| Part | Example |
|-------|--------|
| Registry | `registry.gitlab.com`, `123.dkr.ecr...amazonaws.com` |
| Repository | `group/project/api` |
| Tag | `sha-abc`, `1.2.3`, `latest` |

A **digest** `sha256:…` is an immutable reference; a tag can point to a different digest after being overwritten.

## DevOps workflow

```mermaid
sequenceDiagram
  participant Dev as Dockerfile
  participant CI as docker build
  participant Reg as Registry
  participant Run as compose/k8s
  Dev --> CI
  CI --> Reg: push tag
  Run --> Reg: pull tag
```

1. `docker build -t myapp:dev .`
2. `docker tag myapp:dev localhost:5000/myapp:dev`
3. `docker push localhost:5000/myapp:dev`
4. On another machine: `docker pull …` and `image: localhost:5000/myapp:dev` in compose.

## Local registry on the stand

```bash
cd deploy/containers
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d
```

The **`mock-registry`** service, port **5000**, volume `registry-data` for blobs.

Check:

```bash
curl -s http://localhost:5000/v2/_catalog
```

## Insecure registry (labs only)

`localhost:5000` without TLS — by default Docker **rejects the push**. Docker Desktop:

**Settings → Docker Engine:**

```json
"insecure-registries": ["localhost:5000"]
```

On Linux — `/etc/docker/daemon.json`. **Do not** use insecure for public registries.

## Authentication (overview)

| Registry | Login |
|----------|--------|
| GitLab CI | `CI_REGISTRY_USER` / `CI_JOB_TOKEN` |
| ECR | `aws ecr get-login-password` |
| Harbor | robot account |

The local registry:2 in the lab — **without auth** (localhost only).

## Link to GitLab CI

A snippet from [03-docker-registry](../gitlab-intermediate/03-docker-registry.md):

```yaml
- docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
- docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
- docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

The same pattern as `tag` + `push` to `localhost:5000`.

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| Push without a tag on the registry host | denied / http/https | full name `host/repo:tag` |
| Forgetting `docker tag` | push the wrong image | an explicit tag |
| `:latest` in prod without a pin | unexpected rollback | SHA or semver |
| Insecure on a real IP | MITM | TLS + certs |
| A huge image | slow push | multistage, slim base |

## In production

- **Immutable tags**: don't overwrite release tags.
- **Retention policy** — cleanup of old layers.
- **Signing** (cosign), **scan** before push ([14-security](14-security.md)).
- Geo-replication of the registry for DR.
- K8s `imagePullSecrets` for a private registry.

## Interview notes

- A registry stores **layers**; a single layer is shared between images.
- `docker manifest inspect` — multi-arch (arm/amd).
- Pull policy in K8s: `IfNotPresent` / `Always`.

## Summary

A registry is the **center of image delivery** between CI, staging and prod. The local `localhost:5000` reproduces tag/push/pull without the cloud. The next lab — push the api image from the stand.

## Checklist

- What does a full image name consist of?
- Why `insecure-registries` on Desktop?
- Where in the repository is the registry overlay?
- How does GitLab CI push an image?

Next lesson: [13. Lab: registry](13-lab-registry.md).
