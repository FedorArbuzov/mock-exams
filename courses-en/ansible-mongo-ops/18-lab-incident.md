# 18. Lab: junk and a dead secondary

Write the runbooks first. Seed `/var/tmp/nimbus-junk` on `mongo-02`. Optional: stop `mongod` on a **SECONDARY** for gather, then `lag.yml` starts it.

Do **not** stop PRIMARY here. That is [18b](18b-lab-primary-down.md).

```bash
ansible-playbook playbooks/runbooks/gather.yml
ansible-playbook playbooks/runbooks/disk-gc.yml --limit mongo-02
ansible-playbook playbooks/runbooks/lag.yml
```

## Success criteria

- [ ] artifacts have journals
- [ ] junk gone
- [ ] three running, `mongodb_status` converged
- [ ] second disk-gc safe

Next: [18b. Lab: PRIMARY is dead](18b-lab-primary-down.md).
