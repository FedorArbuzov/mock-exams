# 09. Lab: inject a secret into a Pod

## Goal

Deploy `checkout` in namespace `checkout` with Injector annotations; confirm `/vault/secrets/db` inside the Pod.

## Prerequisites

- Lessons 05 and 07 done (KV + policy + k8s auth role)  
- Vault + injector Running  

## Task 1. Apply Deployment

`checkout.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout
  namespace: checkout
spec:
  replicas: 1
  selector:
    matchLabels:
      app: checkout
  template:
    metadata:
      labels:
        app: checkout
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "checkout-app"
        vault.hashicorp.com/agent-inject-secret-db: "secret/data/checkout/db"
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "secret/data/checkout/db" -}}
          password={{ .Data.data.password }}
          user={{ .Data.data.user }}
          {{- end -}}
    spec:
      serviceAccountName: checkout-app
      containers:
        - name: app
          image: busybox:1.36
          command: ["sh", "-c", "while true; do echo alive; sleep 30; done"]
```

```bash
kubectl apply -f checkout.yaml
kubectl -n checkout get pods
kubectl -n checkout describe pod -l app=checkout | head -80
```

Expect an init container `vault-agent-init` (and often a `vault-agent` sidecar).

## Task 2. Read the injected file

```bash
POD=$(kubectl -n checkout get pod -l app=checkout -o jsonpath='{.items[0].metadata.name}')
kubectl -n checkout exec "$POD" -c app -- cat /vault/secrets/db
```

Expect `password=lab-pass-2026` (and user).

## Success criteria

- [ ] Pod Running (app container)  
- [ ] File `/vault/secrets/db` present  
- [ ] Interactive Check passes (annotations + SA)  

Next: [10. Delivery patterns](10-delivery-patterns.md).
