# 06. Build and Container Registry

## Real-world scenario

“It works on my machine” images named `latest` get overwritten. Production needs an **immutable** tag: `$CI_COMMIT_SHA`.

## GitLab Container Registry

On this stand the registry lives with GitLab (`localhost:8929`). In jobs use:

- `$CI_REGISTRY` — registry host  
- `$CI_REGISTRY_IMAGE` — `registry/…/project`  
- `$CI_REGISTRY_USER` / `$CI_REGISTRY_PASSWORD` (or `CI_JOB_TOKEN` where enabled)

Login + build + push (Docker-in-Docker pattern sketch):

```yaml
docker-build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  tags: [docker]
  needs: [lint, unit]
  script:
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

Your runner must allow DinD (privileged / socket — already typical for `mock-gitlab-runner` with docker.sock). Alternatives: Kaniko, buildah (same idea: produce `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`).

## Docker multi-stage

Keep the runtime image small:

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /src
COPY requirements.txt .
RUN pip install --user -r requirements.txt
COPY app ./app

FROM python:3.12-slim
COPY --from=builder /root/.local /root/.local
COPY app ./app
CMD ["python", "-m", "app"]
```

(Adapt to the real example app layout.)

## Checklist

- [ ] Why SHA tags beat `latest` for rollbacks  
- [ ] Where the image appears in the GitLab UI (Deploy → Container Registry)  

## Next

[07 — Lab: build and push](07-lab-build-push.md)
