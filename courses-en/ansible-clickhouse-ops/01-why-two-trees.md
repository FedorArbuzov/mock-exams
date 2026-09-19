# 01. Why two Ansible trees

There is **no** official Autobase or Kubespray for ClickHouse. Teams still keep two jobs in one repo. This course is that repo.

## The job story

Nimbus needs on-prem ClickHouse that survives a node death. Three empty Linux boxes. You install Server + Keeper from the **official apt repo**, freeze the cluster XML, then you own schema, restarts, and backups. Nobody will pay you to rewrite `remote_servers` during an incident. They will pay you when:

- `shop.events` exists in git as `CREATE TABLE … ON CLUSTER`, not as a `clickhouse-client` one-liner on `ch-01`;
- a CVE forces a **server** restart one at a time while inserts still land;
- `ch-03` disk dies and the replica comes back without a new `server_id`;
- a replica goes **readonly** and the fix is a playbook, not `rm -rf` on three datadirs.

That work is Ansible over SSH. It is not Helm. It is not the Altinity operator.

## Two trees (one repo)

```text
~/nimbus-ch/                                 you write this
  roles/cluster                              frozen installer
    official apt, 24.8 packages
    config.d: macros, remote_servers, zookeeper/keeper
    keeper_config (raft, server_id)
  roles/common                               chrony, sshd
  playbooks/schema.yml                       ON CLUSTER + users.d
  playbooks/preflight.yml
  playbooks/rolling-restart.yml
  playbooks/backup-cluster.yml
  playbooks/runbooks/
  playbooks/audit.yml
```

| Question | Answer |
|----------|--------|
| Who installs packages, `config.d`, Keeper raft? | `roles/cluster` — you write it **once** (lessons 03–04) |
| Who creates `shop` / `shop.events`? | `playbooks/schema.yml` |
| Who edits `remote_servers.xml.j2` during a Sunday page? | **Nobody.** That is an installer change, not an incident |
| Who runs ClickHouse **in** Kubernetes? | Helm / Altinity — **out of scope**. Other stand |

After [lesson 04](04-lab-cluster.md) you do **not** edit cluster templates to “fix” replication. Day-2 lives in `playbooks/`.

If you find yourself pasting XML into `/etc/clickhouse-server/config.xml` by hand, stop. Drop a file in `config.d` from the role, or write a playbook.

## Ready roles people name (and when)

| Name | Use |
|------|-----|
| **`anhnt094.clickhouse`**, **AlexeySetevoi.clickhouse**, random Galaxy “clickhouse” | someone’s install script. Not an official product. Not this course’s day-0 |
| **Altinity operator / Helm** | Kubernetes. Not three LXC |
| **Official apt + your `config.d`** | on-prem VMs — we use this |

A Galaxy role that writes one giant `config.xml` is how you spend a Sunday merging vendor defaults. `config.d` fragments are the job.

## Checklist

- [ ] Two trees, two jobs — installer vs day-2
- [ ] You will not claim “I used the official ClickHouse Ansible collection”
- [ ] [ENVIRONMENT.md](ENVIRONMENT.md) bridge `.60` is read

Next: [02. Lab: nodes](02-lab-nodes.md).
