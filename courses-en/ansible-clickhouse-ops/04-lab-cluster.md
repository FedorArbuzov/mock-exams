# 04. Lab: install Server + Keeper

Install the cluster on the empty nodes from [lesson 02](02-lab-nodes.md). Do **not** skip `roles/cluster`. Do **not** `ansible-galaxy install` a ClickHouse role and call it done.

## Task 1. Vars and role

`group_vars/all/cluster.yml`: cluster **`nimbus`**, ports **9000 / 8123**, Keeper **9181 / 9234**, package pin **24.8.x**, small `max_server_memory_usage`. Sketch: [`examples/group_vars/all/cluster.yml`](examples/group_vars/all/cluster.yml).

`roles/cluster`: official apt repo + GPG, packages `clickhouse-server` `clickhouse-client` `clickhouse-keeper`, templates for `config.d` and Keeper, handlers restart each unit. Picture: [`examples/roles/cluster`](examples/roles/cluster/tasks/main.yml).

```bash
apt-cache madison clickhouse-server | head
```

Write the **exact** `24.8.x` you pin into the README. `DEBIAN_FRONTEND=noninteractive` — the package may prompt for a default password. Lab: empty default password is fine; say so.

`site.yml` applies `common` + `cluster` with tags `baseline` / `cluster`. You may run **only** `--tags cluster` here if `common` is still empty.

## Task 2. Apply

```bash
cd ~/nimbus-ch
ansible-playbook site.yml --tags cluster
```

First run is long (repo, debs, first start). If Keeper fails to elect, read `journalctl -u clickhouse-keeper` — usually `server_id`, raft host/IP, or a second Keeper inside Server config.

## Task 3. Proof

On each host:

```bash
systemctl is-active clickhouse-server clickhouse-keeper
```

From any node:

```bash
clickhouse-client --query "SELECT host_name, shard_num, replica_num FROM system.clusters WHERE cluster = 'nimbus'"
```

Three rows, one shard. Then a **probe** ReplicatedMergeTree (throwaway; `shop` is lesson 08):

```sql
CREATE DATABASE IF NOT EXISTS nimbus ON CLUSTER nimbus;

CREATE TABLE IF NOT EXISTS nimbus.probe ON CLUSTER nimbus
(
  ts DateTime,
  note String
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/nimbus/probe', '{replica}')
ORDER BY ts;

INSERT INTO nimbus.probe VALUES (now(), 'lab04');
SELECT count() FROM nimbus.probe;
```

Count ≥ 1 on **every** replica (wait a few seconds). `Connection refused` is not success — wait for the unit, read the journal.

## Task 4. Disk

Name in the README:

- `/var/lib/clickhouse`
- `/var/lib/clickhouse-keeper`
- the `config.d` files you deployed
- exact unit names

## Success criteria

- [ ] both units `active` on all three
- [ ] `system.clusters` shows `nimbus` 1×3
- [ ] probe INSERT visible on all replicas
- [ ] 24.8.x written down
- [ ] no ZooKeeper package, no Galaxy ClickHouse role

Next: [05. Baseline](05-baseline.md).
