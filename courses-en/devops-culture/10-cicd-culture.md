# 10. CI/CD as a cultural contract

## Intro

A pipeline in GitLab is **not** a “build script,” it's a **contract** between the squad and the organization: what must be green before merge, who can touch prod, how we **roll back**.

---

## CI as quality gate

```yaml
# cultural meaning, not syntax
stages:
  - test      # we don't pass garbage downstream
  - build
  - scan      # security — part of Definition of Done
  - deploy
```

| Practice | Culture |
|----------|----------|
| MR only | transparent review |
| Required pipeline | no “bypass urgently” |
| Trunk green | main always deployable |
| Artifact immutability | one build → prod |

Courses: [gitlab-basic](../gitlab-basic/README.md) → [intermediate](../gitlab-intermediate/README.md) → [advanced SAST](../gitlab-advanced/01-security-scanning.md).

---

## CD and responsibility

| Model | Who hits deploy | Culture |
|--------|-----------------|----------|
| **Continuous** | pipeline after merge | high trust + tests |
| **Manual gate** | a person in GitLab | regulated, but the gate must be **fast** |
| **GitOps** | merge to config repo | [gitops-*](../gitops-basic/README.md), audit trail |

“We have CD, but deploy once a month by hand” — **CD theater**.

---

## Environments as a social contract

```text
dev   — break freely (auto deploy)
stage — like prod, for acceptance
prod  — only from pipeline / GitOps
```

Feature flags ([sre/11](../sre/11-change-and-release.md)) separate **deploy** from **release**.

---

## Platform template

Platform publishes a **`.gitlab-ci.yml` include**:

- streams **don't copy** 200 lines;
- streams **don't disable** a security job without an exception process;
- template versioning — **backward compatibility**.

This is **X-as-a-Service** ([chapter 08](08-interaction-modes.md)).

---

## Split CI / CD (maturity)

[gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md): CI builds the image, CD (Argo) syncs the cluster.

| Plus | Minus |
|------|-------|
| clear GitOps audit | two systems to learn |
| rollback via Git | drift detection needed |

Culture: **image** ≠ **config** — different PRs, different reviewers.

---

## Summary

CI/CD reflects **trust**. Without trunk discipline and security in the pipeline, Conway will force **manual** handoffs.

---

## Checklist

- [ ] Is main always green?
- [ ] Does SAST block critical findings?
- [ ] Is deploy to prod possible without SSH to a server?

**Next:** [11. Trust and incidents](11-trust-and-incidents.md).
