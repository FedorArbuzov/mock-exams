# 17. Monday morning

`playbooks/audit.yml` reports. It does not remediates. `site.yml` remediates.

## Asserts

| Check | Why |
|-------|-----|
| sshd policy | someone “temporarily” opened root |
| chrony active | KRaft / sessions |
| broker unit active on all three | silent crash |
| `shop.orders` exists with RF=3 | someone deleted it |
| URP empty | leftover from Sunday |
| `log.dirs` exists and is a directory | wrong disk after replace |

`--describe --under-replicated-partitions` empty is the Kafka equivalent of “all nodes Ready.”

## Checklist

- [ ] Audit ≠ apply
- [ ] URP is a first-class Monday check
- [ ] Breaking sshd makes audit red, `site.yml --tags baseline` makes it green

Next: [18. Lab: audit](18-lab-audit.md).
