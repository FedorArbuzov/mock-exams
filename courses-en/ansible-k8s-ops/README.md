# Ansible — Kubernetes ops

Hands-on **day-0 + day-2** on three Linux nodes: **Kubespray** installs the cluster, then **your** Ansible repo (`nimbus-ops`) owns access, hygiene, patch windows, backups, node replace, and runbooks.

This is **not** Helm, **not** GitOps, and **not** “write kubeadm roles again”. Kubespray is a pinned checkout you call. Everything else is playbooks you can explain.

**Time:** ~12–16 hours + **1–2 hours** finale.  
**Prerequisites:** [`ansible-basic`](../ansible-basic/README.md) (inventory, roles, Vault, `serial`, tags) and [`kuber-intermediate`](../kuber-intermediate/README.md) (nodes, drain, kubelet). You **build the stand in this course**: three empty LXC nodes, then Kubespray, then `nimbus-ops`. Do not reuse a cluster from another track.

> You work on a live cluster. There is **no** Interactive Check. Each lab has success criteria; the finale uses [`examples/scripts/verify.sh`](examples/scripts/verify.sh) as an author picture — you keep a copy under `~/nimbus-ops`.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/ansible-k8s-ops/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once — tools and the LXD profile on the 16 GB host. No Kubernetes yet.
2. **Read** the theory page (why this playbook exists).
3. **Do** the lab on the host. Lesson 02 creates three empty nodes. Lesson 04 runs `cluster.yml`. Then you write `~/nimbus-ops`. Early install labs are explicit; from access onward you design the role.
4. **Check** the lesson checklist. Second playbook run should be mostly `changed=0` unless the ticket says reboot.

Keep one terminal on the LXD host and the courses UI in the browser. Do **not** point `KUBECONFIG` at Docker Desktop.

---

## Local stand

```text
host (LXD)     Ansible + kubectl     control node — not an LXC
node-01  .10   control-plane + etcd
node-02  .11   worker
node-03  .12   worker
```

| Piece | Role |
|-------|------|
| LXD / Incus (or Vagrant) | three Ubuntu 22.04 nodes |
| Ansible ≥ 2.15 | on the host |
| Kubespray `v2.27.0` | sibling checkout, not inside `nimbus-ops` roles |
| `kubectl` | after `cluster.yml`, kubeconfig `~/.kube/nimbus-ops.conf` |
| Workspace | `~/nimbus-ops` |

**RAM:** **16 GB** on the machine that runs the three nodes. Turn **off** Docker Desktop Kubernetes while this stand is up.

[`examples/`](examples/README.md) is an author reference. You type the repo. Do not copy-paste the tree blindly and call it done.

---

## Curriculum

### Cluster (01–04)

1. [Why two Ansible trees](01-why-nimbus-ops.md)
2. [Lab: nodes and an empty ops repo](02-lab-nodes.md)
3. [Kubespray: what you own](03-kubespray.md)
4. [Lab: install the cluster](04-lab-cluster.md)

### Baseline and people (05–08)

5. [Baseline next to Kubespray](05-baseline.md)
6. [Lab: role `common`](06-lab-baseline.md)
7. [Access lifecycle](07-users.md)
8. [Lab: hire Lena, fire the contractor](08-lab-users.md)
8b. [Lab: who can reach the API](08b-lab-api-listen.md)

### Hygiene and a change window (09–12)

9. [Disk and journal before the ticket](09-hygiene.md)
10. [Lab: role `node-hygiene`](10-lab-hygiene.md)
11. [Change windows](11-change-window.md)
12. [Lab: preflight and patch workers](12-lab-patch.md)

### Backup and replace (13–16)

13. [Disaster kit](13-disaster-kit.md)
14. [Lab: etcd + PKI + inventory](14-lab-backup.md)
14b. [Lab: restore order (do not run)](14b-lab-restore-talk.md)
15. [Replace a worker](15-replace-node.md)
16. [Lab: node-03 disk died](16-lab-replace.md)

### Incidents and Monday (17–21)

17. [Runbooks, not heroics](17-runbooks.md)
18. [Lab: DiskPressure](18-lab-incident.md)
18b. [Lab: etcd / control plane down](18b-lab-etcd.md)
19. [Monday morning](19-monday.md)
20. [Lab: audit, certs, clock](20-lab-audit.md)
21. [Final project: someone else can run the repo](21-final-project.md)

---

## What you should end up with

- Install Kubernetes with Kubespray and say what you must **not** edit inside that tree.
- Keep a second repo that does users, sshd, chrony, journald, and prune timers without restarting kubelet on every run.
- Drain → patch → reboot → uncordon workers one at a time, and **stop the fleet** if a node does not come back.
- Fetch etcd snapshot + `/etc/kubernetes/pki` + inventory to the control node; prove the snapshot with `etcdutl`.
- Replace a worker with `remove-node` / reset / `scale.yml` and put labels back from `host_vars`.
- Close DiskPressure with a playbook you can run twice.
- Survive a single-node etcd outage: API dies, worker containers stay, static manifest comes back — no second CP, no snapshot restore.
- Fail a Monday `audit.yml` when root login is back or the backup cron is gone.

## Path

```text
ansible-basic + kuber-intermediate
        ↓
ansible-k8s-ops   ← empty LXC → Kubespray → nimbus-ops
        ↓
kuber-advanced / gitlab-cicd
```

[`kuber-bootstrap`](../kuber-bootstrap/README.md) / [`kuber-cka`](../kuber-cka/README.md) are **other** tracks (kubeadm by hand, CKA). Do not import their cluster into this course.

## Related

| Course | Relation |
|--------|----------|
| [`ansible-basic`](../ansible-basic/README.md) | Inventory, roles, Vault, `serial` — this course **uses** them |
| [`kuber-intermediate`](../kuber-intermediate/README.md) | Drain, kubelet, nodes — API skills, different stand |
| [`kuber-bootstrap`](../kuber-bootstrap/README.md) | Optional later: write kubeadm roles instead of calling Kubespray |
| [`kuber-cka`](../kuber-cka/README.md) | Optional later: CKA / ON-CALL on a **separate** Kubespray stand |
| [`gitlab-cicd`](../gitlab-cicd/README.md) | Later: lint / `--syntax-check` / `--check` on this repo |
| [`kuber-advanced`](../kuber-advanced/README.md) | Helm / Argo / Velero — not this course |
| [`ansible-kafka-ops`](../ansible-kafka-ops/README.md) | Same ops-repo idea for **Kafka**. Other LXC bridge — do not mix RAM |
| [`ansible-postgres-ops`](../ansible-postgres-ops/README.md) | Same ops-repo idea for **Patroni**. Bridge `.58` — do not mix RAM |
| [`ansible-mongo-ops`](../ansible-mongo-ops/README.md) | Replica set on `.59` — do not mix RAM |
| [`ansible-clickhouse-ops`](../ansible-clickhouse-ops/README.md) | ClickHouse + Keeper on `.60` — do not mix RAM |
| [`zabbix-ops`](../zabbix-ops/README.md) | Host monitoring (Zabbix 7). Bridge `.61` — do not mix RAM |
