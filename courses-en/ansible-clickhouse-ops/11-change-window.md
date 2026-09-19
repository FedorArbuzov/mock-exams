# 11. Change windows

Never restart all ClickHouse Server units at once. Never restart all Keepers at once.

## Servers first

```text
preflight              three servers + three keepers active
                       system.replicas: no readonly, queue small
serial: 1              restart clickhouse-server
wait                   unit active, is_readonly=0, queue drains
next server
```

`hosts: clickhouse`, `serial: 1`. `block/rescue`: if a replica stays readonly or the unit dies, **fail** — do not continue.

`systemctl restart clickhouse-server` is the change window. `kill -9` is the lesson 10 drill.

## Keepers after, optional, serial 1

Only when **all three servers** are healthy. Then one `clickhouse-keeper` at a time. Wait until the other two still form quorum (`mntr` / `system.zookeeper` / keeper logs) and servers are not readonly.

Restarting all Keepers in parallel is how you lose the raft log and spend a weekend. Two Keepers down = no quorum = writers freeze.

## OS patch

Same skeleton as [`ansible-k8s-ops` patch](../ansible-k8s-ops/11-change-window.md) / [`ansible-kafka-ops` rolling](../ansible-kafka-ops/11-rolling.md): drain is “replicas writable, queue empty,” not `kubectl drain`. Required lab is **unit restart only**.

## Checklist

- [ ] `serial: 1` for servers; wait for writable
- [ ] Keepers only after servers; never all three
- [ ] parallel restart is a failed interview answer

Next: [12. Lab: rolling](12-lab-rolling.md).
