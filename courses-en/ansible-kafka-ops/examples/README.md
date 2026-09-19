# ansible-kafka-ops examples

**Reference copies** of files you type in `~/nimbus-kafka`. Do not copy this tree and call the course done.

| Path | Role |
|------|------|
| [lxc-setup.sh](lxc-setup.sh) | three LXC on `192.168.57.0/24` |
| [ansible.cfg](ansible.cfg) | inventory path |
| [inventory/hosts.yml](inventory/hosts.yml) | Confluent groups + `kafka` |
| [group_vars/all/confluent.yml](group_vars/all/confluent.yml) | community Kafka, no TLS |
| [group_vars/all/topics.yml](group_vars/all/topics.yml) | shop topics |
| [site.yml](site.yml) | `common` |
| [roles/common](roles/common/tasks/main.yml) | chrony, sshd |
| [playbooks/](playbooks/topics.yml) | topics, preflight, rolling, audit, runbooks |
| [scripts/verify.sh](scripts/verify.sh) | finale checklist |

```bash
ansible-galaxy collection install confluent.platform:7.9.2 ansible.posix
```
