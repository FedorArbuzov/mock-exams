# 01. Why two Ansible trees

`community.mongodb` **is** Ansible. Teams still keep a second repository. This course is that second repository.

## The job story

Nimbus needs on-prem MongoDB that survives a node death. Three empty Linux boxes. You install a replica set with the Galaxy collection, then you own `shop`, planned stepDown, and backups. Nobody will pay you to rewrite `mongodb_mongod`. They will pay you when:

- `shop` / `shop_app` / indexes exist in git, not as a `mongosh` one-liner on whoever was PRIMARY last Tuesday;
- a planned stepDown happens before you patch the old PRIMARY;
- `mongo-03` disk dies and the member comes back as a SECONDARY;
- lag or disk pages and the fix is a playbook.

## Two trees

```text
~/.ansible/collections/.../community/mongodb/   pinned — you call roles + modules
  roles: mongodb_linux, mongodb_repository, mongodb_mongod, mongodb_auth
  modules: mongodb_replicaset, mongodb_user, mongodb_index, mongodb_status, mongodb_stepdown

~/nimbus-mongo/                                 you write this
  inventory/                    groups mongo + mongo_rs
  roles/common
  playbooks/cluster.yml         call their roles, then replicaset, then auth
  playbooks/objects.yml         users + indexes
  playbooks/preflight.yml
  playbooks/runbooks/
  playbooks/audit.yml
```

| Question | Answer |
|----------|--------|
| Who installs the repo, `mongod`, `mongod.conf`, keyfile? | `community.mongodb` roles |
| Who runs `rs.initiate`? | `mongodb_replicaset` — still the collection |
| Who creates `shop` / `shop_app` / indexes? | `nimbus-mongo` + the **same** collection’s modules |
| Who does `rs.stepDown` in a change window? | `mongodb_stepdown` **or** your wrapper — you still understand it |
| Who runs MongoDB **in** Kubernetes? | Not this course. No operator, no Helm |

If you edit files under the Galaxy collection, stop.

`community.mongodb` **is** the day-0 installer (same job Autobase does for Patroni). Day-2 objects stay in that collection. You do not switch to a second “Mongo modules” collection.

## Ready roles people name (and when)

| Name | Use |
|------|-----|
| **geerlingguy.mongodb**, a lone `apt install mongodb-org` | **one** `mongod`. Fine for laptop CI. **Not this course** |
| **community.mongodb** roles | HA replica set — we use this for day-0 |
| **community.mongodb** modules | day-2 **and** `rs.initiate` / auth — we use these after mongod exists |

## Checklist

- [ ] Two trees, two jobs
- [ ] You will not claim “I wrote the MongoDB role”
- [ ] [ENVIRONMENT.md](ENVIRONMENT.md) bridge `.59` is read

Next: [02. Lab: nodes](02-lab-nodes.md).
