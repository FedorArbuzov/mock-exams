# 04. Lab: container scan in the pipeline

## Real-world scenario

Platform lead: "Show me a pipeline log where container-scan **blocked** the deploy because of a CRITICAL CVE." This lab is the proof of a gate after build.

Yesterday staging received an image with an outdated `alpine:3.10` — SAST was green, but Trivy would have found a HIGH CVE if the job had been wired up. Today you close this gap.

---

## Lab goal

Add a **container-scan** job after `docker-build`, reproduce a failed pipeline on an outdated base image, update the Dockerfile, and get the scan to pass. Optionally — the GitLab template and SBOM.

**Time:** ~90 minutes.  
**Prerequisites:** [03-container-scanning.md](03-container-scanning.md), a working `docker-build` from intermediate.

---

## Setup

```bash
git checkout -b lab-container-scan
```

Make sure the image is pushed to the GitLab Container Registry (`$CI_REGISTRY_IMAGE`).

Wire up the template from [templates/security-pipeline.yml](templates/security-pipeline.yml):

```yaml
include:
  - local: .gitlab/ci/security-pipeline.yml
```

---

## Task 1. Job after docker-build

```yaml
stages: [test, security, build, deploy]

docker-build:
  stage: build
  image: docker:24
  services: [docker:24-dind]
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

container-scan:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  needs: [docker-build]
  variables:
    TRIVY_USERNAME: $CI_REGISTRY_USER
    TRIVY_PASSWORD: $CI_REGISTRY_PASSWORD
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  allow_failure: false
```

Or `extends: .trivy_scan` from the template.

**DAG check:** the scan starts right after build, doesn't wait for the whole stage.

---

## Task 2. Outdated base image (CVE demo)

```dockerfile
FROM alpine:3.10
RUN apk add --no-cache python3 py3-pip
COPY . /app
WORKDIR /app
```

Commit → pipeline. Record the HIGH/CRITICAL findings in `docs/container-scan-before.txt`.

Update:

```dockerfile
FROM alpine:3.20
```

Rebuild → the scan shows **fewer** findings. Save `docs/container-scan-after.txt`.

---

## Task 3. Severity policy

1. Run with `--severity CRITICAL` only — is the pipeline green with only HIGH?
2. Return `--severity HIGH,CRITICAL` for production.

Document the policy in the README with a severity → action table.

| Severity | Action |
|----------|----------|
| CRITICAL | Block merge/deploy |
| HIGH | Fix or exception |
| MEDIUM | Backlog |

---

## Task 4. Artifact report

```yaml
container-scan:
  script:
    - trivy image --format json -o gl-container-scanning-report.json
        --severity HIGH,CRITICAL "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
    - trivy image --exit-code 1 --severity HIGH,CRITICAL
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  artifacts:
    reports:
      container_scanning: gl-container-scanning-report.json
    expire_in: 30 days
```

---

## Task 5. SBOM (optional)

```yaml
  script:
    - trivy image --format spdx-json -o sbom.spdx.json
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
    - trivy image --exit-code 1 --severity HIGH,CRITICAL
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  artifacts:
    paths: [sbom.spdx.json]
    expire_in: 90 days
```

Answer in `docs/sbom-notes.md`: who needs the file during a CVE incident? See [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md).

---

## Task 6. Deploy gate

```yaml
deploy-staging:
  stage: deploy
  needs: [container-scan, docker-build]
  script:
    - echo "Would deploy ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  environment:
    name: staging
```

Deploy does **not** start on a failed container-scan.

---

## Task 7. .trivyignore with a process

```
# CVE-2024-XXXX — issue #42, review 2025-09-01
CVE-2024-XXXX
```

Without a comment — reject at code review.

---

## Task 8. Trivy cache (optional)

```yaml
container-scan:
  cache:
    key: trivy-db
    paths: [.trivycache/]
  variables:
    TRIVY_CACHE_DIR: .trivycache
```

Speeds up repeated scans on the MR.

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| `401` on pull | `TRIVY_USERNAME` / `TRIVY_PASSWORD` |
| Scan 10+ min | `TRIVY_CACHE_DIR` |
| 0 CVEs on alpine:3.10 | `--severity`, offline DB |
| Job before build | Fix `needs` |
| Scan green, deploy blocked | Check the `needs` chain |

---

## Success criteria

- [ ] `container-scan` after `docker-build` with `needs`
- [ ] Old base → more findings; update → fewer
- [ ] Pipeline fails on CRITICAL/HIGH+CRITICAL
- [ ] Deploy depends on the scan
- [ ] Policy is documented

---

## Related courses

- Supply chain: [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md)
- Image signing: [kuber-advanced/21](../kuber-advanced/21-image-security.md)
- Template: [templates/security-pipeline.yml](templates/security-pipeline.yml)

---

## Summary

Container scan is a gate between build and deploy. Without `needs` and `allow_failure: false` the job is useless. Next lesson: [05-gitlab-agent.md](05-gitlab-agent.md).
