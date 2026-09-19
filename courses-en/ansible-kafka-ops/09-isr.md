# 09. ISR on real processes

You already saw ISR on Compose in [`kafka-intermediate`](../kafka-intermediate/README.md). Here the broker is a **systemd unit** on a disk. Stopping it is `systemctl stop`, not `docker stop`.

## Contract

| Setting | Lab value | Why |
|---------|-----------|-----|
| `acks` | `all` | wait for ISR |
| `min.insync.replicas` | `2` | one dead broker → still writable if ISR has 2 |
| RF | `3` | one dead broker → still 2 copies |

If you produce with `acks=1` during the drill, you will “prove” nothing.

Under-replicated partitions (URP): `RF` > current ISR size. After you start the unit again, the replica should rejoin. If it does not, you have a disk/network/controller problem — [runbooks](15-runbooks.md).

## Preferred leader

After a bounce, leadership may sit on `kafka-02`/`kafka-03`. `kafka-leader-election --election-type PREFERRED` is a **separate** playbook, not something you run after every restart “for luck.”

## Checklist

- [ ] You can explain URP vs offline partitions
- [ ] `acks=all` + `min.insync=2` is the produce line you will use
- [ ] Stopping a unit ≠ deleting `log.dirs`

Next: [10. Lab: stop a broker](10-lab-failover.md).
