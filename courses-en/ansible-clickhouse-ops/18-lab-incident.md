# 18. Lab: junk and a dead server

Write the runbooks **first**. Then seed a mess. Then close it.

## Ticket

P1

## Task 1. Playbooks

`gather.yml`, `disk-gc.yml`, `readonly.yml`, `keeper-health.yml`. Tags `runbook`, `gather`.

Author picture: [`examples/playbooks/runbooks/`](examples/playbooks/runbooks/gather.yml).

## Task 2. Seed

```bash
ansible ch-02 -b -m shell -a 'dd if=/dev/zero of=/var/tmp/nimbus-junk bs=1M count=256'
# optional: stop clickhouse-server on ch-02 so gather sees a failed unit — then start it
```

Do **not** fill `/var/lib/clickhouse` to 100% (you can brick the LXD pool). Do **not** stop Keeper on two nodes.

## Task 3. Close

```bash
cd ~/nimbus-ch
ansible-playbook playbooks/runbooks/gather.yml
ansible-playbook playbooks/runbooks/disk-gc.yml --limit ch-02
ansible-playbook playbooks/runbooks/keeper-health.yml
# if you stopped Server: start it, then readonly.yml if is_readonly stuck
ansible-playbook playbooks/runbooks/readonly.yml --limit ch-02
```

Junk gone. Three servers active. `shop.events` not readonly.

## Success criteria

- [ ] `artifacts/` has journals
- [ ] junk file absent
- [ ] three servers + three keepers
- [ ] second `disk-gc` is safe

Next: [18b. Lab: one Keeper down](18b-lab-keeper-down.md).
