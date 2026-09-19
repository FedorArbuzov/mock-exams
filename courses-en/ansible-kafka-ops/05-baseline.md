# 05. Baseline next to the brokers

Confluent Ansible already installed Java, packages, and the Kafka units. If `common` touches `server.properties` or restarts `confluent-kafka` “to be safe,” you will fight the installer on every run.

`common` is **company** state: chrony, sshd, a small package set.

## What belongs in `common`

| Do | Do not |
|----|--------|
| `chrony`, `jq`, `htop` | edit `log.dirs` or heap |
| sshd: no passwords, no root login | `systemctl restart` the broker |
| | `apt full-upgrade` of `confluent-*` |

Kafka (and KRaft) assume clocks agree. Two NTP clients on one box is how people get unexplained session timeouts. Pick **chrony**, disable `systemd-timesyncd` if it fights.

`--check --diff` before the first apply.

## Checklist

- [ ] You can name three things Confluent Ansible already did
- [ ] `common` must not notify the Kafka unit
- [ ] You will `--check --diff`

Next: [06. Lab: role `common`](06-lab-baseline.md).
