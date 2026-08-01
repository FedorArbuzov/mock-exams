# 00. Environment: security lab, Agent, Argo CD, OIDC

## Real-world scenario

Monday, 10:00. Security opens an MR in the platform repo: "Why is there no SAST in the pipeline? And why does the deploy job pull `KUBECONFIG` from a variable?" You open `.gitlab-ci.yml` — there is `docker build` and `kubectl apply`, but no security stage. A second ticket: "Argo shows OutOfSync, but CI already 'deployed' yesterday" — a classic **double truth**: both GitLab CI and Argo CD change the cluster.

A third question from FinOps: "The variables hold `AWS_SECRET_ACCESS_KEY` with rotation once a year" — an anti-pattern that this course closes out via **OIDC**.

This lesson establishes a **single environment** for all gitlab-advanced labs. Without it, every lab would "fix" GitLab or the cluster from scratch.

---

## What you'll set up

| Component | Why in the course | Lesson |
|-----------|----------------|------|
| GitLab CE + Docker runner | CI: build, scan, bump gitops | [01](01-security-scanning.md)–[04](04-lab-container-scan.md) |
| `mockctl up` | Target Kubernetes for Agent / Argo | [05](05-gitlab-agent.md)–[12](12-lab-split-ci-cd.md) |
| Argo CD (namespace `argocd`) | Phase 4: CD only from git | [11](11-gitlab-and-argocd.md) |
| (optional) AWS dev account | Phase 2: OIDC lab 08 | [07](07-oidc-cloud.md) |
| Security pipeline template | DRY for SAST + Trivy | [templates/security-pipeline.yml](templates/security-pipeline.yml) |

---

## Prerequisite courses (checklist)

- [ ] [`gitlab-intermediate`](../gitlab-intermediate/README.md) — pipeline with build/push and deploy completed
- [ ] [`kuber-advanced`](../kuber-advanced/README.md) phase 3 — [16-argocd.md](../kuber-advanced/16-argocd.md), [17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md)
- [ ] [`appsec-fundamentals`](../appsec-fundamentals/README.md) ch. 01, 07–08 — DevSecOps and attacks on CI
- [ ] [`aws-advanced`](../aws-advanced/README.md) — OIDC trust policy ([06-lab-oidc-ci.md](../aws-advanced/06-lab-oidc-ci.md))

---

## GitLab CE: security lab

Stand: [`deploy/gitlab`](../../deploy/gitlab/README.md).

```bash
cd deploy/gitlab
docker compose up -d
docker exec mock-gitlab gitlab-ctl status   # wait for run:
```

| Parameter | Typical value |
|----------|-------------------|
| URL | `http://localhost:8929` |
| Runner | Docker executor, `privileged: true` for `docker build` |
| Registry | Project's built-in Container Registry |
| Root password | see `deploy/gitlab/README.md` |

**Security readiness check:**

1. Group `platform`, project `hello-ci-advanced` (or the pet-project from intermediate).
2. Pipeline with `docker build` — image in the Registry.
3. Settings → CI/CD → Variables: do **not** add AWS keys "for the future".
4. Settings → Merge requests → "Pipelines must succeed" — enable it in advance.

### Security templates in CE

