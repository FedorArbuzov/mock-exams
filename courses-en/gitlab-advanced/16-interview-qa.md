# 16. Interview Q&A: GitLab Advanced / Platform CI/CD

## Intro

In **Platform / DevOps / DevSecOps** interviews they don't ask "list the stages," but about **end-to-end delivery**, how to remove secrets from CI, and why a GitOps split is better than `kubectl apply`. Detailed answers for [interview-cheatsheet.md](interview-cheatsheet.md).

**How to work through this:**

1. Read the question, answer aloud for 1–2 minutes.
2. Compare with the explanation.
3. If you fail — go back to the lesson from "Where in the course".

---

## Block 1. Security scanning

### 1. Describe the security pipeline from commit to deploy.

**Answer.** On the MR: lint/unit test in parallel with SAST and secret detection; dependency scan over lock files. After merge (or on the MR): `docker build` → push image with tag `CI_COMMIT_SHA` → container scan (Trivy) failing on HIGH/CRITICAL. Only after a green scan — bump the image tag in the gitops repo → Argo CD sync staging; production — a manual bump. Critical findings block merge via pipeline must succeed without `allow_failure` on security jobs.

**Where in the course:** [01-security-scanning.md](01-security-scanning.md), [15-final-project.md](15-final-project.md), [templates/security-pipeline.yml](templates/security-pipeline.yml).

---

### 2. SAST vs container scanning?

**Answer.** **SAST** analyzes the source code (injection patterns, unsafe APIs). **Container scan** checks the **built image**: CVEs in OS packages. Clean code can still produce a vulnerable image because of an old `FROM alpine:3.10`. You need both layers.

**Where in the course:** [01](01-security-scanning.md), [03-container-scanning.md](03-container-scanning.md).

---

### 3. Why is `allow_failure: true` on security a bad permanent policy?

**Answer.** The pipeline is green despite a critical — the MR gets merged, the CVE lands in the registry. Acceptable briefly on a pilot. Permanent exceptions: issue + compensating controls + `.trivyignore` with a comment.

**Where in the course:** [01](01-security-scanning.md), [appsec-fundamentals/12](../appsec-fundamentals/12-secure-sdlc.md).

---

### 4. CE GitLab without Ultimate — how to cover security?

**Answer.** `include: template: Security/*` where available; otherwise **Trivy**, **gitleaks**, **pip-audit**. Reports as artifacts. Enforcement via exit code and merge settings.

**Where in the course:** [01](01-security-scanning.md), [02-lab-sast.md](02-lab-sast.md).

---

### 5. Why an SBOM?

**Answer.** A list of the image's components. On a new CVE, quickly find the affected tags. Compliance (SOC2, PCI). `trivy image --format spdx-json`.

**Where in the course:** [03-container-scanning.md](03-container-scanning.md), [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md).

---

## Block 2. GitLab Agent

### 6. Why GitLab Agent instead of a kubeconfig in a CI variable?

**Answer.** A kubeconfig is a long-lived credential; leaks via job, log, artifact. The Agent keeps an **outbound** tunnel to the GitLab KAS; CI uses `environment:kubernetes:agent` without a kubeconfig in variables. Smaller blast radius, simpler firewall.

**Where in the course:** [05-gitlab-agent.md](05-gitlab-agent.md), [06-lab-agent.md](06-lab-agent.md).

---

### 7. Agent vs Argo CD — do they compete?

**Answer.** No. **Argo CD** is CD: desired state in git. **Agent** is for CI jobs with kubectl (review apps, debug). Production CD — Argo only; `kubectl apply` from CI on the same manifests causes drift.

**Where in the course:** [05](05-gitlab-agent.md), [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md).

---

## Block 3. OIDC

### 8. How does GitLab CI get AWS access without static keys?

**Answer.** `id_tokens: AWS_ID_TOKEN` → JWT → `aws sts assume-role-with-web-identity` → the IAM trust policy checks `sub`, `aud` → temp credentials (~1h).

