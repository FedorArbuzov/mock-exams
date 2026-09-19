# 16b. Lab: majority / `w:3` trap

## Ticket

P1 — writes dead, members still “up”

Same idea as [`ansible-kafka-ops` min.isr](../ansible-kafka-ops/16b-lab-min-isr.md): the cluster looks fine, the **write contract** is wrong.

Two facts. Do not mix them.

| Situation | What happens |
|-----------|----------------|
| **One** secondary down | Quorum still elects. `w:"majority"` still works (majority of 3 = 2) |
| **Two** of three down | **No PRIMARY.** That is quorum, not writeConcern. Do not do this for the `w:3` drill |
| `w: 3` and **one** member down | Write fails / times out. That is tonight’s page |

## Task 1. Quorum (look, then undo)

On a healthy set, stop **two** members **only long enough to see** `mongodb_status` has no PRIMARY. Start them again. Wait until converged. You now know why “stop 2 of 3 to test majority” is the wrong trap.

## Task 2. Break the contract

Healthy cluster. Stop **one** SECONDARY (`mongo-03`).

```javascript
// on the PRIMARY — must succeed
db.nimbus_probe.insertOne({ts: new Date(), tag: "majority-ok"},
  {writeConcern: {w: "majority", wtimeout: 5000}})

// someone "hardened" the app to w:3
db.nimbus_probe.insertOne({ts: new Date(), tag: "w3"},
  {writeConcern: {w: 3, wtimeout: 5000}})
```

The second insert must **fail** (`WriteConcernError` / timeout). That is the page.

Do not set `w:1` “to unblock the shop.”

## Task 3. Close from git

`objects.yml` / group_vars is source of truth (`w: "majority"` for app writes if you declared it). Start `mongo-03`. Wait until `mongodb_status` is green. Majority write works. `w:3` can work again **only** with three members — you still do not ship `w:3` as the app default on a 3-node set.

## Success criteria

- [ ] you saw **no PRIMARY** with two members down, then recovered
- [ ] you saw `w:3` fail with one secondary down
- [ ] `w:"majority"` still worked with one secondary down
- [ ] you did not leave a member stopped

Next: [19. Monday + finale](19-lab-audit-finale.md).
