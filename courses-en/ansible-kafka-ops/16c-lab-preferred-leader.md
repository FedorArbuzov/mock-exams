# 16c. Lab: preferred replica election

## Ticket

P3 — after a bounce

`shop.orders` is writable. URP is empty. Leadership sits on the broker that happened to be last up. On-call wants preferred replicas back (first replica in the replica list) without a rolling restart.

## Task 1. Unbalance

Stop `kafka-03` for ~20s, start it, wait URP empty. Describe `shop.orders`:

```text
kafka-topics --bootstrap-server 192.168.57.10:9092 --describe --topic shop.orders
```

At least one partition should have `Leader` ≠ first replica (`Replicas:` list). If not, bounce `kafka-02` the same way once.

## Task 2. Playbook

`playbooks/runbooks/preferred-election.yml`. One living broker, `run_once`.

```text
kafka-leader-election --bootstrap-server {{ nimbus_bootstrap }} \
  --election-type PREFERRED --all-topic-partitions
```

(Old CLI name `kafka-preferred-replica-election` — use what 7.9.2 shipped.)

Author picture: [`examples/playbooks/runbooks/preferred-election.yml`](examples/playbooks/runbooks/preferred-election.yml).

```bash
ansible-playbook playbooks/runbooks/preferred-election.yml
```

Describe again. Leaders should match the preferred replica. URP still empty. Produce one line with `acks=all`.

Do not `--election-type UNCLEAN`. That is data loss, not this ticket.

## Success criteria

- [ ] you recorded a partition whose leader was not preferred
- [ ] after the play, leaders are preferred
- [ ] URP empty, produce works
- [ ] second run is safe (no-op or “already preferred”)

Next: [17. Monday morning](17-monday.md).
