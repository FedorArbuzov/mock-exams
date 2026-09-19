# 04. Lab: deploy Patroni

Install the cluster on the empty nodes from [lesson 02](02-lab-nodes.md). Do **not** skip `deploy_pgcluster`.

## Task 1. Vars

`group_vars/all/autobase.yml`: PostgreSQL 16, cluster name `nimbus-pg`, etcd, no HAProxy, small shared_buffers / work_mem. Sketch: [`examples/group_vars/all/autobase.yml`](examples/group_vars/all/autobase.yml).

```bash
ansible-galaxy collection list | grep autobase
```

## Task 2. Deploy

```bash
cd ~/nimbus-pg
ansible-playbook -i inventory/hosts.ini vitabaks.autobase.deploy_pgcluster
```

First run is long (repos, etcd, Patroni, bootstrap replica). If a task wants HAProxy and you set it false, good. If it tries AWS, you leaked `cloud_provider`.

## Task 3. Proof

On `pg-01` (or any member):

```bash
sudo -iu postgres patronictl list
# or: sudo patronictl -c /etc/patroni/patroni.yml list
```

One **Leader**, two **Replica**, running. Write the **exact** `patronictl` command into the README.

```bash
# leader IP from patronictl — may still be pg-01
psql -h 192.168.58.10 -U postgres -c 'select pg_is_in_recovery();'
```

`f` on the leader, `t` on a replica. Superuser password: whatever Autobase put in vars — store it in Vault in [lesson 08](08-lab-objects.md), not in Slack.

## Task 4. Disk

Name PGDATA and `systemctl is-active patroni` (or the unit you found) in the README.

## Success criteria

- [ ] `patronictl list` healthy
- [ ] `psql` to the leader works
- [ ] etcd is up on all three (`systemctl is-active etcd` or the unit Autobase used)
- [ ] no HAProxy unless you documented it

Next: [05. Baseline](05-baseline.md).