**Where in the course:** [07-oidc-cloud.md](07-oidc-cloud.md), [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

---

### 9. Why a condition on `sub` in the trust policy?

**Answer.** Binding to `project_path`, ref, environment. Least privilege per repo. Without `sub`, any project with a JWT could assume the role.

**Where in the course:** [07-oidc-cloud.md](07-oidc-cloud.md).

---

### 10. OIDC risks for a pipeline from a fork MR?

**Answer.** Unprotected variables + broad trust → an external contributor runs an OIDC job. Mitigation: protected branches, exclude forks (`$CI_MERGE_REQUEST_SOURCE_PROJECT_ID`), a read-only plan role.

**Where in the course:** [07](07-oidc-cloud.md), [08-lab-oidc-aws.md](08-lab-oidc-aws.md), [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md).

---

## Block 4. Runners

### 11. When does the Kubernetes executor pay off?

**Answer.** High CI parallelism, a K8s platform team, job-per-pod isolation. Doesn't pay off for a small team with infrequent builds.

**Where in the course:** [09-runners-kubernetes.md](09-runners-kubernetes.md).

---

### 12. Why CPU/memory limits on K8s runner jobs?

**Answer.** A `docker build` without limits can OOM-kill a node. Limits + ResourceQuota protect the cluster.

**Where in the course:** [09](09-runners-kubernetes.md), [10-lab-k8s-runner.md](10-lab-k8s-runner.md).

---

## Block 5. GitOps split

### 13. Why can't you `kubectl apply` from CI with Argo CD?

**Answer.** Two writers: CI apply vs the git desired state → OutOfSync, selfHeal wars. CI only commits to gitops; Argo is the only sync.

**Where in the course:** [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md), [12-lab-split-ci-cd.md](12-lab-split-ci-cd.md).

---

### 14. Production rollback in GitOps?

**Answer.** `git revert` in the gitops repo → Argo sync. `kubectl rollout undo` is not the source of truth.

**Where in the course:** [12-lab-split-ci-cd.md](12-lab-split-ci-cd.md).

---

### 15. Image tag vs digest?

**Answer.** Tag (`CI_COMMIT_SHA`) — readable. Digest — immutable. SHA tag + registry immutable policy; highest assurance — a digest in gitops.

**Where in the course:** [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md).

---

## Block 6. Reliability

### 16. What does `interruptible: true` do?

**Answer.** A new pipeline cancels running jobs with the flag. Saves runners. Not on deploy/migrations.

**Where in the course:** [13-pipeline-reliability.md](13-pipeline-reliability.md), [14-lab-reliability.md](14-lab-reliability.md).

---

### 17. `resource_group` vs `needs`?

**Answer.** `needs` — DAG within a pipeline. `resource_group` — a mutex across pipelines (a single prod deploy).

**Where in the course:** [13-pipeline-reliability.md](13-pipeline-reliability.md).

---

### 18. Retry on unit tests — when is it OK?

**Answer.** Almost never for `script_failure`. OK for infra failures on docker build. Flaky tests — quarantine.

**Where in the course:** [13](13-pipeline-reliability.md).

---

## Block 7. System design

### 19. A platform pipeline for 50 developers?

**Answer (outline).** Group-level security templates; K8s runners on a dedicated pool; registry retention; gitops RBAC; Argo app-of-apps; staging auto, prod manual + `resource_group`; OIDC per project; Agent for exceptions; Slack on a failed main; fork MRs without secrets/OIDC write; runbook `docs/ci-runbook.md`.

**Where in the course:** [15-final-project.md](15-final-project.md), [README.md](README.md).

---

### 20. The value of DevSecOps in CI for a manager?

**Answer.** Shift-left reduces the cost of a fix; an automatic gate is faster than manual review; audit trail; compliance (SBOM). Metrics: MTTR of critical CVEs, % of failed security MRs.

**Where in the course:** [appsec-fundamentals/01](../appsec-fundamentals/01-intro-devsecops.md), [01-security-scanning.md](01-security-scanning.md).

---

### 21. How are security scan, Agent, OIDC, and Argo connected in one narrative?

**Answer.** Security scan — a gate on the artifact before deploy. Agent/OIDC — remove long-lived credentials from CI. Argo — the only CD writer. Reliability — pipeline predictability. CI produces a verified image and updates git; CD synchronizes the cluster.

**Where in the course:** [15-final-project.md](15-final-project.md), [README.md](README.md).

---

## Summary

After this chapter, tie together **security scanning**, **Agent/OIDC**, **K8s runners**, **Argo split**, and **reliability** into a single narrative for a Platform Engineer interview.

Cheatsheet: [interview-cheatsheet.md](interview-cheatsheet.md).
