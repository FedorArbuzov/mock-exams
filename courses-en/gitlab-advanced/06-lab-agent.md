# 06. Lab: GitLab Agent (or kubeconfig fallback)

## Real-world scenario

A new platform engineer: "Show me how a deploy job connects to the cluster **without** a kubeconfig in Git or variables." This lab is the answer via the Agent or a documented fallback.

At review yesterday you were asked: "And what if the Agent isn't available in your edition?" — you should be able to explain the risks of the kubeconfig shortcut and the migration path.

---

## Lab goal

Connect **GitLab Agent** to mockctl and deploy `hello-ci` from CI without a kubeconfig in Git. If the Agent isn't available — `docs/agent-vs-kubeconfig.md` with a risk table and a protected `KUBECONFIG` as a training shortcut.

**Time:** ~120 minutes.  
**Prerequisites:** [05-gitlab-agent.md](05-gitlab-agent.md), [00-environment.md](00-environment.md), Helm, `mockctl up`.

---

## Choosing a track

| Track | When |
|------|-------|
| **A — Agent** | GitLab with Kubernetes Agent, token, and KAS |
| **B — Fallback** | Agent can't be installed; KUBECONFIG variable |

Both tracks submit a **diagram** and a deploy pod `Running`.

---

## Track A: GitLab Agent

### Step 1. Agent configuration

```bash
mkdir -p .gitlab/agents/mockctl
```

`.gitlab/agents/mockctl/config.yaml`:

```yaml
ci_access:
  projects:
    - id: platform/hello-ci-advanced
      default_namespace: hello-ci
```

Commit to the default branch.

### Step 2. Create the agent in the GitLab UI

Operate → Kubernetes → Connect a cluster (agent):

- Name: `mockctl`
- **Agent token** (one time)

### Step 3. Helm install

`agent-values.yaml`:

```yaml
config:
  token: "<AGENT_TOKEN>"
  kasAddress: "wss://<gitlab-host>/-/kubernetes-agent/"
```

```bash
kubectl create namespace gitlab-agent
helm repo add gitlab https://charts.gitlab.io
helm upgrade --install gitlab-agent gitlab/gitlab-agent \
  -n gitlab-agent -f agent-values.yaml
kubectl get pods -n gitlab-agent -w
```

UI: agent **Connected**.

### Step 4. Manifests

`k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-ci
  namespace: hello-ci
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello-ci
  template:
    metadata:
      labels:
        app: hello-ci
    spec:
      containers:
        - name: app
          image: registry.example.com/platform/hello-ci:latest
          ports:
            - containerPort: 8080
```

```bash
kubectl create namespace hello-ci
```

### Step 5. CI job

```yaml
deploy-mockctl:
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  environment:
    name: staging
    kubernetes:
      agent: platform/hello-ci-advanced:mockctl
  script:
    - kubectl apply -f k8s/ -n hello-ci
    - kubectl set image deployment/hello-ci app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -n hello-ci
    - kubectl rollout status deployment/hello-ci -n hello-ci --timeout=120s
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Push → `kubectl rollout status` success.

---

## Track B: Fallback (kubeconfig)

### Step 1. Documentation

`docs/agent-vs-kubeconfig.md`:

| | Agent (target) | KUBECONFIG (shortcut) |
|---|--------------|----------------------|
| Credential TTL | scoped | long |
| Leak surface | lower | job env, logs |
| Firewall | outbound | inbound to API |
| Production CD | GitOps (Argo) | anti-pattern |

### Step 2. Protected variable

Settings → CI/CD → Variables:

- Key: `KUBECONFIG_CONTENT` (File type)
- Protected ✓

```yaml
deploy-mockctl:
  before_script:
    - mkdir -p ~/.kube
    - echo "$KUBECONFIG_CONTENT" > ~/.kube/config
  script:
    - kubectl apply -f k8s/
```

**Never** commit a kubeconfig.

---

## Task: diagram in the README

```text
GitLab CI job → GitLab KAS → gitlab-agent pod → Kubernetes API → Deployment hello-ci
```

Track B — a dashed "replace with Agent in production".

---

## Task: RBAC (track A)

```bash
kubectl auth can-i create deployment \
  --as=system:serviceaccount:gitlab-agent:gitlab-agent \
  -n hello-ci
```

Create a Role `deployer` with `apps/deployments` only, if needed.

---

## Task: verify no secrets in Git

```bash
git grep -i kubeconfig
git grep -i "BEGIN CERTIFICATE"
```

Should be empty. The agent token — only in Helm values locally, not in the repo.

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| Agent Pending | Image pull, resources |
| `agent not found` | Typo in `project:agent` |
| Wrong namespace | `default_namespace` |
| ImagePullBackOff | Registry auth |
| KAS connection refused | `kasAddress`, self-signed TLS |

---

## Preparing for phase 4

`docs/notes.md`:

> "Next step: remove kubectl from CI, move to Argo CD bump"

---

## Success criteria

- [ ] Diagram in the README
- [ ] Deploy without a kubeconfig **in Git**
- [ ] `kubectl rollout status` green
- [ ] Pod `hello-ci` Running
- [ ] `docs/agent-vs-kubeconfig.md` (B) or Agent Connected (A)

---

## Reflection questions

1. Where is the registration token and why not commit it?
2. Agent vs [secrets-basic](../secrets-basic/README.md)?
3. Why is Argo needed for production CD?

---

## Summary

The Agent is the target model for CI access to the cluster. A fallback is acceptable on a training stand with documented risks. Next lesson: [07-oidc-cloud.md](07-oidc-cloud.md).
