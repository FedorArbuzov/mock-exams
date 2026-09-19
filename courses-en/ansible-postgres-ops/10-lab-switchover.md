# 10. Lab: planned switchover

## Ticket

P2 — change window rehearsal

Move the leader off `pg-01` (or whoever it is) onto a replica. Prove `shop` is writable on the new leader. Run `objects.yml` again — it must still work.

## Task 1. Record

```text
patronictl list
psql leader -c "insert into nimbus_probe(ts) values (now());"
```

(Create a tiny `nimbus_probe` table if needed.)

## Task 2. Switchover

Prefer Autobase:

```bash
ansible-playbook -i inventory/hosts.ini vitabaks.autobase.switchover_pgcluster
```

If the extra-vars differ in 2.11.0, read the playbook header (`--list-tasks` / defaults). `patronictl switchover --force` on a member is acceptable if you document the exact command.

## Task 3. Proof

- new Leader name ≠ old
- insert into `nimbus_probe` on the **new** leader
- old leader `pg_is_in_recovery() = t`
- `ansible-playbook playbooks/objects.yml` still succeeds

## Success criteria

- [ ] one Leader, two Replica
- [ ] write succeeded on the new leader
- [ ] objects play did not assume `.10`

Next: [11. Change windows](11-change-window.md).
