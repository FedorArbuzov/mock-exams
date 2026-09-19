# 16. Lab: ch-03 disk died

## Ticket

P1 — hardware

Bring `ch-03` / `.12` back. `keeper_id` stays **3**. `shop.events` returns to 3 active replicas.

## Task 1. Record

```sql
SELECT replica_name, is_readonly, active_replicas FROM system.replicas WHERE table = 'events';
SELECT count() FROM shop.events;
```

Write counts and replica names into `artifacts/pre-replace.txt`.

## Task 2. Drop leftover, recycle LXC

From a living node, drop the **dead** replica leftover ([15](15-replace.md)). Then recreate the container: **same** `ch-03` / `192.168.60.12` as [lesson 02](02-lab-nodes.md) (`lxc delete --force` + launch + SSH).

`ansible ch-03 -m ping` must work again.

## Task 3. Reinstall

```bash
cd ~/nimbus-ch
ansible-playbook site.yml --limit ch-03
```

`common` + `cluster`. Confirm `keeper_id` in inventory is still 3. Wait `clickhouse-keeper` and `clickhouse-server` **active**.

## Task 4. Replica data

`schema.yml` (IF NOT EXISTS / users.d). If `shop.events` is missing only on `ch-03`, `ON CLUSTER` create or `SYSTEM RESTORE REPLICA` / `ATTACH` as needed.

```sql
SYSTEM SYNC REPLICA shop.events;
SELECT count() FROM shop.events;
SELECT replica_name, is_readonly, active_replicas FROM system.replicas WHERE table = 'events';
```

`active_replicas = 3`, counts match `pre-replace.txt` (plus any inserts you did after).

## Success criteria

- [ ] three servers + three keepers
- [ ] Keeper on `.12` is still id **3**
- [ ] `shop.events` 3 replicas, not readonly
- [ ] replace order in six bullets in the README
- [ ] you did not rsync onto a living datadir as a panic move

Next: [17. Runbooks](17-runbooks.md).
