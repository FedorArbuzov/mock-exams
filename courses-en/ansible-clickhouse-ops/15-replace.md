# 15. Replace a replica

`ch-03` disk died. Same name and IP, new OS. **Keeper `server_id` stays 3.**

```text
preflight on ch-01 / ch-02
stop ch-03 if it still answers
SYSTEM DROP REPLICA leftover (old ch-03 in ZK / system.replicas)
recreate LXC (same IP .12)
common + roles/cluster --limit ch-03
Keeper joins raft as id 3
Server starts empty — ATTACH / let ReplicatedMergeTree sync
wait is_readonly=0, rows match
schema.yml still works (IF NOT EXISTS)
```

## Prefer sync from living replicas

New OS → reinstall **cluster** role → empty datadir. You do **not** rsync `/var/lib/clickhouse` unless a human decided to. Default story: `SYSTEM DROP REPLICA 'ch-03'` (or the leftover replica name / ZK path) from a **living** node, then the new Server creates its replica and pulls parts.

```sql
-- on a living replica; names from system.replicas / ZK
SYSTEM DROP REPLICA 'ch-03' FROM TABLE shop.events;
-- or
SYSTEM DROP REPLICA 'ch-03' FROM ZKPATH '/clickhouse/tables/01/shop/events';
```

Then `CREATE TABLE IF NOT EXISTS … ON CLUSTER` (schema play) or `SYSTEM RESTORE REPLICA` / `ATTACH` if the table metadata is half-there. Wait `SYSTEM SYNC REPLICA shop.events`.

`nimbus.probe` from lesson 04 needs the same drop/sync if you still have it.

## Keeper id 3

Raft already knows server **3** at `.12`. A new `server_id=4` is a fourth member the config does not list. A reused id **3** on a wiped disk is the intended lab: new OS, same inventory `keeper_id: 3`. If Keeper refuses to join, read the journal — do not invent a new id to “make it start.”

## Do not

- change `keeper_id` in inventory “just this once”
- `rm -rf` datadir on `ch-01` / `ch-02`
- run `site.yml --tags cluster` as a panic button on **all** hosts while two are healthy (should be idempotent, still a long blast)
- rsync a **readonly / corrupt** datadir on top of a good replica

rsync-from-healthy is a valid **other** story (large tables, slow replay). Write it in the README if you try it. The required path is drop leftover + sync.

## Checklist

- [ ] Replace order is written before you wipe
- [ ] `server_id` 3 is non-negotiable
- [ ] DROP REPLICA leftover, then sync — not wipe the cluster

Next: [16. Lab: ch-03](16-lab-replace.md).
