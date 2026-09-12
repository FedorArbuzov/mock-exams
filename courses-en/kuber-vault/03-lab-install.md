# 03. Lab: install Vault

## Goal

Install HashiCorp Vault (dev) + Agent Injector into namespace `vault`.

## Prerequisites

- [ENVIRONMENT.md](ENVIRONMENT.md) — cluster Ready, Helm installed  

## Task 1. Helm install

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

helm upgrade --install vault hashicorp/vault \
  --namespace vault --create-namespace \
  --set "server.dev.enabled=true" \
  --set "server.dev.devRootToken=root" \
  --set "injector.enabled=true" \
  --set "csi.enabled=false"
```

```bash
kubectl -n vault get pods -w
# vault-0 Ready; vault-agent-injector-* Ready — then Ctrl+C
```

## Task 2. Status

```bash
kubectl -n vault exec vault-0 -- vault status
```

Expect **Sealed: false**, **Version** printed.

## Task 3. UI (optional)

```bash
kubectl -n vault port-forward svc/vault 8200:8200
# http://127.0.0.1:8200/ui  — Method: Token — root
```

## Success criteria

- [ ] `helm list -n vault` shows `vault`  
- [ ] `vault-0` and injector pods Ready  
- [ ] Interactive Check passes  

Do **not** uninstall — later labs need this release.

Next: [04. KV and policy](04-kv-and-policy.md).
