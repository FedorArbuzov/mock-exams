# 08. Agent Injector annotations

## Minimum annotations

On the **Pod template** (Deployment `spec.template.metadata.annotations`):

```yaml
vault.hashicorp.com/agent-inject: "true"
vault.hashicorp.com/role: "checkout-app"
vault.hashicorp.com/agent-inject-secret-db: "secret/data/checkout/db"
vault.hashicorp.com/agent-inject-template-db: |
  {{- with secret "secret/data/checkout/db" -}}
  password={{ .Data.data.password }}
  user={{ .Data.data.user }}
  {{- end -}}
```

Also set:

```yaml
spec:
  serviceAccountName: checkout-app
```

## What you get

| Path | Content |
|------|---------|
| `/vault/secrets/db` | rendered template (password=…, user=…) |

The suffix after `agent-inject-secret-` / `agent-inject-template-` becomes the filename (`db`).

## Common mistakes

| Mistake | Result |
|---------|--------|
| Wrong role name | Agent fails; Pod stuck Init |
| SA not bound in Vault role | login denied |
| Template uses `.Data.password` (KV v1 style) | empty — KV v2 needs `.Data.data.password` |
| Annotation on Deployment metadata, not Pod template | webhook never sees it |

## Checklist

- [ ] Annotations on **Pod** template  
- [ ] KV v2 template uses `.Data.data`  

Next: [09. Lab: inject](09-lab-inject.md).
