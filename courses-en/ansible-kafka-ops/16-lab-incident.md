# 16. Lab: URP and disk

## Ticket

P1

Write the runbooks **first**. Then seed a mess. Then close it.

## Task 1. Playbooks

`urp.yml`, `disk-gc.yml`, `gather.yml`. Tags `runbook`, `gather`.

Author picture: [`examples/playbooks/runbooks/`](examples/playbooks/runbooks/urp.yml).

## Task 2. Seed

```bash
ansible kafka-02 -b -m shell -a 'dd if=/dev/zero of=/var/tmp/nimbus-junk bs=1M count=256'
# optional: stop the broker unit on kafka-02 for 30s so gather sees a failed unit — then start it
```

Do **not** fill `log.dirs` to 100% (you can brick the LXD pool).

## Task 3. Close

```bash
ansible-playbook playbooks/runbooks/gather.yml
ansible-playbook playbooks/runbooks/disk-gc.yml --limit kafka-02
ansible-playbook playbooks/runbooks/urp.yml
```

Junk gone. URP empty. Units active.

## Success criteria

- [ ] `artifacts/` has journals + a describe dump
- [ ] junk file absent
- [ ] URP empty
- [ ] second `disk-gc` is safe

Next: [16b. Lab: min.isr trap](16b-lab-min-isr.md).
