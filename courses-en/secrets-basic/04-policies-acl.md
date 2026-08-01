# 04. ACL policies: path, capabilities, least privilege

## Intro: “CI has full root”

A deploy pipeline reads the production DB password via a **root token** in `VAULT_TOKEN` — any job with access to that variable gets **all engines** and can delete the PKI CA. Security requires a **readonly** policy on `secret/data/course/*` and a ban on `delete` for prod paths. This chapter covers **ACL policy** syntax, the token ↔ policy link, and the example [`policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl).

## What you'll learn

- Policy structure: `path` + `capabilities`.
- Capability differences for **KV v2** (`data/` vs `metadata/`).
- **Default deny**, implicit root, testing a policy with a new token.
- Naming policies for services and CI.

## Policy as a firewall

Everything not allowed by the token’s policy is **denied**. The root token bypasses ACL (another reason not to use root in CI).

```hcl
# Minimal read on one secret
path "secret/data/course/checkout/db" {
  capabilities = ["read"]
}
```

## Capabilities

| Capability | Meaning |
|------------|--------|
| `read` | GET secret data |
| `list` | LIST keys (catalog) |
| `create` | new key / first version |
| `update` | new KV version |
| `delete` | delete versions / metadata ops |
| `sudo` | root-like on path (rare) |
| `deny` | explicit deny (overrides allow) |

For KV v2 **patch** you need `update` (and usually `read`).

## KV v2: two path prefixes

| Action | Path in policy |
|----------|---------------|
| Read values | `secret/data/course/checkout/*` |
| List keys | `secret/metadata/course/checkout/*` |
| Delete a version | `delete` on `secret/data/...` and/or `secret/delete/...` |

Beginner mistake: policy only on `secret/course/*` → **403** on `kv get`.

## Readonly example (repository)

[`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl):

```hcl
path "secret/data/course/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/course/*" {
  capabilities = ["read", "list"]
}
```

- CI **deploy-readonly** reads checkout secrets, does not write.
- Separate policy `course-writer` with `create`, `update` only on `secret/data/course/dev/*`.

## Wildcards

| Pattern | Match |
|---------|--------|
| `secret/data/course/*` | one segment after course |
| `secret/data/course/+` | same (Vault grammar) |
| `secret/data/course/checkout/*` | all keys under checkout |

Avoid `secret/data/*` with `delete` for application tokens.

## Binding a policy to a token

1. `vault policy write course-readonly policy-readonly.hcl`
2. `vault token create -policy=course-readonly -ttl=30m`
3. Export `VAULT_TOKEN=<new>` and verify with `kv get`.

**Token roles** (advanced): templated TTL, orphan tokens, batch tokens.

## On the stand: viewing policies

```bash
docker exec -e VAULT_TOKEN=course mock-vault vault policy list
docker exec -e VAULT_TOKEN=course mock-vault vault policy read default
```

After lab 05 you will see `course-readonly`.

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| Path without `data/` | permission denied | `secret/data/...` |
| `read` without `list` | empty UI/CLI list | add `list` on metadata |
| One policy for all envs | dev job reads prod | prefix `course/dev`, `course/prod` |
| Root in a GitLab variable | full Vault compromise | role + approle/k8s auth |
| Forgetting to renew TTL | sudden 403 mid-deploy | renewable token + renew script |

## In production

- Policy as code in Git → `vault policy write` in an admin pipeline.
- **Sentinel** (Enterprise) — guardrails (ban wildcard delete).
- Separation: **human** policies vs **machine** policies.
- Regular **access review**: who has `sudo`, who reads prod.
- Test: `vault token capabilities <token> secret/data/prod/foo`.

## Interview notes

- Vault ACL is **default deny**.
- Policies are not inherited automatically — capabilities are a **union**.
- **Batch tokens** — cannot renew; for one-shot CI (advanced).
- Root policy = `root`; do not mix with app.

## Summary

A policy limits a token by **path** and **capabilities**. KV v2 needs separate rules for `data/` and `metadata/`. Readonly for CI is a typical first step; lab [05](05-lab-policies.md) applies the file from `deploy/vault/examples/`.

## Checklist

- Which capabilities are needed for `kv put`?
- Why `list` on the metadata path?
- Where is the readonly policy example in the repo?
- Why is a root token dangerous in GitLab?

Next lesson: [05. Lab: policies](05-lab-policies.md).