In CE the set of [security templates](https://docs.gitlab.com/ee/user/application_security/) may differ from Ultimate. See [01-security-scanning.md](01-security-scanning.md) — CE vs Ultimate table and fallback (`pip-audit`, `trivy fs`, gitleaks).

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
```

If a template is unavailable — use the open-source jobs from lab 02.

### Recommended group structure

```text
platform/
├── hello-ci-advanced/     # app repo, CI pipeline
├── gitops/                # manifests for Argo CD (phase 4)
└── infra-terraform/       # optional, OIDC lab 08
```

Copy the security pipeline template **before** the first lab:

```bash
mkdir -p .gitlab/ci
cp courses/gitlab-advanced/templates/security-pipeline.yml .gitlab/ci/security-pipeline.yml
```

---

## Kubernetes: mockctl

```bash
mockctl up
kubectl get nodes
kubectl create namespace gitlab-agent
kubectl create namespace gitlab-runner
kubectl create namespace argocd
kubectl create namespace hello-ci
```

The cluster is needed for: **GitLab Agent** (phase 2), **Kubernetes runner** (phase 3), **Argo CD** (phase 4).

**GitLab ↔ cluster networking:** GitLab in Docker, mockctl on the host — the Helm URL may be `https://host.docker.internal:6443`. See [`mockctl`](../../mockctl/README.md).

| Namespace | Purpose |
|-----------|------------|
| `gitlab-agent` | GitLab Agent pod |
| `gitlab-runner` | Runner manager + job pods |
| `argocd` | Argo CD control plane |
| `hello-ci` | Training application |

---

## GitLab Agent: prerequisites

Theory: [05-gitlab-agent.md](05-gitlab-agent.md). Checklist **before** lab 06:

| Step | Action |
|-----|----------|
| 1 | Operate → Kubernetes → Connect cluster (agent) |
| 2 | File `.gitlab/agents/mockctl/config.yaml` in the app repo |
| 3 | Registration token for the agent (one-time) |
| 4 | `helm repo add gitlab https://charts.gitlab.io` |
| 5 | `helm upgrade --install gitlab-agent gitlab/gitlab-agent -n gitlab-agent -f agent-values.yaml` |

```yaml
# .gitlab/agents/mockctl/config.yaml
ci_access:
  projects:
    - id: platform/hello-ci-advanced
      default_namespace: hello-ci
```

```yaml
# agent-values.yaml (training)
config:
  kasAddress: wss://localhost:8929/-/kubernetes-agent/
  token: <AGENT_TOKEN>
```

Self-hosted: replace `kasAddress` with your host.

**Connection check:**

```bash
kubectl get pods -n gitlab-agent
# GitLab UI → Infrastructure → Kubernetes clusters → Connected
```

**Fallback in CE:** protected variable `KUBECONFIG` (from intermediate) + a mandatory "target architecture vs training shortcut" table in `docs/agent-vs-kubeconfig.md`.

---

## Argo CD in mockctl

Installation: [kuber-advanced/17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md), [`deploy/gitops`](../../deploy/gitops/README.md).

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deploy/argocd-server -n argocd --timeout=300s
kubectl port-forward svc/argocd-server -n argocd 8080:443
# https://localhost:8080  user: admin
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d && echo
```

**For phase 4:** gitops repo, Application `hello-ci` with `automated.syncPolicy` ([11-gitlab-and-argocd.md](11-gitlab-and-argocd.md)).

**Principle:** CI does **not** run `kubectl apply` on production manifests — only a commit with a new image tag.

```text
App repo (CI) ──build/push──► Registry
         │ bump tag
         ▼
GitOps repo ──watch──► Argo CD ──sync──► hello-ci namespace
```

---

## OIDC: overview (GitLab → AWS)

Theory: [07-oidc-cloud.md](07-oidc-cloud.md). In brief:

```text
GitLab job → id_tokens (JWT) → AWS STS AssumeRoleWithWebIdentity
    → temp credentials (~1 h) → aws cli / terraform plan
```

| Element | Where it's configured |
|---------|-------------------|
| OIDC provider | AWS IAM → Identity providers |
| Trust policy | IAM Role → `gitlab.com:sub` = `project_path:...` |
| Job | `.gitlab-ci.yml` → `id_tokens: AWS_ID_TOKEN` |

Self-hosted GitLab: your own issuer URL in the trust policy. Lab 08 is **optional** without AWS — `docs/oidc-aws.md` modeled on [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

**Fork MR:** do not grant an OIDC role on unprotected branches; use `rules:` and protected environments.

Related to [appsec-fundamentals/04-secrets-credentials](../appsec-fundamentals/04-secrets-credentials.md): a masked variable ≠ safety from a malicious maintainer.

---

## Pet-project structure

```text
hello-ci-advanced/
├── .gitlab-ci.yml
├── .gitlab/ci/security-pipeline.yml
├── .gitlab/agents/mockctl/config.yaml
├── Dockerfile
├── src/
├── k8s/              # Agent track only; not the Argo path
└── docs/
    ├── oidc-aws.md
    ├── agent-vs-kubeconfig.md
    └── ci-runbook.md
```

---

## Common problems

| Symptom | Check |
|---------|----------|
| SAST template not found | CE version; fallback lab 02 |
| `docker build` 403 Registry | `docker login`, CI job token |
| Agent won't connect | `kasAddress`, outbound firewall, token |
| Argo OutOfSync | CI and Argo both change manifests — leave a single CD |
| OIDC `Not authorized` | `sub` in trust policy, `aud` in job |
| Runner can't see GitLab | `host.docker.internal` vs host IP |

---

## Self-check

1. Does the pipeline with the `security` stage run on an MR?
2. `kubectl get pods -n argocd` — is Argo CD Running?
3. Where in the project should there be **no** plaintext secrets?
4. Who owns the cluster's desired state after phase 4 — GitLab CI or git?
5. How does OIDC differ from a protected AWS variable?

---

## Summary

A single environment: GitLab CE + mockctl + (optionally) Argo CD + security template. Agent and OIDC remove long-lived credentials. Argo CD is the only CD after phase 4.

Next lesson: [01-security-scanning.md](01-security-scanning.md).
