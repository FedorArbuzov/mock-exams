# 09. HA, Raft storage, and unseal (theory)

## Intro: "Vault went down — and every deploy stalled"

After a node restart, the team saw `Sealed: true` and panicked: "where are the unseal keys?". In dev mode ([`deploy/vault`](../../deploy/vault/README.md)) Vault is **never sealed** — that is **not** the production model. In an advanced interview they expect an explanation of **Raft**, **quorum**, **Shamir** vs **auto-unseal**, without requiring you to stand up a 3-node cluster in a lab.

## What you'll learn

- Why **dev mode** doesn't teach HA.
- **Integrated storage (Raft)** vs external Consul.
- **Seal / unseal** and the master key.
- **Auto-unseal** (KMS, HSM, cloud).
- **Performance standby** and **disaster recovery** (Enterprise overview).

> **This chapter is theory only.** We don't deploy a full 3-node HA lab in the course; practice seal/unseal in HashiCorp's documentation or a separate prod-like sandbox.

---

## Dev mode vs production

| | Dev (`VAULT_DEV_ROOT_TOKEN_ID`) | Production |
|---|--------------------------------|------------|
| Storage | in-memory | Raft / Consul |
| Unseal | automatic | Shamir or auto-unseal |
| Root token | known in advance | generated at init, revoked |
| TLS | often HTTP | required |
| Audit | none | required |

Your sandbox: a single `mock-vault` container, token `course` — **only for the PKI/Transit/AppRole labs**.

---

## Init and Shamir keys

On the first `vault operator init`:

- A **master key** is generated (it encrypts storage).
- **N unseal keys** are issued, with an **M-of-N** threshold (for example 3-of-5).
- An **initial root token** is issued (you must revoke it after bootstrap).

```bash
# conceptual commands (NOT on the course dev sandbox)
vault operator init -key-shares=5 -key-threshold=3
vault operator unseal   # repeat M times with different keys
```

A **sealed** Vault: the API responds but does **not** return secrets. **Unsealed** — the master key is restored in memory.

**At the interview:** "Who holds the unseal keys?" — different people/safes/HSMs; not in Git, not in a single 1Password "for convenience".

---

## Raft integrated storage

Since Vault 1.4+, the typical pattern is **Raft** without Consul:

```text
3+ server nodes (odd count)
leader election
replication log entries
```

| Concept | Meaning |
|---------|--------|
| **Leader** | active writes, unseal-state coordination |
| **Follower** | a data replica |
| **Quorum** | a majority for commit (N/2+1) |
| **Join** | `vault operator raft join` to the leader |

Losing a **majority** of nodes → the cluster isn't writable. Plan for **AZ**s and backup snapshots ([`vault operator raft snapshot`](https://developer.hashicorp.com/vault/docs/commands/operator/raft/snapshot)).

---

## Auto-unseal

| Method | Idea |
|-------|------|
| AWS KMS / GCP CKMS / Azure Key Vault | A cloud KMS decrypts the master key at startup |
| HSM (PKCS#11) | The key never leaves the hardware |
| Transit seal | Meta: another Vault unseals this one |

Pro: restart without "getting five engineers on a call". Con: a **dependency on the KMS**; you need a break-glass Shamir backup.

**Recovery mode** (Enterprise) — access when quorum is lost; a separate procedure.

---

## Performance replication (overview)

| | Standard (Raft) | Performance replication |
|---|-----------------|-------------------------|
| Purpose | HA in one DC | Read scaling / DR |
| Writes | Leader | Primary cluster |
| Secrets | Strong consistency local | Eventually across regions |

At the interview it's enough: "A DR secondary does not replace a backup snapshot and an unseal runbook".

---

## Namespaces (Enterprise, briefly)

Multi-tenancy: `admin/ns1/secret/...` — isolation of policies and mounts. In OSS — a single root namespace.

---

## Links to other course topics

- The **PKI root key** in storage is encrypted with the master key — while sealed, PKI is unavailable.
- **Transit keys** — the same.
- **Audit** ([10](10-troubleshooting-audit.md)) — a single sink on all nodes, or per-node with aggregation.

---

## At the interview — answer cheatsheet

1. **What happens when a sealed node reboots?** — It needs an unseal (manual or auto); a standby waits for the leader.
2. **Why an odd number of nodes?** — Quorum without a split-brain tie.
3. **Can you restore from a backup without unseal keys?** — No; the snapshot is encrypted.
4. **The main difference between dev and prod?** — Seal discipline + persistent storage + TLS + audit.

---

## Summary

- Production Vault = **persistent Raft** + **unseal discipline**.
- The course dev sandbox does **not** demonstrate HA — don't carry its habits into prod.
- Next step: [10. Troubleshooting and audit](10-troubleshooting-audit.md).
