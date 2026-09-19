# 18c. Lab: resync a secondary

## Ticket

P1 — secondary data untrusted

`mongo-03` is still the same LXC and IP. You do **not** recycle the VM (that was lesson 16). Data on the secondary is garbage. Rebuild it with **initial sync**.

Never run this against the PRIMARY. Never `rm -rf` `dbPath` on PRIMARY.

## Task 1. Pin a secondary

```text
mongodb_status / rs.status()
```

If `mongo-03` is PRIMARY, stepDown first (lesson 10). Confirm `mongo-03` is SECONDARY.

```bash
ansible mongo-03 -b -m service -a "name=mongod state=stopped"
```

`shop` stays writable on the PRIMARY. The other secondary stays up.

## Task 2. Wipe data on that secondary only

On **`mongo-03` only**:

```text
# dbPath from lesson 04 README — usually /var/lib/mongodb
sudo rm -rf /var/lib/mongodb/*
```

Start `mongod`. Watch `STARTUP2` → SECONDARY (`mongodb_status` poll). That is initial sync. You did not add/remove the member. You did not recreate the LXC.

If the member is stuck `REMOVED` / `FATAL`, then you use the lesson 16 path (`rs.remove` / add). That is a different ticket.

## Task 3. Proof

```text
mongodb_status
# mongosh on PRIMARY: rs.printSecondaryReplicationInfo()
```

`objects.yml` still green. You did not recreate the LXC.

## Success criteria

- [ ] `mongo-03` is SECONDARY, set converged
- [ ] PRIMARY never lost writes during resync
- [ ] replace (lesson 16) vs resync (this lab) is two bullets in the README
- [ ] you did not `rm` `dbPath` on PRIMARY

Next: [16b. Lab: majority trap](16b-lab-majority.md).
