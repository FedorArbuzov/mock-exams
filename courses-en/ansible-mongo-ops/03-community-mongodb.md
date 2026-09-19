# 03. community.mongodb: what you own

`community.mongodb` **1.7.12** is the installer **and** the day-2 API. You own inventory groups and a short `group_vars`. You do not paste a mystery one-liner and walk away.

Pin **1.7.12**. Mixing `latest` with a blog post for 1.4 is how people spend a Sunday on variable names.

## Roles and modules (this course)

| Piece | Kind | When |
|-------|------|------|
| `mongodb_linux` | role | THP, limits, swappiness — once, before packages |
| `mongodb_repository` | role | official repo. **Set `mongodb_version: "7.0"`** — 1.7.12 defaults to something else |
| `mongodb_mongod` | role | package + `mongod.conf` + unit. Replica set name, bind, keyfile path |
| `mongodb_auth` | **role** | enable authorization + first admin **after** the set exists. Not a module |
| `mongodb_replicaset` | module | `rs.initiate` / member list |
| `mongodb_status` | module | wait until one PRIMARY + SECONDARY; **lookup PRIMARY** |
| `mongodb_user` | module | `shop_app` (and any extra user) |
| `mongodb_index` | module | indexes as code |
| `mongodb_stepdown` | module | planned PRIMARY stepDown |

Do **not** call `mongodb_mongos`, `mongodb_config`, `mongodb_shard`, or anything that smells like a shard. This stand is one replica set.

`geerlingguy.mongodb` is a single-instance installer. Not this course.

## Order that does not lie

```text
mongodb_linux
mongodb_repository          # 7.0
mongodb_mongod              # bind, replSetName nimbus, small cache
pymongo on every target     # modules run on the host, not on Galaxy
mongodb_replicaset          # once, on nimbus_bootstrap (mongo-01)
mongodb_status              # poll until PRIMARY + two SECONDARY
mongodb_auth                # keyfile + authorization after RS init
```

MongoDB’s own rule: **initiate the replica set before you add users**. Localhost exception dies after the first admin exists. Keyfile must be **identical** on all three members.

`mongodb_mongod` defaults in 1.7.12 already mention `authorization`, `repl_set_name`, `openssl_keyfile_*`, `replicaset`, `sharding`. **Read the installed role defaults** (`~/.ansible/collections/ansible_collections/community/mongodb/roles/mongodb_mongod/defaults/main.yml`). Write the knobs you set into the README. Do not invent names the role ignores.

`sharding: false`. Replica set name **`nimbus`**, not `rs0`.

## pymongo

Every module in the table needs **pymongo 4+ on the target** (or on localhost if you `delegate_to`). Install it in `cluster.yml` with `apt`/`pip` **before** `mongodb_replicaset`. If the module says `missing pymongo`, you skipped this.

## What it leaves on disk

```text
systemd unit     mongod.service          (confirm)
data             /var/lib/mongodb        (Debian default — confirm)
config           /etc/mongod.conf
keyfile          path from role defaults (often /etc/keyfile)
log              /var/log/mongodb/mongod.log
```

`mongosh --eval 'rs.status()'` (add `-u` / `--authenticationDatabase admin` after auth) is how you see PRIMARY / SECONDARY.

WiredTiger cache: 1.7.12 `mongod.conf.j2` has **no** `cacheSizeGB` knob. On a 2 GiB LXC the default is already small. If you OOM, add a drop-in the role will not clobber — do not pretend a fake extra-var works.

## Checklist

- [ ] You can list linux / repository / mongod / replicaset / status / auth
- [ ] `nimbus_bootstrap` ≠ forever-PRIMARY
- [ ] No mongos, no config servers

Next: [04. Lab: install](04-lab-cluster.md).
