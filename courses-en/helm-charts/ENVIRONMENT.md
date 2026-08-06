# Environment for Helm Charts

Same base as [`kuber-basic/ENVIRONMENT.md`](../kuber-basic/ENVIRONMENT.md): **Docker Desktop Kubernetes** + courses UI.

## Setup

1. [QUICKSTART.md](../../QUICKSTART.md) → http://127.0.0.1:8091/
2. Install Helm 3:

```bash
# macOS
brew install helm
# Windows
winget install Helm.Helm
# Linux
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

helm version
```

3. Context:

```bash
kubectl config use-context docker-desktop
kubectl get nodes
```

## Working directory

Labs assume a scratch dir:

```bash
mkdir -p ~/helm-work && cd ~/helm-work
```

Use a dedicated namespace per lab (`lab-helm`, `lab-helm-deps`, …) and delete it when done.

## Optional tools

| Tool | When |
|------|------|
| `helm plugin install https://github.com/databus23/helm-diff` | nicer upgrade diffs (optional) |
| Docker | required for the local OCI registry lab (14) |

## Sanity commands

```bash
helm create scratch && rm -rf scratch
helm lint ./some-chart
helm template demo ./some-chart --debug | head
```
