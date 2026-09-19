# Zabbix — ops

Hands-on **host monitoring** the way an on-prem shop actually runs it: **Zabbix 7.0 LTS** in Compose on the control node, **`zabbix-agent2`** on three LXC hosts, then **your** Ansible repo (`nimbus-zabbix`) owns the agent. You use the UI for templates, the inode trap, a maintenance window, and a webhook action.

This is **not** Prometheus, **not** Grafana, **not** Helm, and **not** a Zabbix HA / proxy farm.

**Time:** ~5–7 hours.  
**Prerequisites:** [`ansible-basic`](../ansible-basic/README.md) (inventory, roles, handlers) and enough Linux to read `df -h` / `df -i`. [`observability-basic`](../observability-basic/README.md) is optional contrast — different product.

> You work on a live server. There is **no** Interactive Check. Each lab has success criteria; [`examples/scripts/verify.sh`](examples/scripts/verify.sh) is an author picture — keep a copy under `~/nimbus-zabbix`.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/zabbix-ops/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once — LXD profile `zbx`, Docker Engine, no Zabbix yet.
2. **Read** the theory page (why this check exists).
3. **Do** the lab on the 16 GB host. Lesson 02 starts Compose **and** the three nodes.
4. **Check** the lesson checklist. Second agent playbook run should be mostly `changed=0`.

Keep one terminal on the LXD host and the courses UI in the browser. Zabbix web is `http://<host>:8080`.

Do **not** run any [`ansible-*-ops`](../ansible-k8s-ops/README.md) stand or [`observability-basic`](../observability-basic/README.md) Compose on the same host at the same time — RAM.

---

## Local stand

```text
host (LXD + Docker)    Ansible + Compose (Postgres, zabbix-server, web :8080)
node-01  .10           zabbix-agent2
node-02  .11           zabbix-agent2
node-03  .12           zabbix-agent2
```

| Piece | Role |
|-------|------|
| LXD | three Ubuntu 22.04 on `192.168.61.0/24`, **512 MiB** each |
| Docker Compose | Zabbix **7.0 LTS** + Postgres 16 — control node only |
| Ansible ≥ 2.15 | `roles/zabbix-agent` in `~/nimbus-zabbix` |
| Workspace | `~/nimbus-zabbix` |

[`examples/`](examples/README.md) is an author reference. You type the repo. Do not copy-paste the tree blindly and call it done.

---

## Curriculum

1. [Why Zabbix, not scrape](01-why-zabbix.md)
2. [Lab: server, nodes, agent role](02-lab-stand.md)
3. [Lab: Linux template and Latest data](03-lab-template.md)
4. [Lab: disk page, `df` is fine](04-lab-inode.md)
5. [Maintenance and actions](05-maintenance.md)
6. [Lab: patch window + UserParameter](06-lab-window.md)

---

## What you should end up with

- Name **host / template / item / trigger / action / maintenance** and say how that is not a Prometheus scrape.
- Pin Zabbix **7.0 LTS** Compose on the control node and write the image digests.
- Install `zabbix-agent2` with Ansible on three hosts; second run clean.
- Attach **Linux by Zabbix agent**, wait for Latest data, read a macro.
- Fire an **inode** trigger while `df -h` looks healthy; write a six-line postmortem.
- Open a **maintenance** window so a problem does not page; land a **webhook** line in a file.
- Ship a **UserParameter** and an item that is not in the vendor template.

## Path

```text
ansible-basic (+ linux df/sshd)
        ↓
zabbix-ops   ← Compose server + 3 LXC agents → nimbus-zabbix
        ↓
ansible-*-ops / observability-basic (other stands, other weeks)
```

## Related

| Course | Relation |
|--------|----------|
| [`ansible-basic`](../ansible-basic/README.md) | Inventory, roles, handlers — this course **uses** them |
| [`observability-basic`](../observability-basic/README.md) | Prometheus / Grafana — **other** model, other Compose project |
| [`linux-intermediate`](../linux-intermediate/README.md) | `df`, DNS, `ss` — you will need them on the inode ticket |
| [`sre`](../sre/README.md) | Postmortems; this course writes one short one |
| [`bare-metal`](../bare-metal/README.md) | iDRAC / IPMI — words for “Zabbix proxy + SNMP on BMC”, not a lab |
| [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) | Same ops-repo idea. Bridge `.56` — do not mix RAM |
| [`ansible-clickhouse-ops`](../ansible-clickhouse-ops/README.md) | Bridge `.60` — do not mix RAM |
