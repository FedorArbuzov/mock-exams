# 03. Autobase: what you own

`vitabaks.autobase` (repo history: **postgresql_cluster**) deploys etcd, Patroni, PostgreSQL, and optional HAProxy/pgBackRest. You own inventory groups and a short `group_vars`.

## Playbooks you will call

| Playbook | When |
|----------|------|
| `vitabaks.autobase.deploy_pgcluster` | first install (lesson 04) |
| `config_pgcluster` | their object/config path — we still do **shop** in `nimbus-pg` |
| `switchover_pgcluster` | planned leader change (lesson 10) |
| `failover_pgcluster` | leader is dead (lesson 18b) |
| `update_pgcluster` | rolling package updates (optional; we wrap the idea in lesson 12) |
| `add_node` / `remove_node` | lesson 16 |
| `reinit_pgcluster` | rebuild one replica (lesson 18c) |
| `backup_pgcluster` | if you enable pgBackRest later |
| `remove_cluster` | lab reset only (`remove_postgres` / `remove_etcd`) |

```bash
ansible-playbook -i inventory/hosts.ini vitabaks.autobase.deploy_pgcluster
```

## Variables you must set

```yaml
# group_vars/all/autobase.yml
postgresql_version: 16
patroni_cluster_name: nimbus-pg
dcs_type: etcd
with_haproxy_load_balancing: false
# keep memory tiny — names: see collection defaults
# postgresql_shared_buffers / shared_buffers style vars
```

Read `roles/common/defaults/main.yml` **inside the installed collection** for the exact knob names in 2.11.0. Write the ones you set into the README.

Do **not** enable Consul, Timescale, or a cloud `cloud_provider` on this stand.

## What it leaves on disk

```text
Patroni unit     patroni.service   (confirm)
Postgres data    PGDATA — often /var/lib/postgresql/16/main or /pgdata
etcd data        /var/lib/etcd
patronictl       as postgres or via sudo
```

`patronictl -c /etc/patroni/patroni.yml list` (path may vary) is how you see Leader / Replica.

## Checklist

- [ ] You can list deploy / switchover / add_node / reinit
- [ ] `master` in inventory ≠ forever-leader
- [ ] HAProxy stays off until you choose it

Next: [04. Lab: deploy](04-lab-cluster.md).
