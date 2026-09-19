# 21. Lab: `nimbus_clickhouse_table`

## Ticket

P2 — platform

`schema.yml` second run must be `changed=0` on the table task. `audit.yml` must fail if `shop.events` is gone **without** creating it. `--check` must not run DDL.

## Task 1. Library path

```text
~/nimbus-ch/library/nimbus_clickhouse_table.py
~/nimbus-ch/ansible.cfg    # library = library
```

Picture: [`examples/library/nimbus_clickhouse_table.py`](examples/library/nimbus_clickhouse_table.py).

`EXISTS TABLE db.table` via `clickhouse-client --query`. Identifiers: `[A-Za-z0-9_]+` only — fail otherwise. Do not interpolate raw YAML into SQL without that check.

```bash
ansible-doc -M library nimbus_clickhouse_table
```

Must print your DOCUMENTATION block.

## Task 2. Replace the command tasks

In `playbooks/schema.yml`, the table (and optionally the database) uses the module, `run_once`, `state: present`, full `ON CLUSTER` DDL from [lesson 07](07-schema.md). `users.d` stays a role-like `copy`.

```bash
ansible-playbook playbooks/schema.yml --ask-vault-pass
ansible-playbook playbooks/schema.yml --ask-vault-pass
```

Second run: table task **ok**, not changed.

```bash
ansible-playbook playbooks/schema.yml --ask-vault-pass --check --diff
```

On a healthy stand: no changed on the table. Then, on one node only for the drill:

```bash
# lab only — DROP on a throwaway name, not shop.events, if you still need shop
clickhouse-client --query "CREATE DATABASE IF NOT EXISTS nimbus ON CLUSTER nimbus"
```

Prove `--check` on a **missing** table (`nimbus.probe_module`): `changed=true`, `EXISTS` still 0. Then apply for real.

## Task 3. Audit uses `state: exists`

Replace the `EXISTS` + `assert` in `audit.yml` with the same module, `state: exists`. Drop `shop.events` **only if you can recreate it** from `schema.yml` in the same sitting — or assert against a name you then restore.

Safer drill: point `exists` at `shop.events` while healthy (green). Temporarily rename in the play to `shop.nope` — audit red. Put it back. Do not leave the shop table dropped.

## Success criteria

- [ ] `ansible-doc` shows the module
- [ ] second `schema.yml` does not report changed on the table
- [ ] `--check` does not CREATE
- [ ] audit `state: exists` fails when the table name is wrong
- [ ] you did not publish a Galaxy collection

Next: you are done. Re-run [19](19-lab-audit-finale.md) if the finale list now includes the module.
