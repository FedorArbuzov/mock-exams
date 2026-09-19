# 06. Lab: patch window + UserParameter

Two tickets on the same Saturday. Do them in order. The window is worthless if you cannot prove an action existed **before** you silenced it.

## Ticket A — P2 change window

OS patch on `node-01` at 10:00. Do not page. Do not stop the agent.

## Ticket B — P3 custom check

Linux template has no “how many SSH logins”. Add a UserParameter. We will reuse `/data` inodes as a second key so the next Dell does not need a hand-made `vfs.fs.inode` item.

---

## Task 1. Webhook on the control node

Picture: [`examples/scripts/webhook.py`](examples/scripts/webhook.py) and [`examples/webhook-media.js`](examples/webhook-media.js).

```bash
cd ~/nimbus-zabbix
python3 scripts/webhook.py
# leave it running; log → artifacts/actions.log
```

Compose must resolve the host. Official picture sets `extra_hosts: host.docker.internal:host-gateway` on **zabbix-server**. If you skipped that in lesson 02, add it and `docker compose up -d`.

UI:

1. **Alerts → Media types → Create** — type Webhook. Parameters `url`, `subject`, `message`. Script from the author JS file.
2. **Test** — a line must appear in `artifacts/actions.log`.
3. User **Admin** → Media → this type, send to `nimbus`.
4. **Alerts → Actions → Trigger actions** — condition: host group `nimbus-lab`. Send to Admin / webhook.

Prove the path **before** maintenance: set the inode trigger PROBLEM again (re-run the fill, or a throwaway trigger on `agent.ping`). One new line in the log.

## Task 2. Maintenance

**Data collection → Maintenance** on `nimbus-lab` or `node-01`, **with data collection**, now → +1 hour.

Re-fire the same problem (or keep it PROBLEM). **No new line** in `actions.log`. Problems list may show the trigger as suppressed.

Write two sentences in the README: what you silenced, how you proved the webhook was not broken (Test still works / other host still pages).

## Task 3. Fake the patch

You do **not** `apt upgrade` the fleet here. On `node-01`:

```bash
sudo touch /var/tmp/nimbus-patched
hostname
```

That is the change. In production this is `serial: 1` and a real reboot — [`ansible-k8s-ops/12`](../ansible-k8s-ops/12-lab-patch.md). Close maintenance when you would uncordon.

## Task 4. UserParameter

Drop-in already includes `/etc/zabbix/zabbix_agent2.d/`. Add `userparameter_nimbus.conf` from the role (handler restart). Picture: [`examples/roles/zabbix-agent/files/userparameter_nimbus.conf`](examples/roles/zabbix-agent/files/userparameter_nimbus.conf).

```
UserParameter=nimbus.ssh.logins,who | wc -l
UserParameter=nimbus.fs.inode.pused[*],df --output=ipcent $1 | tail -1 | tr -dc '0-9'
```

Set `UnsafeUserParameters=1` in the nimbus drop-in for this lab (`/` in the parameter). In production you list exact keys.

```bash
ansible-playbook site.yml --tags agent
# on node-01, as a check the agent can run the key:
sudo -u zabbix zabbix_agent2 -t nimbus.ssh.logins
sudo -u zabbix zabbix_agent2 -t nimbus.fs.inode.pused[/data]
```

UI items on `node-01` (type Zabbix agent):

| Name | Key |
|------|-----|
| SSH logins | `nimbus.ssh.logins` |
| `/data` inodes (custom) | `nimbus.fs.inode.pused[/data]` |

Latest data must show numbers. Open a second SSH session and watch `nimbus.ssh.logins` move after the next interval.

## Task 5. Done when

Copy [`examples/scripts/verify.sh`](examples/scripts/verify.sh) to `~/nimbus-zabbix/scripts/verify.sh` and run it from the repo root. It checks the stand, not the UI clicks.

## Success criteria

- [ ] Webhook **Test** writes a line
- [ ] A real PROBLEM wrote a line **before** maintenance
- [ ] Same PROBLEM during maintenance did **not** write a new line
- [ ] `zabbix_agent2 -t` works for both UserParameter keys
- [ ] Latest data has `nimbus.ssh.logins`
- [ ] `verify.sh` exits 0

You can now say: *I pinned Zabbix 7 LTS, rolled agent2 with Ansible, attached the Linux template, caught an inode false disk page, silenced a patch window, and shipped a UserParameter.* That is the vacancy line. It is not 35 Dells and it is not a proxy in DC-2 — do not claim those.
