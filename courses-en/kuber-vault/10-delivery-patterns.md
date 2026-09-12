# 10. Injector vs External Secrets vs CSI

## Comparison

| Pattern | Secret appears as | Pros | Cons |
|---------|-------------------|------|------|
| **Agent Injector** | file in Pod volume | renew, no long-lived K8s Secret | sidecar/init, annotations |
| **External Secrets Operator** | native `Secret` | familiar envFrom / volumeMount | sync lag; still in etcd |
| **Secrets Store CSI** | volume mount | driver ecosystem | extra CSI setup |
| **App SDK** | in-process | full control | code + renew logic |

This course standardizes on **Injector** — closest “Vault-native” path for apps that can read a file. Hands-on ESO after Argo: [`kuber-argocd` 16](../kuber-argocd/16-optional-eso.md) (same Docker Desktop + Helm + Vault).

## When teams still sync to K8s Secret

- Operators that only understand `envFrom: secretRef`
- Temporary bridge during migration
- Non-sensitive adjacent config (prefer ConfigMap)

Never commit the synced Secret YAML with real values to Git.

## Sealed Secrets / SOPS

Different threat model: encrypt for Git, decrypt in-cluster. Complementary to Vault, not a replacement for dynamic auth.

## Checklist

- [ ] You can name one reason to prefer Injector over a static Secret  
- [ ] You know ESO still leaves a Secret in etcd  

Next: [11. Lab: compare](11-lab-compare.md).
