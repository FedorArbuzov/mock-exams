# 10. Lab: planned stepDown

## Ticket

P2 — change window rehearsal

Move PRIMARY off `mongo-01` (or whoever it is) onto a SECONDARY. Prove `shop` is writable on the new PRIMARY with `w:"majority"`. Run `objects.yml` again — it must still work. It must **discover PRIMARY**, not assume `.10`.

## Task 1. Record

```text
mongodb_status / rs.status()
# on current PRIMARY
db.nimbus_probe.insertOne({ts: new Date()}, {writeConcern: {w: "majority", wtimeout: 5000}})
```

(Create `nimbus_probe` in `shop` if needed.)

## Task 2. stepDown

```bash
# discover PRIMARY, then:
# community.mongodb.mongodb_stepdown  (login as admin, replica_set nimbus)
```

Picture for a gated wrapper: [`examples/playbooks/runbooks/stepdown.yml`](examples/playbooks/runbooks/stepdown.yml). Calling the module from an ad-hoc play is acceptable if you paste the exact task into the README.

`mongosh` `rs.stepDown()` on the PRIMARY is acceptable if you document the exact command. Prefer the module.

## Task 3. Proof

- new PRIMARY name ≠ old
- `insertOne` with `w:"majority"` on the **new** PRIMARY
- old PRIMARY is SECONDARY
- `ansible-playbook playbooks/objects.yml --ask-vault-pass` still succeeds

## Success criteria

- [ ] one PRIMARY, two SECONDARY
- [ ] `w:"majority"` write succeeded on the new PRIMARY
- [ ] objects play did not assume `.10`

Next: [11. Change windows](11-change-window.md).
