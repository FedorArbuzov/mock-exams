# 15. Runbooks

ON-CALL Slack is not a repo. Playbooks:

| Playbook | Job |
|----------|-----|
| `playbooks/runbooks/urp.yml` | Describe URP / offline partitions; do **not** delete topics |
| `playbooks/runbooks/disk-gc.yml` | `df` on `log.dirs`; delete **lab junk** only; never `rm -rf` data dirs |
| `playbooks/runbooks/gather.yml` | journal of Kafka units + `describe` → `artifacts/` |
| `playbooks/runbooks/preferred-election.yml` | `kafka-leader-election --election-type PREFERRED` — never `UNCLEAN` |

## URP

Print `--under-replicated-partitions` and `--unavailable-partitions`. Restart a **single** dead unit if `systemctl is-active` is failed — that is the only mutate allowed in `urp.yml`. No reassignment here (that is the replace ticket).

## Disk

Kafka fills `log.dirs` because retention is wrong, not because journald is chatty. Still: journald drop-in (optional, copy the idea from [`ansible-k8s-ops` hygiene](../ansible-k8s-ops/09-hygiene.md)) plus **never** vacuum `/var/lib/kafka/data`.

Lab seed file: `/var/tmp/nimbus-junk` only.

## Checklist

- [ ] gather vs fix are different tags
- [ ] disk-gc does not touch `log.dirs`
- [ ] second run is safe

Next: [16. Lab: URP and disk](16-lab-incident.md).
