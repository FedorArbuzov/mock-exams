# 07. Variables and masked secrets

## Intro: a real-world scenario

Friday, security review. In an MR, this appeared in `.gitlab-ci.yml`:

```yaml
variables:
  AWS_SECRET_ACCESS_KEY: AKIAIOSFODNN7EXAMPLE
```

The pipeline is green, but **compliance** escalates: the key is in Git forever. A second case: a developer added a masked variable `TOKEN=abc` — but the value is still visible in the log: its length is < 8 characters, so masking didn't kick in. A third: `set -x` in a script prints `export DB_PASS=...`. Team lead: "Secrets go in CI/CD Variables, masked + protected; for rotation, Vault later" ([`secrets-basic`](../secrets-basic/README.md)).

This chapter is about **where** to store config and **how not to leak** into the trace.

## What you'll learn

- Variable levels: project, group, instance.
- Flags: **mask**, **protect**, **expand**, type **File**.
- Using them in `.gitlab-ci.yml` and predefined vars.
- Why masking is **not a 100%** guarantee.
- `CI_JOB_TOKEN` — a built-in, short-lived access token.
- The anti-pattern: secrets in Git.

---

## Where to define variables

| Level | Path in the UI | When |
|---------|-----------|-------|
| **Project** | Settings → CI/CD → Variables | secrets for a single service |
| **Group** | Group → Settings → CI/CD → Variables | shared across the team |
| **Instance** | Admin Area (limited on CE) | global |

Priority on a name conflict: **project** overrides group (see the current GitLab docs — the order may be clarified by scope).

### Adding a variable

1. **Add variable**
2. Key: `APP_VERSION` (or `DATABASE_URL`)
3. Value: a secret or config
4. Flags: Mask, Protect, Expand

---

## Variable flags

| Flag | Effect |
|------|--------|
| **Mask variable** | the value is replaced with `[masked]` in the job log, if GitLab can recognize it |
| **Protect variable** | available only in pipelines on **protected branches/tags** |
| **Expand variable reference** | a `$OTHER` inside the value is expanded |

### Masking limitations

Masking works if:

- the value is **≥ 8 characters**;
- it's a single line;
- the characters are from a limited set (base64-like).

**Not masked:** short passwords, base64 values with newlines, output via `set -x`, `echo $VAR` in some shell debug modes, artifacts, and crash dumps.

**Rule:** don't print secrets in a script; don't enable `set -x` with secrets in the env.

### Protect + an unprotected branch

A variable with `Protect` + a pipeline on a feature branch **without** the protected flag → the variable is **unavailable** (empty or the job skips). This is a feature: prod secrets only on `main` deploy.

---

## Variables in YAML

### Job-level

```yaml
deploy-staging:
  variables:
    APP_ENV: staging
    LOG_LEVEL: debug
  script:
    - echo "Deploy to $APP_ENV with level $LOG_LEVEL"
```

### Global (all jobs)

```yaml
variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

test:
  script:
    - pip install -r requirements.txt
```

### Overriding

A job variable **overrides** a global one with the same key.

---

## Predefined variables (a selection)

| Variable | Purpose |
|----------|------------|
| `CI_JOB_TOKEN` | a JWT for the API/registry on behalf of the job |
| `CI_REGISTRY` | the registry address |
| `CI_REGISTRY_USER` | `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | often = the job token |
| `CI_COMMIT_REF_NAME` | branch or tag name |
| `CI_ENVIRONMENT_NAME` | environment (intermediate) |

### `CI_JOB_TOKEN`

A short-lived token for:

- cloning another **permitted** project;
- pushing to the project registry;
- API calls with a limited scope.

Configuration: **Settings → CI/CD → Job token permissions** (restrict it in prod).

An example of a registry login (intermediate):

```yaml
before_script:
  - echo "$CI_JOB_TOKEN" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
```

---

## File variables

Type **File** — the value is written to a **temporary file**, with the path in the variable:

```yaml
deploy:
  script:
    - kubectl apply --kubeconfig "$KUBECONFIG"
```

In the UI, the `KUBECONFIG` variable (type File) is a multiline kubeconfig. In the job, `$KUBECONFIG=/tmp/CI_BUILD_...`.

Convenient for PEM, kubeconfig, or a JSON service account — no need to escape it in the shell.

---

## Secrets: right and wrong

### Wrong — in Git

```yaml
# BAD — forever in the history
variables:
  AWS_SECRET_ACCESS_KEY: AKIA...
```

Even after deleting it in a new commit — the **history** and forks remain.

### Right — CI/CD Variables

| Key | Mask | Protect |
|-----|------|---------|
| `AWS_ACCESS_KEY_ID` | optional | yes |
| `AWS_SECRET_ACCESS_KEY` | yes | yes |
| `APP_VERSION` | no | no |

In the YAML, only the **name**:

```yaml
build:
  script:
    - echo "Version $APP_VERSION"   # value from the UI, not from the repo
```

### Vault (the next level)

Centralized rotation and audit: [`secrets-basic/08-ci-gitlab-vault`](../secrets-basic/08-ci-gitlab-vault.md), the environment [`deploy/vault`](../../deploy/vault/README.md). The pattern: the job gets the secret at runtime rather than storing it in the GitLab UI for years.

---

## Environment scope (preview)

A variable only for the `production` environment:

```text
Key: DEPLOY_KEY
Environment scope: production
```

Used with `environment:` in a job — [`gitlab-intermediate`](../gitlab-intermediate/README.md).

---

## Connection to DORA and culture

A secrets leak → an incident → **MTTR** rises and trust falls ([`devops-culture/11-trust-and-incidents`](../devops-culture/11-trust-and-incidents.md)). A **generative culture** includes a blameless postmortem and a secrets **process**, not a "hero manually rotating at 3 a.m."

---

## Common mistakes

| Mistake | Consequence | Solution |
|--------|-------------|---------|
| Secret in a commit | leak | rotate + variables |
| Short masked password | visible in the log | length ≥ 8, don't echo |
| `set -x` + export SECRET | leak into the trace | remove -x |
| Protect on a prod var, MR pipeline | an empty deploy | separate vars per env |
| Commit `.env.example` with a real value | leak | placeholders only |
| Public fork + CI variables | risk on SaaS | private fork policies |

---

## Summary

- Secrets go in **Settings → CI/CD → Variables**, not Git.
- **Mask** + **Protect** — the minimum; not a replacement for a security review.
- **File** variables — for multiline credentials.
- **`CI_JOB_TOKEN`** — a job's built-in access to the API/registry with restrictions.
- For enterprise rotation — Vault and policies.

---

## Checklist

- [ ] Does masked guarantee 100% absence from the logs? (no — when?)
- [ ] A Protect variable on an unprotected branch — what happens?
- [ ] Why `CI_JOB_TOKEN`?
- [ ] When is type File better than a string?
- [ ] Where should you NOT store `DATABASE_PASSWORD`?

Next lesson: [08-artifacts-cache.md](08-artifacts-cache.md).
