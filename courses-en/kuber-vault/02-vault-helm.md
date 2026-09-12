# 02. Vault Helm chart and Agent Injector

## Chart pieces

Official chart: `hashicorp/vault`.

| Component | Role on this stand |
|-----------|--------------------|
| **server** (`vault-0`) | Vault API (dev mode: in-memory, auto-unsealed) |
| **Agent Injector** | Mutating webhook — adds init/sidecar when annotations are present |
| CSI driver | Disabled here (`csi.enabled=false`) — optional advanced path |

## Dev mode (lab only)

```bash
--set server.dev.enabled=true
--set server.dev.devRootToken=root
```

| OK for learning | Never for production |
|-----------------|----------------------|
| Fast, no unseal ritual | Root token `root`, no HA, data lost on restart |

## Injector flow

1. You create a Pod with annotations `vault.hashicorp.com/agent-inject: "true"` and a **role**.  
2. The webhook injects an init container (and often a sidecar) that runs Vault Agent.  
3. Agent authenticates with the Pod’s ServiceAccount JWT, fetches secrets, writes files under `/vault/secrets`.  
4. Your app container starts and reads those files.

## Fixed names for this course

| Setting | Value |
|---------|--------|
| Helm release | `vault` |
| Namespace | `vault` |
| Dev root token | `root` |
| App role (labs) | `checkout-app` |
| KV path | `secret/data/checkout/db` |

## Checklist

- [ ] Injector is a **webhook**, not something you install per app  
- [ ] Dev token `root` is for labs only  

Next: [03. Lab: install](03-lab-install.md).
