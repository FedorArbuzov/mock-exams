# 09. ACL: users and commands

## Intro: "the intern ran FLUSHALL in prod"

Before Redis 6 a single "password for everything" (`requirepass`) didn't distinguish read from admin. **ACL** (Access Control List) defines **users**: password, allowed **commands**, **keys**, and **pub/sub** channels.

At intermediate you separate the app (read/write `app:*`) from monitoring (only `+@read`) and from admin.

## What you'll learn

- Syntax of `ACL SETUSER`, `ACL LIST`.
- Categories `+@read`, `+@write`, `-@dangerous`.
- Key patterns `~app:*`.
- `aclfile` vs runtime ACL.

## ACL model

```text
user readonly on >secret ~app:* -@all +@read +ping +info
```

| Part | Meaning |
|-------|--------|
| `user readonly` | name |
| `on` / `off` | active |
| `>secret` | password (SHA256 in the file) |
| `~app:*` | access only to keys `app:...` |
| `&*` | pub/sub channels (optional) |
| `+@read` | command category |
| `-@all` + explicit `+` | deny-by-default |

Dangerous commands: `+@dangerous` includes `FLUSHALL`, `CONFIG`, `DEBUG` — don't give them to the app.

## Training stand

[`redis-single.conf`](../../deploy/redis/config/redis-single.conf):

```text
aclfile /usr/local/etc/redis/users.acl
```

Starter [`users.acl`](../../deploy/redis/config/users.acl):

```text
user default on nopass ~* &* +@all
```

For the read-only lab — [`examples/acl-readonly.acl`](examples/acl-readonly.acl).

## Commands

```bash
ACL LIST
ACL WHOAMI
ACL SETUSER appwriter on >app-secret ~app:* -@all +@write +@read +ping
AUTH appwriter app-secret
SET app:session:1 ok
SET other:key 1   # NOPERM
```

Save to file:

```bash
ACL SAVE
```

Load from the course example:

```bash
ACL LOAD
# or mount aclfile in compose
```

## On the stand

```bash
cd deploy/redis
docker compose up -d
docker exec mock-redis redis-cli ACL LIST
docker exec mock-redis redis-cli ACL GETUSER default
```

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| `NOPERM` | key outside `~pattern` | widen the pattern or command |
| Everyone locked out | `default off` without a password | emergency `aclfile` |
| ACL didn't survive restart | no `ACL SAVE` | `aclfile` in a volume |
| App can't `EVAL` | no `+eval` | separate user for Lua |
| `AUTH` wrong user | default disabled | explicit `AUTH user pass` |

## In production

- Disable **default** or use a strong password; separate users per service.
- Rotate passwords via Secrets Manager / Vault.
- ElastiCache: RBAC + users (see [19](19-managed-elasticache.md)).
- Audit: `ACL LOG` (Redis 7+).

## Summary

ACL is least privilege for Redis: keys + commands + users. Training single already mounts `users.acl`; lab 10 will add **readonly**.

## Checklist

- How is ACL better than a single `requirepass`?
- What does `~app:*` mean?
- How do you forbid `FLUSHALL` for the app?
- Where is ACL stored after `ACL SAVE`?

Next lesson: [10. Lab: read-only](10-lab-acl-readonly.md).
