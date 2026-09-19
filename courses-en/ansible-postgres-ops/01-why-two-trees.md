# 01. Why two Ansible trees

Autobase **is** Ansible. Teams still keep a second repository. This course is that second repository.

## The job story

Nimbus needs on-prem Postgres that survives a node death. Three empty Linux boxes. You install Patroni with `vitabaks.autobase.deploy_pgcluster`, then you own databases, switchovers, and backups. Nobody will pay you to rewrite their Patroni role. They will pay you when:

- `shop` and `shop_app` exist in git, not as a `psql` one-liner on the leader;
- a planned switchover happens before you patch the old primary;
- `pg-03` disk dies and the member comes back as a replica;
- lag or connections page and the fix is a playbook.

## Two trees

```text
~/.ansible/collections/.../vitabaks/autobase/   pinned — you call playbooks
  deploy_pgcluster, switchover_pgcluster, add_node, …

~/nimbus-pg/                                    you write this
  inventory/                    Autobase groups + your groups
  roles/common
  playbooks/objects.yml         community.postgresql
  playbooks/preflight.yml
  playbooks/runbooks/
  playbooks/audit.yml
```

| Question | Answer |
|----------|--------|
| Who installs etcd, Patroni, Postgres, `postgresql.conf`? | Autobase |
| Who creates `shop` / `shop_app`? | `nimbus-pg` + `community.postgresql` |
| Who does `patronictl failover` in anger? | Autobase `failover_pgcluster` **or** your wrapper — you still understand it |
| Who runs Postgres **in** Kubernetes? | [`kuber-postgres`](../kuber-postgres/README.md) |

If you edit files under the Galaxy collection, stop.

## Ready roles people name (and when)

| Name | Use |
|------|-----|
| **ANXS.postgresql**, **geerlingguy.postgresql**, **linux-system-roles.postgresql** | **one** instance. Fine for a laptop CI database. Not this course |
| **claranet.postgresql** | rich single-node / object management; Patroni is a **sister** role |
| **`community.postgresql`** | **day-2 modules** — we use these after Autobase |
| **vitabaks.autobase** | HA cluster — we use this for day-0 |

## Checklist

- [ ] Two trees, two jobs
- [ ] You will not claim “I wrote Patroni”
- [ ] [ENVIRONMENT.md](ENVIRONMENT.md) bridge `.58` is read

Next: [02. Lab: nodes](02-lab-nodes.md).
