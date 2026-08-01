# 14. Image security: USER, read-only, secrets, scan

## Intro: a CVE in the base image and root in the container

Security scans the pipeline: `python:3.12` has **critical CVEs**, the api container runs as **root**, and the Dockerfile accidentally has `COPY .env`. The DevOps task is to **reduce the surface**: non-root, a minimal base, secrets outside the image, scan in CI. This chapter covers practices **before Kubernetes** (Pod security — in [`kuber-basic`](../kuber-basic/README.md)). Attack theory and supply chain: [appsec-fundamentals](../appsec-fundamentals/README.md).

## What you'll learn

- **`USER`** and file permissions.
- **Read-only root filesystem** (concept).
- Why **secrets don't go in the image** or in git.
- An overview of **scanning** (Trivy, GitLab Container Scanning).
- The link to [`linux-security`](../linux-security/README.md).

## Non-root user

In [`stack/api/Dockerfile`](../../deploy/containers/stack/api/Dockerfile):

```dockerfile
RUN useradd -m -u 10001 appuser
USER appuser
```

| Root in the container | Non-root |
|-------------------|----------|
| on escape — UID 0 on the host* | limited damage |
| easier to "chmod 777" | explicit permissions on the volume |

\* Depends on seccomp, user namespaces, rootless Docker.

Check:

```bash
docker exec mock-containers-api id
```

## Read-only rootfs

Run (concept, not on the whole stand):

```bash
docker run --read-only --tmpfs /tmp myimage:tag
```

In compose:

```yaml
read_only: true
tmpfs:
  - /tmp
```

The application must write only to **allowed** paths (`/tmp`, a volume). Nginx and Flask — configure logs to stdout (already the case on the stand).

## Secrets

| Anti-pattern | The right way |
|-------------|-----------|
| `ENV API_KEY=secret` in the Dockerfile | runtime: env / secret file |
| `COPY .env` | `.dockerignore` + Vault / K8s Secret |
| secrets in the layer history | mount secret at run; BuildKit secrets |

The course `.dockerignore`: [`examples/.dockerignore`](examples/.dockerignore).

In GitLab — **masked variables** ([`gitlab-basic/07-variables-secrets`](../gitlab-basic/07-variables-secrets.md)).

## Minimal image

| Approach | Effect |
|--------|--------|
| `-slim` / `-alpine` base | fewer packages |
| **multistage** | no compiler in runtime |
| **distroless** | no shell — harder to exploit |

Multistage example: [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage).

## Scanning (overview)

```bash
# with trivy installed
trivy image lab/api:manual
```

GitLab ([`gitlab-advanced/03-container-scanning`](../gitlab-advanced/03-container-scanning.md)):

```yaml
include:
  - template: Security/Container-Scanning.gitlab-ci.yml
```

Pipeline **fail** on Critical — a team policy. Scan **before** pushing to the prod registry.

## Additional measures (briefly)

| Measure | Purpose |
|------|------------|
| `--cap-drop=ALL` | remove Linux capabilities |
| `no-new-privileges` | prohibit escalation |
| Pin base by digest | reproducibility of patches |
| cosign signing | supply chain |
| Don't mount docker.sock | RCE on the host |

## On the stand

```bash
docker inspect mock-containers-api --format 'User={{.Config.User}}'
grep -E 'USER|useradd' deploy/containers/stack/api/Dockerfile
```

You expect `User=appuser` or UID `10001`.

## Common mistakes

| Mistake | Risk | Fix |
|--------|------|-------------|
| `latest` base without updates | CVE | regular rebuild |
| Root + privileged | full host | USER + drop caps |
| Secret in ARG | visible in history | BuildKit `--secret` |
| Ignoring scan in CI | prod with a CVE | gate in the pipeline |
| chmod 777 on a volume | tampering | UID/GID mapping |

## In production

- **Policy**: only images from an approved registry.
- **Admission** (Kyverno): runAsNonRoot, readOnlyRootFilesystem.
- **SBOM** (Syft) for auditing.
- Secret rotation without rebuilding the image.
- Rootless Kubernetes nodes ([`linux-advanced`](../linux-advanced/README.md)).

## Interview notes

- Image layers **don't encrypt** secrets — anyone with pull can see the history.
- Read-only rootfs ≠ read-only volume.
- Scan finds **known** CVEs; zero-day — defense in depth.

## Summary

A secure container is a **minimal image**, **non-root**, **secrets on the outside**, **scan in CI**. The stand api already uses `USER appuser`; the lab will strengthen read-only and check `.dockerignore`.

## Checklist

- What USER does the api have on the stand?
- Why is `ENV PASSWORD` bad in a Dockerfile?
- What does multistage give you?
- Where in GitLab do you enable container scanning?

Next lesson: [15. Lab: security](15-lab-security.md).
