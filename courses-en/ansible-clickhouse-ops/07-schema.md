# 07. Schema as code ON CLUSTER

`CREATE TABLE` on whichever node you SSH’d *today* is how `shop.events` exists on `ch-01` only. Then lesson 10 “proves” replication of a table that the other replicas never heard of.

DDL for a replicated cluster is a **cluster** API call: `ON CLUSTER nimbus`. Keeper distributes it. You still run the client **once** (`run_once`).

## Databases and tables

```sql
CREATE DATABASE IF NOT EXISTS shop ON CLUSTER nimbus;

CREATE TABLE IF NOT EXISTS shop.events ON CLUSTER nimbus
(
  event_time DateTime,
  user_id UInt64,
  payload String
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/shop/events', '{replica}')
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_time, user_id);
```

Macros expand **per host**. Same ZK path per shard; different `{replica}`.

| Do | Do not |
|----|--------|
| `ON CLUSTER nimbus` + `IF NOT EXISTS` | `CREATE` only on `ch-01` |
| `ReplicatedMergeTree` | `MergeTree` “to make the lab easier” |
| `run_once` | loop the same `CREATE` on three hosts without `ON CLUSTER` |

`clickhouse-client --query` via the `command` module is enough **for lesson 08**. There is no `community.clickhouse` you must learn. The `changed=true` every run is a lie you fix in [lesson 20](20-own-module.md) with your own module.

## Ansible is not the app migration tool

Product tables (`shop.orders` v17 → v18, `ALTER`, backfill) live in the **application** repo: Flyway, Liquibase, golang-migrate, Atlas, a folder of numbered `.sql` in CI. Those tools own **order**, expand/contract, and “who shipped this column.” ClickHouse has no special exemption — teams still version DDL.

This course has **no app repo**. `shop.events` is a **platform object**: empty ReplicatedMergeTree so the cluster is usable, like `CREATE DATABASE shop` on Patroni. Ops Ansible is the right hammer for:

- cluster-wide bootstrap (`ON CLUSTER`, macros, first database);
- users that are files in `users.d`;
- Monday “does the table we promised still exist?”

It is the wrong hammer for every weekly `ALTER`. If Nimbus grows an app, you **stop** adding columns in `nimbus-ch` and start a migration pipeline. The playbook keeps ensuring the database / first table exists; it does not become Flyway.

Do not run two sources of truth for the same `CREATE`. Either ops owns `shop.events`, or the app does.

## Users: `users.d`

Application users are files on **every** node (ClickHouse reads local XML). That is a play on `hosts: clickhouse`, not `run_once`.

```text
/etc/clickhouse-server/users.d/shop_app.xml
```

Password from Vault (`vault_shop_app_password`). Encrypt `group_vars/all/vault.yml`. Do not commit the plaintext.

`SYSTEM RELOAD CONFIG` or a Server reload after the drop-in — **reload**, not a rolling restart, unless your 24.8 build requires it. Check the docs / journal.

SQL `CREATE USER … ON CLUSTER` exists. This course uses **`users.d`** so you see the same pattern as `config.d`: fragments, not one giant `users.xml`.

## Checklist

- [ ] Schema is inventory + playbook, `ON CLUSTER`
- [ ] Users are `users.d` + Vault on all three
- [ ] You will not `CREATE` only on one replica
- [ ] You can say Ansible bootstrap ≠ app migrations

Next: [08. Lab: shop](08-lab-schema.md).
