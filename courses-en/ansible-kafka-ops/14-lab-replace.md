# 14. Lab: kafka-03 disk died

## Ticket

P1 — hardware

`kafka-03` disk is gone. Bring the same name and IP back. `shop.orders` must return to RF=3 / no URP.

## Task 1. Record identity

```bash
kafka-topics --bootstrap-server 192.168.57.10:9092 --describe --topic shop.orders
```

Write broker ids and replica lists into `artifacts/pre-replace.txt`.

## Task 2. Recycle the LXC

Stop units on `kafka-03` if they still answer. Then recreate the container: **same** `kafka-03` / `192.168.57.12` as [lesson 02](02-lab-nodes.md) (`lxc delete --force` + launch + SSH).

`ansible kafka-03 -m ping` must work again. `common` on `--limit kafka-03`.

## Task 3. Install Kafka on the new disk

From `~/nimbus-kafka`, Confluent playbook **`--limit kafka-03`** if that is enough for 7.9.2; if the collection needs the full inventory to rewrite quorum voters, run the same `--tags` as lesson 04 (idempotent on 01/02).

Wait until the new broker process is `active` and appears in describe (new or old id).

## Task 4. Replicas

If URP remains because the old id is dead:

1. Build a reassignment that includes the **new** id for every `shop.orders` / `shop.dead` partition.
2. Apply it (`kafka-reassign-partitions` / current flag names for 7.9 — read `--help`, do not memorize a 2018 blog).
3. Wait until `--under-replicated-partitions` is empty.

Keep the JSON under `~/nimbus-kafka/artifacts/` (gitignore data, keep a **template** in git).

## Success criteria

- [ ] three processes active
- [ ] `shop.orders` RF=3, URP empty
- [ ] `pre-replace.txt` + what you ran are in `artifacts/` or the README
- [ ] README: replace order in six bullets

Next: [15. Runbooks](15-runbooks.md).
