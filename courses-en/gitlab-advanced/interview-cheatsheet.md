# GitLab Advanced — Interview Cheatsheet

A reference **after** completing the course. Answer **without peeking**, then check here and in [16-interview-qa.md](16-interview-qa.md).

Course: [README.md](README.md) | Template: [templates/security-pipeline.yml](templates/security-pipeline.yml)

---

## Security scanning

| Question | Answer |
|--------|-------|
| SAST vs container scan | SAST — **code**; container — **image** (OS packages, layers) |
| Why scan before deploy | Cheaper fix; don't let a vulnerable artifact into the cluster |
| Secret detection looks for | Key patterns, entropy; doesn't replace a vault |
| CE without Ultimate | Templates + Trivy + gitleaks/pip-audit fallback |
| `allow_failure: true` on security | Risk of a "green" pipeline with a critical |
| SBOM | Image components; compliance, incident response |
| Exception without allow_failure | Issue + TTL + `.trivyignore` with a comment |
| SAST vs secret detection | Overlap on hardcoded creds; secret is specialized |
| `needs` on security | Fail-fast before the expensive docker build |

**Related:** [appsec-fundamentals](../appsec-fundamentals/README.md) ch. 01, 05, 07–08, 12

---

## GitLab Agent

| Question | Answer |
|--------|-------|
| Why the Agent | No long-lived kubeconfig in CI; outbound to GitLab |
| Where the pod is | A cluster namespace (`gitlab-agent`) |
| CI access | `environment:kubernetes:agent: project:agent-name` |
| vs kubeconfig | Agent — scoped; kubeconfig — blast radius |
| vs Argo CD | Agent — CI ops; Argo — CD desired state from git |
| Registration token | One-time; not in Git |
| KAS | Kubernetes Agent Server — bridge GitLab ↔ agent |
| Outbound tunnel | Agent → GitLab; don't expose the API to the internet |

**Lesson:** [05-gitlab-agent.md](05-gitlab-agent.md)

---

## OIDC GitLab → AWS

| Question | Answer |
|--------|-------|
| Flow | `id_tokens` JWT → `AssumeRoleWithWebIdentity` → temp creds |
| Why the `sub` condition | Restrict project/ref/environment |
| `aud` | Must match in the trust policy and the job |
| Self-hosted | Your own issuer URL in IAM |
| Fork MR risk | Broad trust + unprotected variables |
| vs static keys | Temp TTL ~1h; no secret rotation |
| Separate roles | plan read-only; apply manual + narrow |
| JWT claims | `iss`, `sub`, `aud`, `exp` |

**Related:** [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md), [07-oidc-cloud.md](07-oidc-cloud.md)

---

## K8s runners

| Question | Answer |
|--------|-------|
| K8s vs Docker executor | Job = **pod** vs container on the host |
| Config is stored | Helm values / ConfigMap of the runner chart |
| Runner RBAC | Right to create pods in the CI namespace |
| `privileged` | DinD; security trade-off |
| Limits | cpu/memory_limit protect the cluster |
| Tags | Job routing; without tags — wrong runner |
| ResourceQuota | Restrict pods/CPU in the `gitlab-runner` ns |
| DinD alternative | Kaniko, buildkit rootless |

**Lesson:** [09-runners-kubernetes.md](09-runners-kubernetes.md)

---

## GitOps split (CI ≠ CD)

| Question | Answer |
|--------|-------|
| CI responsibility | build, test, scan, push, **commit to gitops** |
| CD responsibility | Argo sync, health, rollback |
| Anti-pattern | `kubectl apply` + Argo on the same manifests |
| Rollback | `git revert` in gitops, not `kubectl rollout undo` |
| tag vs digest | SHA tag readable; digest immutable |
| Image Updater | Auto bump; less CI glue |
| Pipeline green ≠ deploy OK | Check Argo after a bump |
| selfHeal | Argo reverts manual drift in the cluster |
| Separate gitops repo | RBAC, audit, multi-cluster |

**Related:** [kuber-advanced/16](../kuber-advanced/16-argocd.md), [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md)

---

## Pipeline reliability

| Question | Answer |
|--------|-------|
| `interruptible` | A new pipeline cancels old jobs |
| When not interruptible | Deploy, migrate, side-effect jobs |
| `resource_group` | Mutex — one deploy per env |
| vs `needs` | `needs` — DAG; `resource_group` — cross-pipeline mutex |
| `retry` | Infra failures OK; not flaky unit tests |
| `timeout` | Fail hung jobs |
| Duplicate pipelines | `workflow:rules` + `$CI_OPEN_MERGE_REQUESTS` |
| Runbook | Symptom → check → fix → escalation |

**Lesson:** [13-pipeline-reliability.md](13-pipeline-reliability.md)

---

## DevSecOps connections

| Topic | Course |
|------|------|
| Attacks on CI/CD | [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md) |
| Supply chain | [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md) |
| Container security | [appsec-fundamentals/05](../appsec-fundamentals/05-container-security.md) |
| Secure SDLC | [appsec-fundamentals/12](../appsec-fundamentals/12-secure-sdlc.md) |
| Cloud misconfig | [appsec-fundamentals/09](../appsec-fundamentals/09-cloud-misconfig.md) |
| Secrets | [appsec-fundamentals/04](../appsec-fundamentals/04-secrets-credentials.md) |

---

## Quick YAML recall

```yaml
# Security include
include:
  - template: Security/SAST.gitlab-ci.yml
  - local: .gitlab/ci/security-pipeline.yml

# Container scan gate
container-scan:
  stage: security
  needs: [docker-build]
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# OIDC
id_tokens:
  AWS_ID_TOKEN:
    aud: https://gitlab.com

# Agent deploy
environment:
  kubernetes:
    agent: group/project:agent-name

# GitOps bump
bump-gitops:
  needs: [container-scan, docker-build]
  script:
    - yq -i '.image.tag = strenv(CI_COMMIT_SHA)' values.yaml

# Reliability
interruptible: true
resource_group: production
retry:
  max: 2
  when: [runner_system_failure]
```

---

## Top 10 interview questions

1. Describe the pipeline from commit to production with GitOps.
2. SAST vs Trivy image scan?
3. How to remove AWS keys from GitLab CI?
4. GitLab Agent vs kubeconfig?
5. Why can't you use kubectl with Argo CD?
6. What does `interruptible` do?
7. Security exception without `allow_failure` forever?
8. CE vs Ultimate for security?
9. Fork MR and OIDC — risks?
10. Production rollback in GitOps?

Detailed answers: [16-interview-qa.md](16-interview-qa.md).

---

## Lesson map

| Topic | Lesson |
|------|------|
| Environment | [00](00-environment.md) |
| Security overview | [01](01-security-scanning.md) |
| SAST lab | [02](02-lab-sast.md) |
| Container scan | [03](03-container-scanning.md) |
| Container lab | [04](04-lab-container-scan.md) |
| Agent | [05](05-gitlab-agent.md) |
| Agent lab | [06](06-lab-agent.md) |
| OIDC | [07](07-oidc-cloud.md) |
| OIDC lab | [08](08-lab-oidc-aws.md) |
| K8s runners | [09](09-runners-kubernetes.md) |
| K8s runner lab | [10](10-lab-k8s-runner.md) |
| Argo split | [11](11-gitlab-and-argocd.md) |
| Argo lab | [12](12-lab-split-ci-cd.md) |
| Reliability | [13](13-pipeline-reliability.md) |
| Reliability lab | [14](14-lab-reliability.md) |
| Capstone | [15](15-final-project.md) |
