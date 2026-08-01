# 03. Container scanning

## Real-world scenario

SAST passed on the MR — "the code is clean." After deploy, the security scanner in the registry finds **47 HIGH CVEs** in the base image `alpine:3.10`. The developer: "But we didn't change anything in Python!" Container scanning closes out the **artifact security** layer.

Theory: [`appsec-fundamentals/05-container-security`](../appsec-fundamentals/05-container-security.md), [`containers-basic/14-security`](../containers-basic/14-security.md).

---

## What you'll learn

- What a container scanner analyzes vs SAST.
- Why scan after build and push.
- Trivy in GitLab CE and the GitLab template.
- Severity policy, SBOM, and pipeline optimization.

---

## What a container scanner scans

| Analysis layer | Examples |
|--------------|---------|
| OS packages | `apk`, `apt`, `rpm` in the base image |
| Language-specific | `pip install` in the Dockerfile |
| Misconfig | `USER root`, open ports |
| Secrets in layers | Files in layer history |

```text
Dockerfile → layers → IMAGE → Trivy / Grype → HIGH/CRITICAL → fail?
```

SAST only sees the source. Container scan sees the **build result** — including vulnerabilities in the base image that the developer never touched.

---

## Why scan after build and push

1. **Accuracy:** the real production artifact is scanned, including multi-stage.
2. **Registry as source:** the job pulls the image by tag/digest from the GitLab Registry.
3. **Deploy gate:** deploy `needs: [container-scan]`.

An alternative is to scan the tar before push; for the training stand it's simpler to use `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA` after push.

| Scan moment | Pros | Cons |
|-------------|-------|--------|
| After push | Accurate artifact, registry auth | Image is already in the registry |
| Before push (tar) | Early fail | Harder setup |
| In the registry (cron) | Doesn't block CI | Late feedback |

For mock-exams: scan in the pipeline with `needs: docker-build`.

---

## Trivy in CI (universal pattern)

```yaml
container-scan:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  needs:
    - job: docker-build
  variables:
    TRIVY_USERNAME: $CI_REGISTRY_USER
    TRIVY_PASSWORD: $CI_REGISTRY_PASSWORD
  script:
    - trivy image
        --exit-code 1
        --severity HIGH,CRITICAL
        --no-progress
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  allow_failure: false
```

| Flag | Meaning |
|------|-------|
| `--exit-code 1` | Failed job → failed pipeline |
| `--severity HIGH,CRITICAL` | Policy |
| `--ignore-unfixed` | Don't fail on a CVE without a patch *(a deliberate risk)* |

Template: [templates/security-pipeline.yml](templates/security-pipeline.yml).

---

## GitLab Container Scanning template

```yaml
include:
  - template: Security/Container-Scanning.gitlab-ci.yml
```

Requirements: image in the registry, `CI_REGISTRY_*`, the job `needs` build.

```yaml
artifacts:
  reports:
    container_scanning: gl-container-scanning-report.json
```

In CE the report may only be in artifacts — use `expire_in` for auditing.

---

## Severity policy

| Severity | Action |
|----------|----------|
| **CRITICAL** | Block merge and deploy |
| **HIGH** | Fix or documented exception |
| **MEDIUM** | Backlog |
| **LOW** | Inform |

**`allow_failure: true`** is the equivalent of "we deploy blind." Acceptable on a pilot with a deadline.

### Exception process

1. Issue with a CVE ID
2. Review date
3. `.trivyignore` with a comment and a link to the issue

---

## SBOM and supply chain

```bash
trivy image --format spdx-json -o sbom.spdx.json $IMAGE
```

Related: [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md), [kuber-advanced/21-image-security](../kuber-advanced/21-image-security.md).

```yaml
  artifacts:
    paths:
      - gl-sbom.spdx.json
    expire_in: 90 days
```

On a new CVE, the SBOM lets you quickly find the affected image tags.

---

## Pipeline optimization

| Technique | Effect |
|-------|--------|
| `needs: [docker-build]` | Don't wait for the whole stage |
| Trivy DB cache | `TRIVY_CACHE_DIR` |
| Scan by digest | Immutable reference |
| Parallel scan + tests | DAG |

```yaml
  cache:
    key: trivy-db
    paths: [.trivycache/]
  variables:
    TRIVY_CACHE_DIR: .trivycache
```

---

## Base image hygiene

- **Distroless** / minimal images
- Pin digest: `FROM alpine:3.20@sha256:...`
- Multi-stage: runtime without the compiler
- Regular rebuild of `main`

Lab [04](04-lab-container-scan.md): `alpine:3.10` → `3.20` reduces the CVE count.

---

## Container scan vs dependency scan in the repo

| | `trivy fs` / pip-audit | `trivy image` |
|---|------------------------|---------------|
| Object | lock files | the built image |
| CVEs in the base OS | no | yes |
| "Extra pip in the Dockerfile" | partially | yes |

Use **both** for defense in depth.

---

## Registry authentication in CI

A Trivy pull from a private registry requires credentials:

```yaml
variables:
  TRIVY_USERNAME: $CI_REGISTRY_USER
  TRIVY_PASSWORD: $CI_REGISTRY_PASSWORD
```

Without auth — `401 Unauthorized` and a false sense of "0 CVEs" (the scan didn't run).

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Scan before push | `unable to find image` |
| No registry auth | 401 |
| `latest` tag only | Unclear what's in prod |
| Ignoring all CVEs | A useless job |
| Scan only on main | The vuln in the MR is already merged |

---

## Self-check

1. SAST vs Trivy image scan?
2. Why scan after push?
3. The risk of `allow_failure: true`?
4. Why an SBOM?
5. Pin digest vs `:latest`?

---

## Summary

Container scanning is a mandatory gate after build. Trivy in CE gives parity at the level of CVE detection; policy matters more than the scanner brand. Practice: [04-lab-container-scan.md](04-lab-container-scan.md).
