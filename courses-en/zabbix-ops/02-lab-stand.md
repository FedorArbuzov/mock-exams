# 02. Lab: server, nodes, agent role

Do **not** copy `courses-en` onto the host. Do **not** attach leftover k8s / Kafka / ClickHouse LXC.

## Ticket

P3 — onboarding

Stand up Zabbix 7.0 on the control node. Three empty hosts must answer the agent port. New Dell boxes next month get the same role.

## Task 1. Containers

On the 16 GB host, after [ENVIRONMENT.md](ENVIRONMENT.md) profile `zbx` exists:

```text
node-01   192.168.61.10
node-02   192.168.61.11
node-03   192.168.61.12
```

Ubuntu 22.04, `ubuntu` + your key, NOPASSWD sudo, **512 MiB** memory. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

## Task 2. Repo

```bash
mkdir -p ~/nimbus-zabbix/{compose,inventory,roles/zabbix-agent/{defaults,tasks,handlers,templates,files},playbooks,scripts,artifacts}
cd ~/nimbus-zabbix
```

`ansible.cfg` — picture: [`examples/ansible.cfg`](examples/ansible.cfg).

## Task 3. Inventory

Group **`monitored`**: all three. `all:vars`: `ansible_user=ubuntu`, key, `ansible_python_interpreter=/usr/bin/python3`, `ansible_become: true`.

```bash
cd ~/nimbus-zabbix
ansible all -m ping
ansible monitored --list-hosts
```

Three `pong`. Sketch: [`examples/inventory/hosts.yml`](examples/inventory/hosts.yml).

## Task 4. Compose on the host

Write `compose/docker-compose.yml`. Picture: [`examples/docker-compose.yml`](examples/docker-compose.yml).

Pin **7.0 LTS** images. Publish **8080** (web) and **10051** (server) on the host. Postgres data on a named volume, not a bind under `/tmp`. Lab DB password may live in the compose file; write in the README that production uses Vault.

```bash
cd ~/nimbus-zabbix/compose
docker compose pull
docker compose up -d
docker compose ps
```

Wait until web answers. First login **`Admin` / `zabbix`**. 7.0 will force a new password — store it in your password manager, not in Slack.

If the orange banner says the server is down, `docker compose logs zabbix-server` — almost always Postgres not ready yet. Wait and refresh.

## Task 5. Role `zabbix-agent`

On `monitored`:

1. Install the **Zabbix 7.0** apt repo (`zabbix-release` for Ubuntu 22.04) and `zabbix-agent2`.
2. Drop-in `/etc/zabbix/zabbix_agent2.d/nimbus.conf` (do **not** replace the whole vendor `zabbix_agent2.conf`):
   - `Hostname={{ inventory_hostname }}`
   - `Server=` the control node **and** Docker’s usual source range (`192.168.61.1` and `172.16.0.0/12`)
   - `ServerActive=192.168.61.1`
3. Handler restarts `zabbix-agent2`.
4. Service enabled.

Tag `agent`. `site.yml` applies the role to `monitored`.

Author picture: [`examples/roles/zabbix-agent`](examples/roles/zabbix-agent/tasks/main.yml). The `userparameter_nimbus.conf` copy is **[lesson 06](06-lab-window.md)** — skip that task until then if you type the role yourself.

```bash
cd ~/nimbus-zabbix
ansible-playbook site.yml --tags agent
ansible-playbook site.yml --tags agent
```

On a node:

```bash
systemctl is-active zabbix-agent2
ss -lntp | grep 10050
```

From the **host**:

```bash
# agent ACL + listen
nc -zv 192.168.61.10 10050
# server trapper (Compose)
nc -zv 127.0.0.1 10051
```

If Latest data stays empty in lesson 03, the first check is: did the poller source IP match `Server=`? `docker compose exec zabbix-server sh` and try `nc` / `timeout` to `192.168.61.10:10050`.

## Task 6. README

Five lines: Zabbix **7.0 LTS**, Compose on the host, agents on LXC, you do not run Prometheus here, image digests you pulled.

## Success criteria

- [ ] `lxc list` shows three RUNNING nodes on `.10–.12` of **61**
- [ ] `ansible all -m ping` → three `pong`
- [ ] Compose: postgres, server, web running; login page on `:8080`
- [ ] `zabbix-agent2` active on all three; second playbook run clean
- [ ] README states 7.0 and the two-tree split (compose vs role)

Next: [03. Lab: Linux template](03-lab-template.md).
