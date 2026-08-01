# 10. Lab: ACL read-only user

## Lab goal

Create a **readonly** user with access only to `app:*` and read commands; verify rejection of `SET` and `FLUSHALL`.

## Prerequisites

- Single stand: `docker compose up -d` in `deploy/redis`.
- ACL example: [`examples/acl-readonly.acl`](examples/acl-readonly.acl)

---

## Task 1. Prepare data as admin

```bash
docker exec mock-redis redis-cli SET app:product:1 '{"name":"Book"}'
docker exec mock-redis redis-cli SET app:product:2 '{"name":"Pen"}'
docker exec mock-redis redis-cli SET internal:secret token
```

---

## Task 2. Create the readonly user

**Why:** reproduce the example file at runtime.

```bash
docker exec mock-redis redis-cli ACL SETUSER readonly on \
  '>readonly-secret' '~app:*' '-@all' '+@read' '+ping' '+info'
docker exec mock-redis redis-cli ACL LIST | grep readonly
```

Or load the file (if mounted into the container):

```bash
docker cp courses/redis-intermediate/examples/acl-readonly.acl mock-redis:/tmp/readonly.acl
docker exec mock-redis redis-cli ACL LOAD
```

(host path — from the repository root)

---

## Task 3. Read check

```bash
docker exec mock-redis redis-cli --user readonly --pass readonly-secret GET app:product:1
docker exec mock-redis redis-cli --user readonly --pass readonly-secret PING
```

**What you'll see:** `PONG` and the book JSON.

---

## Task 4. Forbid writes and foreign keys

```bash
docker exec mock-redis redis-cli --user readonly --pass readonly-secret SET app:hack 1
docker exec mock-redis redis-cli --user readonly --pass readonly-secret GET internal:secret
docker exec mock-redis redis-cli --user readonly --pass readonly-secret FLUSHALL
```

**What you'll see:** `NOPERM` on every operation.

---

## Task 5. Write as default

```bash
docker exec mock-redis redis-cli SET app:product:1 '{"name":"Book","v":2}'
docker exec mock-redis redis-cli --user readonly --pass readonly-secret GET app:product:1
```

---

## Task 6. ACL LOG (optional)

```bash
docker exec mock-redis redis-cli ACL LOG 5
```

**What you'll see:** entries about readonly denials.

---

## Task 7. Save (carefully)

On the training stand:

```bash
docker exec mock-redis redis-cli ACL SAVE
```

Don't commit production secrets; the course example password is for training.

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | `readonly` reads `app:*` |
| 2 | `SET` / `FLUSHALL` / `GET internal:*` — `NOPERM` |
| 3 | `default` still writes |
| 4 | You understand the ACL line in `examples/acl-readonly.acl` |

Next lesson: [11. Lua](11-lua.md).
