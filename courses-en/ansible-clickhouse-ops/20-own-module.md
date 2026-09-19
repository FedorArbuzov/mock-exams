# 20. When you write a module

Lessons 07–08 used `ansible.builtin.command` + `clickhouse-client`. That is honest: there is no `community.clickhouse` you must learn.

It is also a lie about **state**. `CREATE TABLE IF NOT EXISTS` via `command` is `changed=true` every run unless you hand-write `changed_when` on a regex. `--check` still “changes.” Monday audit parses `EXISTS` stdout.

That is the job of a **module**, not another role.

## Module vs role vs collection

| You write | When |
|-----------|------|
| Role | files, units, `config.d`, users.d — many tasks, handlers |
| Playbook | order: preflight → mutate → wait |
| **Module** (`library/*.py`) | **one** resource: exists or not; `changed` is boolean; `--check` is real |
| Galaxy collection | you are publishing for other teams. Not this course |

Postgres and Mongo already have collection modules. Kubernetes has `kubernetes.core`. Wrapping `systemctl` is a `service` task. Do not write a module for those.

ClickHouse **client idempotency** is the gap in this repo. That is not “Ansible instead of migrations.”

App schema still belongs in Flyway / Liquibase / numbered SQL in the **app** CI ([lesson 07](07-schema.md)). The module exists because *when* ops owns a `CREATE … ON CLUSTER`, `command` cannot say `changed` or honour `--check`. A migration runner has the same problem if it shells out without a catalog lookup — then you wrap **that** CLI, not `system.tables` twice.

## Contract

`library/nimbus_clickhouse_table.py` runs **on the node** (needs `clickhouse-client`). Ansible copies it because `ansible.cfg` has `library = library`.

```yaml
- name: shop.events
  nimbus_clickhouse_table:
    database: shop
    table: events
    ddl: |
      CREATE TABLE IF NOT EXISTS shop.events ON CLUSTER nimbus (...)
    state: present
  run_once: true
```

| `state` | Mutate | Fail if missing |
|---------|--------|-----------------|
| `present` | CREATE when `EXISTS` is 0 | no |
| `exists` | never | yes — Monday |

`--check` + `present`: if the table is missing, `changed=true` and **no** DDL.

The module does **not** invent `ON CLUSTER`. You pass the DDL. The module owns **idempotency**, not SQL design.

## What you do not write

- A second ClickHouse installer
- A module that `rm -rf` `/var/lib/clickhouse`
- Python against the native protocol — `clickhouse-client --query` is enough on this stand

## Checklist

- [ ] You can say why `command` + `changed_when: true` is a Monday lie
- [ ] Module ≠ role ≠ collection
- [ ] You will not write `nimbus_systemd.py`

Next: [21. Lab: `nimbus_clickhouse_table`](21-lab-module.md).
