# 04. Lab: install the replica set

Install MongoDB on the empty nodes from [lesson 02](02-lab-nodes.md). Do **not** skip `mongodb_replicaset`.

## Task 1. Vars

`group_vars/all/mongodb.yml`: MongoDB **7.0**, replica set **`nimbus`**, bind so members can see each other, `sharding` off, `nimbus_bootstrap: mongo-01`. Sketch: [`examples/group_vars/all/mongodb.yml`](examples/group_vars/all/mongodb.yml).

Read **role defaults** for the exact names (`repl_set_name`, `bind_ip`, keyfile, `mongodb_version`). Copy only what you set into the README.

```bash
ansible-galaxy collection list | grep mongodb
```

Must show **1.7.12**.

## Task 2. Install

`playbooks/cluster.yml`: collection roles, then `pymongo` on targets, then `mongodb_replicaset` **once** on `nimbus_bootstrap`, then `mongodb_status`, then the `mongodb_auth` role. Picture: [`examples/playbooks/cluster.yml`](examples/playbooks/cluster.yml) — a sketch, not a dump of every default.

```bash
cd ~/nimbus-mongo
ansible-playbook playbooks/cluster.yml
```

First run is long (repo, packages, initiate, auth restart). If a task wants `mongos` or `clusterRole: shardsvr`, you leaked sharding.

## Task 3. Proof

On any member (auth as the admin the role created):

```bash
sudo mongosh --eval 'rs.status()'
# after auth:
# mongosh -u admin -p ... --authenticationDatabase admin --eval 'rs.status()'
```

One **PRIMARY**, two **SECONDARY**. Write the **exact** `mongosh` command into the README.

`mongo-01` is often PRIMARY the first day. That is not a contract.

Member names in `rs.initiate` must resolve on every node (`/etc/hosts` for `mongo-01`…`mongo-03`, or use IPs and map them in `objects.yml`). `mongodb_status` returns those names when you look up PRIMARY.

## Task 4. Disk

Name `dbPath` and `systemctl is-active mongod` in the README.

## Success criteria

- [ ] `rs.status()` — one PRIMARY, two SECONDARY
- [ ] `mongod` active on all three
- [ ] no `mongos`, no config-server role
- [ ] collection is 1.7.12

Next: [05. Baseline](05-baseline.md).
