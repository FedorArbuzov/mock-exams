# zabbix-ops examples

**Reference copies** of files you type in `~/nimbus-zabbix`. Lessons do **not** copy this tree — create the repo yourself.

| Path | Role |
|------|------|
| [lxc-setup.sh](lxc-setup.sh) | three small LXC nodes + SSH |
| [ansible.cfg](ansible.cfg) | inventory path, no host-key prompt |
| [inventory/hosts.yml](inventory/hosts.yml) | group `monitored` |
| [docker-compose.yml](docker-compose.yml) | Zabbix 7.0 LTS + Postgres — lives in `compose/` |
| [site.yml](site.yml) | role `zabbix-agent` |
| [roles/zabbix-agent](roles/zabbix-agent/tasks/main.yml) | repo, package, drop-in, UserParameter |
| [scripts/webhook.py](scripts/webhook.py) | action target `:8099` |
| [scripts/fill-inodes.sh](scripts/fill-inodes.sh) | `/data` loop + inode fill on node-01 |
| [webhook-media.js](webhook-media.js) | paste into the Zabbix webhook media type |
| [scripts/verify.sh](scripts/verify.sh) | finale checklist |

```bash
# Compose from the copied file:
mkdir -p ~/nimbus-zabbix/compose
# you type docker-compose.yml into compose/
```
