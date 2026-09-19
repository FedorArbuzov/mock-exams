# ansible-mongo-ops examples

**Reference copies** of files you type in `~/nimbus-mongo`. Do not copy this tree and call the course done.

| Path | Role |
|------|------|
| [lxc-setup.sh](lxc-setup.sh) | three LXC on `192.168.59.0/24` |
| [ansible.cfg](ansible.cfg) | inventory path |
| [collections/requirements.yml](collections/requirements.yml) | `community.mongodb` 1.7.12 |
| [inventory/hosts.yml](inventory/hosts.yml) | `mongo` + `mongo_rs` |
| [group_vars/all/mongodb.yml](group_vars/all/mongodb.yml) | RS `nimbus`, MongoDB 7.0 |
| [group_vars/all/objects.yml](group_vars/all/objects.yml) | shop / indexes |
| [site.yml](site.yml) | `common` |
| [roles/common](roles/common/tasks/main.yml) | chrony, sshd |
| [playbooks/](playbooks/cluster.yml) | cluster, objects, preflight, rolling, backup, audit, runbooks |
| [scripts/verify.sh](scripts/verify.sh) | finale checklist |

```bash
ansible-galaxy collection install community.mongodb:1.7.12
```
