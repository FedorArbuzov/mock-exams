# ansible-clickhouse-ops examples

**Reference copies** of files you type in `~/nimbus-ch`. Do not copy this tree and call the course done.

| Path | Role |
|------|------|
| [lxc-setup.sh](lxc-setup.sh) | three LXC on `192.168.60.0/24` |
| [ansible.cfg](ansible.cfg) | inventory path |
| [inventory/hosts.yml](inventory/hosts.yml) | `clickhouse` + `clickhouse_keeper`, `keeper_id` 1/2/3 |
| [group_vars/all/cluster.yml](group_vars/all/cluster.yml) | cluster `nimbus`, ports, 24.8 pin |
| [site.yml](site.yml) | `common` + `cluster`, tags `baseline` / `cluster` |
| [roles/common](roles/common/tasks/main.yml) | chrony, sshd |
| [roles/cluster](roles/cluster/tasks/main.yml) | official apt, `config.d`, Keeper — sketches, not production-perfect |
| [playbooks/](playbooks/schema.yml) | schema, preflight, rolling, backup, audit, runbooks |
| [scripts/verify.sh](scripts/verify.sh) | finale checklist |

Pin ClickHouse **24.8.x** from the official repo. Do not `ansible-galaxy install` a ClickHouse role for day-0.
