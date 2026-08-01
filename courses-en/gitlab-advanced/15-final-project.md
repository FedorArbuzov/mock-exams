# 15. Final project: Platform pipeline

## Real-world scenario

Staff engineer at review: "Show me the platform pipeline end-to-end: security gate on the MR, image by SHA, CD only via Argo, no static AWS keys, with a runbook." This capstone is the answer for your portfolio and interviews.

This isn't "just another lab" — it's the assembly of the entire course into a single reproducible stand you can demo in an interview in 10 minutes.

---

## Capstone goal

Build a **production-style** platform pipeline for mock-exams: security gates, OIDC/Agent doc, GitOps CD via Argo, reliability patterns.

**Time:** 4–6 hours.  
**Prerequisites:** phases 1–5, [00-environment.md](00-environment.md).

---

## Target architecture

```text
MR ──► lint, unit test
    ──► SAST + secret detection
    ──► docker build ──► push Registry (tag = CI_COMMIT_SHA)
    ──► container scan (HIGH/CRITICAL fail)

merge main ──► bump gitops repo (staging)
            ──► Argo CD auto-sync staging

manual ──► bump gitops production
        ──► Argo sync production

(optional) MR/main ──► terraform plan via OIDC
```

**CI does not call `kubectl apply`. CD is only Argo.**

---

## Requirements (rubric)

| # | Criterion | Weight |
|---|----------|-----|
| 1 | Security stage blocks critical/high per policy | required |
| 2 | Image in the Registry by `$CI_COMMIT_SHA` | required |
| 3 | CD via Argo (not kubectl from CI) | required |
| 4 | Environments staging + production | required |
| 5 | `include` / templates ([templates/security-pipeline.yml](templates/security-pipeline.yml)) | required |
| 6 | `interruptible` on test; `resource_group` on prod bump | required |
| 7 | OIDC AWS plan **or** `docs/oidc-aws.md` | required |
| 8 | Agent doc **or** `docs/agent-vs-kubeconfig.md` | required |
| 9 | README + CI/CD split diagram | required |
| 10 | `docs/ci-runbook.md` (≥5 scenarios) | required |

---

## Recommended structure

```text
platform-hello-ci/
├── .gitlab-ci.yml
├── .gitlab/ci/
│   ├── security-pipeline.yml
│   └── bump-gitops.yml
├── .gitlab/agents/mockctl/config.yaml   # optional
├── Dockerfile
├── src/
├── docs/
│   ├── architecture.md
│   ├── oidc-aws.md
│   ├── agent-vs-kubeconfig.md
│   ├── ci-runbook.md
│   └── rollback.md
└── README.md
```

GitOps repo:

```text
gitops/
├── apps/hello-ci/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── values-production.yaml
└── argocd/application-hello-ci.yaml
```

---

## Task 1. Security pipeline

```yaml
include:
  - local: .gitlab/ci/security-pipeline.yml

stages: [validate, test, security, build, deploy]
```

MR with an intentional finding → fix → green. Policy in the README.

---

## Task 2. Build and scan

```yaml
docker-build:
  stage: build
  # push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

container-scan:
  extends: .trivy_scan
  allow_failure: false
```

Bump `needs: [container-scan]`.

---

## Task 3. GitOps CD

- `bump-staging` — auto on `main`
- `bump-production` — `when: manual`, `resource_group: production`

Argo Applications for staging/prod.

---

## Task 4. Reliability

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

# test jobs: interruptible: true
```

Runbook from [14-lab-reliability.md](14-lab-reliability.md).

---

## Task 5. architecture.md

1. CI + CD diagram (mermaid/ASCII)
2. Table: who writes to the cluster
3. Links: [appsec-fundamentals](../appsec-fundamentals/README.md), [kuber-advanced](../kuber-advanced/README.md), [aws-advanced](../aws-advanced/README.md)
4. CE limitations and fallbacks

---

## Task 6. Demo scenario (10 min)

1. MR with a feature → security jobs
2. Merge → bump staging
3. Argo UI Synced
4. `kubectl get pods -n hello-ci-staging`
5. Rollback `git revert`
6. (optional) OIDC terraform plan log

---

## Relation to mock-exams artifacts

| Artifact | Source |
|----------|----------|
| App / image | hello-ci |
| Cluster | `mockctl up` |
| Argo | [kuber-advanced/17](../kuber-advanced/17-lab-argocd.md) |
| Security theory | [appsec-fundamentals](../appsec-fundamentals/README.md) |
| Template | [templates/security-pipeline.yml](templates/security-pipeline.yml) |

---

## Common mistakes at submission

| Mistake | Fix |
|--------|-------------|
| `allow_failure: true` on scan | Remove it |
| kubectl + Argo | Remove kubectl |
| `:latest` only | Pin SHA |
| No runbook | `docs/ci-runbook.md` |
| Secrets in Git | Variables + gitleaks |

---

## Self-assessment

- [ ] All 10 rubric criteria
- [ ] [interview-cheatsheet.md](interview-cheatsheet.md) without peeking
- [ ] A colleague can reproduce the stand from the README

---

## Submission

1. GitLab project URL
2. MR history with the security finding fixed
3. Gitops repo link
4. 10-min demo

---

**gitlab-advanced complete.**

GitLab track: [gitlab-basic](../gitlab-basic/README.md) → [gitlab-intermediate](../gitlab-intermediate/README.md) → **gitlab-advanced**.

Interview: [interview-cheatsheet.md](interview-cheatsheet.md) → [16-interview-qa.md](16-interview-qa.md).
