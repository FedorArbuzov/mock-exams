# 13. Replace a broker

You do not have a fourth LXC. The disk on `kafka-03` died. The **same** name and IP come back as a new OS.

```text
preflight
stop kafka-03 (already dead if the disk is gone)
note broker.id from cluster metadata
recreate LXC (same IP)
common
confluent.platform --limit kafka-03   (or full play if the collection requires quorum knowledge)
wait until the new process is in the cluster
move replicas back (reassignment) if the new broker.id is new
```

## Broker id

If the new node gets a **new** `broker.id`, old replicas that pointed at the dead id stay under-replicated until you reassign. If Confluent Ansible reuses the id from inventory/`node_id`, metadata may still expect old log dirs — then you have a unclean directory problem.

Lab honesty: write down `broker.id` **before** the wipe (`kafka-broker-api-versions` or `kafka-metadata` / describe). After reinstall, compare. The playbook you keep is “reassign partitions of `shop.*` onto the three **current** ids.”

`kafka-reassign-partitions.sh` (or `kafka-reassignments` in newer CLI) is the tool. Generate a JSON that places each partition on all three living brokers. This is slow on large clusters; here you have two tiny topics.

## Do not

- delete `__consumer_offsets` to “make URP go away”
- run `confluent.platform.all` against **all** hosts as a panic button while two are healthy (it should be idempotent, but it is a long blast radius)
- keep the dead Node in monitoring and ignore URP

## Checklist

- [ ] Replace order is written before you wipe
- [ ] Reassignment is a playbook or a checked-in JSON, not a one-off paste
- [ ] Same hostname/IP ≠ same broker.id automatically

Next: [14. Lab: kafka-03 disk died](14-lab-replace.md).
