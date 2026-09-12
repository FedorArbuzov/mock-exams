# 01. Why Vault in Kubernetes

## Scenario

A password lives in a Kubernetes Secret (base64 in etcd). Anyone with `get secrets` in the namespace can read it; rotation means editing YAML and restarting Pods; there is little audit of “who fetched the DB password at 03:12.”

Vault keeps the **source of truth**, issues short-lived credentials (or reads of KV), and ties access to a **ServiceAccount** via Kubernetes auth.

## What this course covers

| Topic | Outcome |
|-------|---------|
| Vault Helm (dev) + Injector | Stack on Docker Desktop |
| KV v2 + policy | Path `secret/data/checkout/*` |
| Kubernetes auth | SA + namespace bound role |
| Agent Injector | Files under `/vault/secrets` without baking secrets into manifests |

## K8s Secret vs Vault (recap)

| | K8s Secret | Vault |
|--|------------|-------|
| Storage | etcd | Vault storage |
| AuthZ | RBAC | Vault policy |
| Into the Pod | env / volume | Agent file, ESO sync, CSI, SDK |
| Rotation | manual | versions / dynamic engines |

Native Secrets remain useful for non-sensitive config and for **synced** copies — they should not be the only long-lived copy of production passwords in Git.

## Patterns you will touch

```text
Pod SA JWT ──login──► Vault (kubernetes auth)
                         │
                         ▼
              Agent Injector writes /vault/secrets/…
                         │
                         ▼
                      App reads file
```

External Secrets Operator and CSI are compared later — labs focus on **Injector**.

## Checklist

- [ ] You know why base64 ≠ encryption  
- [ ] You will use in-cluster Vault (Helm), not only Compose  

Next: [02. Vault Helm chart](02-vault-helm.md).
