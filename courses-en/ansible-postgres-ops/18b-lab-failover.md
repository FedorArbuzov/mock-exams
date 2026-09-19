# 18b. Lab: leader is dead

## Ticket

P1 — game day

Patroni on the **current Leader** is gone. This is **failover**, not switchover (lesson 10). Write to `shop` on the new leader. Bring the old node back as a replica.

Do not `pg_promote()` on a replica. Do not start Postgres by hand next to a live Patroni cluster.

## Task 1. Record

```text
patronictl list
```

Write down Leader name and the two replicas. Insert a row on the leader (`nimbus_probe` from lesson 10).

## Task 2. Kill the leader process, not the disk

```bash
ansible <leader-host> -b -m service -a "name=patroni state=stopped"
```

Wait 15–30s. `patronictl list` from a **living** node. If a new Leader is already there, you still run the official path once so the runbook exists:

```bash
ansible-playbook -i inventory/hosts.ini vitabaks.autobase.failover_pgcluster
```

Read the playbook header for extra-vars in 2.11.0. `patronictl failover --force` on a member is acceptable if you paste the exact command into the README.

If Autobase errors because a leader already exists — that is fine. Document it. The ticket is “writes work on the new leader,” not “the collection must always mutate.”

## Task 3. Proof

- new Leader name ≠ old
- insert into `nimbus_probe` / `shop` on the **new** leader
- `ansible-playbook playbooks/objects.yml --ask-vault-pass` still works
- start Patroni on the old leader — it must return as **Replica**, `pg_is_in_recovery() = t`

If the old node comes back as a second Leader, stop. That is split-brain. Do not write. Call for a human; do not `pg_promote` to “fix” it.

## Success criteria

- [ ] you used failover (or documented why Patroni already elected)
- [ ] write succeeded on the new leader
- [ ] old node is Replica after start
- [ ] you did not `pg_promote()`

Next: [18c. Lab: reinit a replica](18c-lab-reinit.md).
