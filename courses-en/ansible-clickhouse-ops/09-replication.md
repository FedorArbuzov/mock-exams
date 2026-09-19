# 09. Replication, readonly, parts

You already created `shop.events` as ReplicatedMergeTree. Here the replica is a **systemd unit** on a disk. Stopping it is `systemctl stop clickhouse-server`, not killing a container.

## What to look at

```sql
SELECT
  database, table, replica_name,
  is_readonly, is_session_expired,
  total_replicas, active_replicas,
  queue_size, inserts_in_queue, absolute_delay
FROM system.replicas
WHERE database = 'shop';
```

| Column | Meaning |
|--------|---------|
| `is_readonly` | this replica will not take inserts |
| `is_session_expired` | lost Keeper session — often the path to readonly |
| `active_replicas` | who is in the replica set **now** |
| `queue_size` | parts waiting to apply |

`system.parts` is the data: one dead server does not delete parts on the living nodes.

## One server down, inserts still work

Connect to a **living** replica. With default `insert_quorum = 0`, the insert lands locally and replicates async. For the drill, set **`insert_quorum = 2`** on the session (or in a settings profile) so you wait for two copies — one dead server, still writable; two dead, not.

```sql
SET insert_quorum = 2;
INSERT INTO shop.events VALUES (now(), 2, 'quorum');
```

That is the ClickHouse analogue of Kafka `acks=all` + `min.insync.replicas=2`.

Do **not** stop Keeper on two nodes in this lesson. Do **not** stop Server on two nodes and call it a replica drill.

## Readonly is a different page

Readonly is not “the unit is stopped.” It is “this replica refuses writes” — expired session, broken replica metadata, or a local table you `DETACH`’d. Runbook: [17](17-runbooks.md) / [18c](18c-lab-readonly.md). `SYSTEM RESTART REPLICA` / `SYSTEM RESTORE REPLICA`. Not `rm -rf /var/lib/clickhouse` on the fleet.

## Checklist

- [ ] You can read `system.replicas` without a blog
- [ ] One Server down ≠ cluster read-only
- [ ] Stopping a unit ≠ deleting the datadir

Next: [10. Lab: stop a replica](10-lab-replica-down.md).
