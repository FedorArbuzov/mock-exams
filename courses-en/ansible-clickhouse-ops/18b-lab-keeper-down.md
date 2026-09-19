# 18b. Lab: one Keeper down

## Ticket

P1 — game day

Stop **`clickhouse-keeper` on one node only**. The cluster must still take inserts. Then start Keeper. Run `keeper-health.yml`.

Do **not** stop two Keepers. Two is loss of quorum. That is not this ticket.

## Task 1. Record

```text
systemctl is-active clickhouse-keeper   # all three
```

```sql
SET insert_quorum = 2;
INSERT INTO shop.events VALUES (now(), 18, 'before-keeper-down');
```

## Task 2. Stop one Keeper

```bash
ansible ch-03 -b -m service -a "name=clickhouse-keeper state=stopped"
ansible clickhouse_keeper -b -m command -a "systemctl is-active clickhouse-keeper"
```

Exactly **one** `inactive` / `failed`. Servers stay up.

From `ch-01`:

```sql
SET insert_quorum = 2;
INSERT INTO shop.events VALUES (now(), 19, 'during-keeper-down');
SELECT is_readonly, is_session_expired FROM system.replicas WHERE table = 'events';
```

Insert must succeed. If a **server** went readonly, you stopped the wrong unit or lost two Keepers — stop and fix.

## Task 3. Start and health

```bash
ansible ch-03 -b -m service -a "name=clickhouse-keeper state=started"
ansible-playbook playbooks/runbooks/keeper-health.yml
```

Three Keepers active. Insert again. No readonly.

## Success criteria

- [ ] writes worked with one Keeper down
- [ ] you did not stop a second Keeper
- [ ] `keeper-health.yml` is the close-out, not a unique SSH novel
- [ ] `shop.events` writable at the end

Next: [18c. Lab: readonly](18c-lab-readonly.md).
