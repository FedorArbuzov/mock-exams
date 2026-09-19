# 01. Why Zabbix, not scrape

Nimbus already has Prometheus on a laptop course. Production on 35 Dell is **Zabbix**. The interview will hear which model you reach for first.

## The job story

Thirty-five PowerEdge hosts, a few hundred containers, Jenkins, nginx at the edge. The page that wakes you is not a PromQL graph. It is a Zabbix problem: host `dell-14`, trigger name, severity, “since 03:12”. Partners write English tickets. You own agents, templates, and the window that keeps a Saturday patch from paging the whole rota.

Nobody pays you to rebuild Grafana dashboards that copy `node_exporter`. They pay you when:

- a new Rocky box has no agent and Latest data is empty;
- “disk 100%” fires and `df -h` is fine;
- a change window starts at 10:00 and the channel still screams;
- a check the vendor template does not have (inode on `/data`, number of logins) must land this week.

That work is **Ansible over SSH** for the agent and **the Zabbix UI** (or API) for hosts and triggers. This course is both. It is not `kube-prometheus-stack`.

## Two trees

```text
~/nimbus-zabbix/
  compose/docker-compose.yml     vendor images — you pin tags, you do not fork Zabbix
  inventory/hosts.yml            three LXC nodes
  roles/zabbix-agent             repo, package, drop-in, UserParameter
  playbooks/ / site.yml
  scripts/webhook.py             action target in the lab
  artifacts/actions.log          what the webhook wrote
```

| Question | Answer |
|----------|--------|
| Who stores history and evaluates triggers? | `zabbix-server` on the **control node** |
| Who installs the agent on 35 hosts? | `roles/zabbix-agent` — you |
| Who attaches “Linux by Zabbix agent”? | You, in the UI (API is a later skill, not this course) |
| Who scrapes `/metrics` every 15s? | Prometheus. **Not here.** |
| Who runs a Zabbix proxy in DC-2? | Out of scope. Know the sentence: proxy ships data to one server |

If you find yourself writing PromQL to “fix Zabbix”, stop. Create an item and a trigger.

## Model (memorize)

```text
host  →  template  →  item  →  trigger  →  action
                         ↑
                    maintenance (silence)
```

| Word | Meaning |
|------|---------|
| **Host** | A device Zabbix knows: name, IP/DNS, groups, templates |
| **Template** | Bundle of items / triggers / graphs you attach to many hosts |
| **Item** | One value: key `vfs.fs.size[/,pused]`, type agent, interval 1m |
| **Trigger** | Expression on item last values → PROBLEM / OK |
| **Action** | What happens on a problem: webhook, mail, script |
| **Macro** | `{$VFS.FS.PUSED.MAX.WARN}` — threshold you change per host or template |
| **Maintenance** | Time window: problems may still exist, actions do not page |

Prometheus equivalent (so you can say it out loud): scrape target ≈ host+item, recording/alert rule ≈ trigger, Alertmanager inhibit/silence ≈ maintenance+action.

Zabbix is **server-centric**. The server polls the agent (passive) or the agent pushes (active). `Server=` on the agent is an **ACL of who may ask**, not “the UI URL”. Packets from Docker often come from `172.16.0.0/12`. If Latest data is empty, that ACL is the first guess — before “Zabbix is broken”.

## What this course will not do

- Zabbix HA pair, proxy farm, Oracle items, SNMP walk of iDRAC
- `community.zabbix` collection creating hosts via API
- Pretty dashboards. Zabbix graphs exist; shops that care use Grafana **on top** of Zabbix or a different stack
- Monitoring Kafka/Patroni beyond one UserParameter in lesson 06

## Checklist

- [ ] You can name host / item / trigger / action / maintenance
- [ ] You will not claim “I ran Grafana Cloud”
- [ ] [ENVIRONMENT.md](ENVIRONMENT.md) bridge `.61` and “no other ops stand” are read

Next: [02. Lab: server, nodes, agent role](02-lab-stand.md).
