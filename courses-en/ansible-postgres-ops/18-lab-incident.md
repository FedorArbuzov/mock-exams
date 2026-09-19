# 18. Lab: lag and disk

Write the runbooks first. Seed `/var/tmp/nimbus-junk` on `pg-02`. Optional: stop `patroni` on `pg-02` for gather, then `lag.yml` starts it.

```bash
ansible-playbook playbooks/runbooks/gather.yml
ansible-playbook playbooks/runbooks/disk-gc.yml --limit pg-02
ansible-playbook playbooks/runbooks/lag.yml
```

## Success criteria

- [ ] artifacts have journals
- [ ] junk gone
- [ ] three running, lag acceptable
- [ ] second disk-gc safe

Next: [18b. Lab: leader is dead](18b-lab-failover.md).
