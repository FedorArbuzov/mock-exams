# 16. Lab: pg-03 disk died

## Ticket

P1 — hardware

Bring `pg-03` / `.12` back as a replica.

## Task

1. Switchover if `pg-03` is Leader
2. Recycle LXC (lesson 02 recipe)
3. `site.yml --limit pg-03`
4. `vitabaks.autobase.add_node` or the `new_node=true` inventory flag — follow **this** collection’s README
5. `patronictl list` — three members, `pg-03` Replica
6. `objects.yml` green

Write the exact Autobase extra-vars you used in the README.

## Success criteria

- [ ] three running
- [ ] `shop` writable on the leader
- [ ] replace order in six bullets

Next: [17. Runbooks](17-runbooks.md).
