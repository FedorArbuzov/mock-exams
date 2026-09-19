# 18c. Lab: readonly replica

## Ticket

P1 — replica data untrusted

Force **one** replica readonly or broken. Get it **writable** with the runbook. Do not wipe all three datadirs. Do not recycle the LXC (that was lesson 16).

Prefer `ch-02`. If it is the only node you like to SSH to, pick `ch-03` instead. Never break two replicas at once.

## Task 1. Break one replica (pick one)

**A (preferred, reversible):** on **that host only** — no `ON CLUSTER`:

```sql
DETACH TABLE shop.events;
```

`shop.events` is gone locally. Other replicas still serve inserts.

**B:** stop `clickhouse-server` on that host. Optional **careful** junk: a file **next to** (not instead of) the table dir is enough to scare `df`; do **not** `rm -rf` `data/shop/events`. Start the server. If it comes back clean, use A.

**C:** stop the server, wait, start — if `is_readonly=1` / `is_session_expired=1`, you are already in the runbook. Do not also DETACH.

Confirm from a **living** replica: inserts still work (`insert_quorum=2`).

## Task 2. Runbook

```bash
cd ~/nimbus-ch
ansible-playbook playbooks/runbooks/readonly.yml --limit <broken-host>
```

The play should:

1. print `system.replicas` / `EXISTS TABLE`
2. `ATTACH TABLE shop.events` if detached
3. `SYSTEM RESTART REPLICA shop.events`
4. `SYSTEM RESTORE REPLICA shop.events` if still broken
5. wait `is_readonly = 0`

Adjust the sketch ([`examples/playbooks/runbooks/readonly.yml`](examples/playbooks/runbooks/readonly.yml)). You may run `clickhouse-client` by hand **once** to learn the command, then put it in the playbook.

## Task 3. Proof

```sql
-- on the repaired host
SELECT count() FROM shop.events;
SELECT is_readonly, queue_size FROM system.replicas WHERE table = 'events';
```

Counts catch up. Other two nodes were never wiped.

## Success criteria

- [ ] one replica was broken on purpose
- [ ] inserts worked on the living replicas during the break
- [ ] repaired replica writable, data back
- [ ] you did not `rm -rf /var/lib/clickhouse` on all three
- [ ] replace (lesson 16) vs readonly restore (this lab) is two bullets in the README

Next: [19. Monday + finale](19-lab-audit-finale.md).
