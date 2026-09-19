# 03. Keeper, cluster, config.d

ClickHouse HA is not “three `apt install clickhouse-server` and hope.” You need a **coordination** quorum and a **`remote_servers`** map the servers agree on.

There is **no** Autobase-class official playbook. `roles/cluster` **is** the installer. Galaxy names (`anhnt094.clickhouse`, …) are not the job — they hide the XML you must be able to read at 03:00.

## Keeper quorum (odd)

| | Keeper | ZooKeeper |
|--|--------|-----------|
| This course | **ClickHouse Keeper** (package + unit) | **off** |
| Quorum | 3 (odd). 2 is not a quorum you can lose one of | same math, extra JVM |
| Client port (lab) | **9181** | 2181 |
| Raft port (lab) | **9234** | — |

Each host has `keeper_id` 1/2/3. That id is **`server_id` in raft**. Change it after first start and you get a new member the old quorum does not know. [Lesson 15](15-replace.md) keeps id **3** on the recycled `.12`.

Colocation (Keeper + Server on the same box) is a real small on-prem layout, like Kafka KRaft. Two processes, two units:

```text
clickhouse-keeper.service
clickhouse-server.service
```

Do **not** also enable `<keeper_server>` **inside** the Server config. That is a second Keeper on the same ports. Server only **clients** Keeper via the `<zookeeper>` block (the tag name is historical).

Never restart all three Keepers at once. One dead Keeper: cluster still writes. Two dead: quorum is gone — [18b](18b-lab-keeper-down.md) stops **one**.

## `remote_servers` and ReplicatedMergeTree

```text
cluster nimbus
  shard 01
    replica ch-01  :9000
    replica ch-02  :9000
    replica ch-03  :9000
```

| Engine | What it is |
|--------|------------|
| **MergeTree** | local table. `CREATE` on `ch-01` only exists on `ch-01` |
| **ReplicatedMergeTree** | parts + DDL coordination through Keeper. Path uses `{shard}` / `{replica}` **macros** |
| **Distributed** | query-time fan-out. Not required for this course’s inserts |

`internal_replication=true` on the shard: if you later add a Distributed table, inserts are not written three times by the proxy.

Macros come from **inventory**, not from editing XML on one node:

```text
{shard}    01          (same on all three — one shard)
{replica}  ch-01 / ch-02 / ch-03
```

## `config.d`, not one giant XML

Package `config.xml` stays vendor. You drop fragments:

```text
/etc/clickhouse-server/config.d/listen.xml
/etc/clickhouse-server/config.d/macros.xml
/etc/clickhouse-server/config.d/remote_servers.xml
/etc/clickhouse-server/config.d/zookeeper.xml
/etc/clickhouse-server/config.d/backups.xml     (allowed_path — lesson 13 uses this)
/etc/clickhouse-keeper/keeper_config.xml        (raft — full file is fine)
```

Merge rules: a tag in `config.d` **replaces** the same tag from the main file. Do not paste a second `<remote_servers>` into `config.xml` by hand.

Users: `users.d` is **day-2** ([lesson 07](07-schema.md)), not the installer.

## What `roles/cluster` leaves on disk

```text
units            clickhouse-server, clickhouse-keeper
data             /var/lib/clickhouse
keeper data      /var/lib/clickhouse-keeper
server config    /etc/clickhouse-server/config.xml + config.d/
keeper config    /etc/clickhouse-keeper/keeper_config.xml
logs             /var/log/clickhouse-server, /var/log/clickhouse-keeper
```

HTTP **8123**, native **9000**, interserver **9009**. Memory cap so two processes fit in **2 GiB** (lesson 04).

Sketches in [`examples/roles/cluster`](examples/roles/cluster/tasks/main.yml) are **not** production-perfect. Students adjust. After they work, **freeze** the templates.

## Checklist

- [ ] Odd Keeper quorum; tag `<zookeeper>` still points at Keeper
- [ ] ReplicatedMergeTree ≠ MergeTree
- [ ] `config.d` fragments, not one edited `config.xml`
- [ ] Galaxy ClickHouse roles are not the installer you will defend

Next: [04. Lab: install](04-lab-cluster.md).
