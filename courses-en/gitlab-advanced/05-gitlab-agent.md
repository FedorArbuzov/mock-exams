# 05. GitLab Agent for Kubernetes

## Real-world scenario

An audit finds `KUBECONFIG` in a GitLab CI variable with `cluster-admin` rights, no rotation in 18 months. Incident response: "Who last used the kubeconfig in a job log?" There's no answer — the credential is shared across all pipelines. **GitLab Agent** is the platform team's architectural answer.

In [`gitlab-intermediate`](../gitlab-intermediate/README.md) you deployed via `KUBECONFIG` in a protected variable. That works on a training stand, but in production it creates problems:

- **Long-lived credential** with broad rights
- Leakage via job log, artifact, malicious MR
- Rotation is a manual pain
- Inbound access runner → API server through the firewall

Theory of K8s access: [appsec-fundamentals/06-kubernetes-misconfig](../appsec-fundamentals/06-kubernetes-misconfig.md).

---

## What you'll learn

- The GitLab Agent architecture (KAS, outbound tunnel).
- Configuring `ci_access` and a CI job with `environment.kubernetes.agent`.
- A comparison of Agent vs kubeconfig vs Argo CD.
- RBAC and registration token security.

---

## Architecture

```text
┌─────────────┐     outbound      ┌──────────────┐
│  GitLab     │◄──────────────────│ gitlab-agent │
│  (KAS)      │     WSS/gRPC      │  pod in K8s  │
└──────┬──────┘                   └──────┬───────┘
       │                                 │
       │ CI job: kubectl via agent       │ in-cluster
       ▼                                 ▼
┌─────────────┐                   ┌──────────────┐
│ GitLab      │                   │ Kubernetes   │
│ Runner      │                   │ API Server   │
└─────────────┘                   └──────────────┘
```

| Component | Role |
|-----------|------|
| **KAS** (Kubernetes Agent Server) | Bridge GitLab ↔ agent |
| **Agent pod** | Tunnel, operations in the cluster |
| **Agent configuration** | RBAC, `ci_access` in `.gitlab/agents/` |
| **CI job** | `environment:kubernetes:agent` — GitLab provides the context |

**Outbound-only:** the agent pod initiates the connection to GitLab. There's no need to expose the API server to the internet for CI.

---

## Why the platform team needs the Agent

1. **No kubeconfig in CI variables** — smaller blast radius
2. **Outbound-only** — no need to expose the API server to the internet
3. **Multiple environments** from a single agent config
4. **Audit** — operations go through GitLab, tied to project/job

The Agent **does not replace GitOps**: for CD — Argo CD ([11-gitlab-and-argocd.md](11-gitlab-and-argocd.md)). The Agent is appropriate for:

- Training deploy from CI
- Review apps
- `kubectl debug` jobs with limited RBAC

---

## Components in the repository

```text
.gitlab/agents/mockctl/
└── config.yaml
```

```yaml
ci_access:
  projects:
    - id: platform/hello-ci-advanced
      default_namespace: hello-ci
```

`id` — the GitLab project path. `default_namespace` — where to deploy by default.

---

## Installing the agent (outline)

1. **GitLab UI:** Infrastructure → Kubernetes clusters → Connect a cluster (agent)
2. Agent name: `mockctl`
3. Registration token
4. **Helm:**

```bash
helm repo add gitlab https://charts.gitlab.io
helm upgrade --install gitlab-agent gitlab/gitlab-agent \
  --namespace gitlab-agent \
  --create-namespace \
  --set config.token=<TOKEN> \
  --set config.kasAddress=wss://gitlab.example.com/-/kubernetes-agent/
```

5. `kubectl get pods -n gitlab-agent`

More details: [00-environment.md](00-environment.md), [06-lab-agent.md](06-lab-agent.md).

---

## CI job with the agent

```yaml
deploy-review:
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    kubernetes:
      agent: platform/hello-ci-advanced:mockctl
  script:
    - kubectl apply -f k8s/
    - kubectl rollout status deployment/hello-ci -n hello-ci
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

Key point: `environment.kubernetes.agent` — the path `project:agent-name`. GitLab injects the credentials — do **not** store a kubeconfig.

---

## Agent vs kubeconfig in CI

| Criterion | Kubeconfig variable | GitLab Agent |
|----------|---------------------|--------------|
| Credential lifetime | long | session / scoped |
| Network direction | runner → API | agent → GitLab (outbound) |
| Rotation | manual | token reinstall |
| CE / licensing | always | agent in CE *(check the version)* |
| GitOps CD | anti-pattern with Argo | CI ops only |

In [15-final-project.md](15-final-project.md): Agent **or** a "target vs training" doc.

---

## Agent RBAC in the cluster

Principle of least privilege:

- A separate Role on `hello-ci`, not `cluster-admin`
- Production deploy — via Argo, not CI kubectl

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: gitlab-agent-deploy
  namespace: hello-ci
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: edit
subjects:
  - kind: ServiceAccount
    name: gitlab-agent
    namespace: gitlab-agent
```

---

## Relation to GitOps

**Anti-pattern:** `kubectl apply` from CI **and** Argo CD on the same manifests → drift, OutOfSync.

**mock-exams recommendation:**

- Phase 2 (Agent): training deploy to understand the mechanics
- Phase 4: remove `kubectl` from CI, only bump gitops

See [gitops-intermediate/09-split-ci-cd](../gitops-intermediate/09-split-ci-cd.md).

---

## Monitoring and troubleshooting

| Symptom | Check |
|---------|----------|
| Agent disconnected | `kubectl logs -n gitlab-agent`, KAS URL |
| CI: agent not found | The `project:agent` path |
| Permission denied | RBAC Role, namespace in config |
| Works locally, not CI | Runner tags, network to KAS |

---

## Security

- Registration token — **one-time**, not in Git
- Restrict `ci_access.projects`
- Protected environments for production
- MR from a fork — don't grant deploy jobs

Related: [secrets-basic](../secrets-basic/README.md).

---

## Self-check

1. Where does the agent pod physically run?
2. Why is outbound easier for a corporate firewall?
3. How does CI get access without a kubeconfig?
4. When Agent, when Argo CD?
5. Why is `cluster-admin` for the agent a bad idea?

---

## Summary

GitLab Agent removes the long-lived kubeconfig from the pipeline. For production CD — GitOps; the Agent handles scoped CI operations. Practice: [06-lab-agent.md](06-lab-agent.md).
