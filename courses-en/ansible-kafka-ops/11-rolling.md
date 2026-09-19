# 11. Rolling restart

A Saturday JVM or config change is **not** `ansible kafka -m service -a 'state=restarted'` in parallel. That is a cluster outage.

## Order

```text
preflight          URP=0, all units active, chrony, disk not 95%
restart broker N
wait URP=0 and the unit is active
next broker
```

`hosts: kafka_broker`, `serial: 1`. Controllers are on the same boxes — a rolling **broker** restart still bounces the colocated controller JVM if they share a unit (community often has **two** units). Restart **one host’s Kafka-related units**, then wait, then the next host. Do not restart all controllers first.

`block/rescue`: if URP never clears, **fail** — do not continue.

## Controlled shutdown

Brokers with `controlled.shutdown.enable=true` (default) move leadership before exit. `systemctl stop` + start (or `restart`) is enough. `kill -9` is the lesson 10 drill, not the change window.

## OS patch

Same skeleton as [`ansible-k8s-ops` patch](../ansible-k8s-ops/11-change-window.md): drain is a Kafka idea (URP=0), not `kubectl drain`. You may `apt` + reboot **one** host in a later bonus; the required lab is **unit restart only** so the stand stays up.

## Checklist

- [ ] `serial: 1` and wait for URP=0
- [ ] rescue stops the fleet
- [ ] parallel restart is a failed interview answer

Next: [12. Lab: restart one at a time](12-lab-rolling.md).
