# 18b. Lab: PRIMARY is dead

## Ticket

P1 — game day

`mongod` on the **current PRIMARY** is gone. This is **failover**, not stepDown (lesson 10). Write to `shop` on the new PRIMARY with `w:"majority"`. Bring the old node back as a SECONDARY.

Do not `rs.initiate` again. Do not `rm` `dbPath` on anyone.

## Task 1. Record

```text
mongodb_status / rs.status()
```

Write down PRIMARY name and the two secondaries. Insert a row on the PRIMARY (`nimbus_probe` from lesson 10).

## Task 2. Kill the PRIMARY process, not the disk

```bash
ansible <primary-host> -b -m service -a "name=mongod state=stopped"
```

Wait 10–20s. `mongodb_status` from a **living** node (`validate: minimal` if the down member makes `default` unhappy — read the module). A new PRIMARY must appear. Two of three voters is still a quorum.

## Task 3. Proof

- new PRIMARY name ≠ old
- `insertOne` with `w:"majority"` on the **new** PRIMARY
- `ansible-playbook playbooks/objects.yml --ask-vault-pass` still works
- start `mongod` on the old PRIMARY — it must return as **SECONDARY**

If the old node comes back as a second PRIMARY, stop. That is split-brain. Do not write.

## Success criteria

- [ ] election happened (you did not stepDown)
- [ ] `w:"majority"` write succeeded on the new PRIMARY
- [ ] old node is SECONDARY after start
- [ ] you did not `rs.initiate` again

Next: [18c. Lab: resync](18c-lab-resync.md).
