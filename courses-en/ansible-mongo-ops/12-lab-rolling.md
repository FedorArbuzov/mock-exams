# 12. Lab: secondaries first, then PRIMARY

## Ticket

P2 — package/OS drill (here: `mongod` unit restart)

Restart every member without a dual-PRIMARY. Secondaries first.

## Task

`playbooks/preflight.yml`: `mongod` active, chrony, `mongodb_status` converged.

`playbooks/rolling-restart.yml`:

1. Discover PRIMARY (`mongodb_status`). Inventory group `mongo` is **all three** — after lesson 10, `.10` may be SECONDARY.
2. `serial: 1` restart `mongod` on hosts that are **not** PRIMARY. Wait until SECONDARY and a PRIMARY still exists.
3. `mongodb_stepdown` on the remaining PRIMARY, then restart that host. Wait until `mongodb_status` sees a PRIMARY.

Picture: [`examples/playbooks/rolling-restart.yml`](examples/playbooks/rolling-restart.yml) — a sketch.

## Success criteria

- [ ] three running at the end
- [ ] you did not restart PRIMARY and both secondaries in one blast
- [ ] `shop` still writable `w:"majority"`

Next: [13. Disaster kit](13-disaster-kit.md).
