# 05. Maintenance and actions

A trigger in PROBLEM is not a page. An **action** is the page. A **maintenance** window is how you patch 35 hosts at 10:00 without lying to the board that “monitoring was off”.

## Change window vs silence

| Mechanism | What it does | When |
|-----------|----------------|------|
| **Maintenance** (Zabbix) | Host or group: problems may still be recorded; actions are suppressed (data collection usually continues) | Planned patch, reboot, known fill |
| Disable trigger | No problem at all — you lose history of the fault | Almost never for a fleet window |
| Stop the agent | Latest data goes stale; you look dead | Never as a “quiet” trick |
| Ansible `serial` | How you **do** the patch | Lesson 06 opens the window, then you pretend to patch |

Prometheus people say “silence in Alertmanager”. Same job. Different button. Say both words in the interview and then pick the one this shop uses.

## Action path

```text
trigger PROBLEM → action conditions match → media (webhook / mail / script)
```

Mail on this stand is a trap (Postfix is a different vacancy line). The lab webhook is a **file on the control node**:

```text
scripts/webhook.py     listen :8099
artifacts/actions.log  one JSON line per page
```

Zabbix server runs **in Docker**. It must reach the webhook. `host-gateway` / `host.docker.internal` is the usual path. If the log stays empty, exec into `zabbix-server` and `wget` the URL yourself — same class of bug as the agent `Server=` ACL.

## What you put in the media type

Zabbix 7 webhook is a small JavaScript `HttpRequest`. Parameters at minimum:

- `url` — `http://host.docker.internal:8099/`
- `subject` — `{ALERT.SUBJECT}`
- `message` — `{ALERT.MESSAGE}`

User **Admin** needs that media assigned. An action “report problems to Nimbus webhook” must target a user who has the media. Forgetting the user is why “webhook works in Test, production never writes”.

## Maintenance object

**Data collection → Maintenance**:

- period: “now + 1 hour” is enough for the lab;
- host group `nimbus-lab` or host `node-01`;
- type **with data collection** (you still want Latest data during the patch).

Problems created during the window show as suppressed. The webhook must **not** grow a new line for that host.

After the window ends, a still-open PROBLEM may fire the action. That is expected. Either close the problem (cleanup files) before the window ends, or accept one late line and say so in the runbook.

## Checklist

- [ ] Maintenance ≠ “stop Zabbix”
- [ ] Action needs media **and** a user
- [ ] Server-in-Docker must route to the webhook

Next: [06. Lab: patch window + UserParameter](06-lab-window.md).
