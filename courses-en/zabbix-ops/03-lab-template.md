# 03. Lab: Linux template and Latest data

The agent is up. Zabbix does not know the hosts until **you** create them. A template is how 35 Dells get the same items.

## Ticket

P3 — monitoring

Three lab nodes must appear in Latest data with CPU and filesystem items. Do not write thirty items by hand.

## Task 1. Host group

UI: **Data collection → Host groups → Create**. Name `nimbus-lab`.

## Task 2. Three hosts

**Data collection → Hosts → Create host** for `node-01`, `node-02`, `node-03`:

| Field | Value |
|-------|--------|
| Host name | `node-01` (must match `Hostname=` in the drop-in) |
| Groups | `nimbus-lab` |
| Interfaces | Agent, IP `192.168.61.10` / `.11` / `.12`, port **10050** |
| Templates | **Linux by Zabbix agent** |

Do **not** pick “Linux by Zabbix agent active” unless you understand active-only (no agent interface). This lab uses the mixed official template.

Save. Availability icon turns green when the server has talked to `10050`. If it stays grey/red for more than two minutes:

1. `systemctl status zabbix-agent2` on the node
2. `Server=` ACL (lesson 01)
3. `docker compose logs zabbix-server` — “failed to accept an incoming connection” vs “connection refused”

## Task 3. Latest data

**Monitoring → Latest data**, host `node-01`, filter `vfs.fs` or `system.cpu`.

You should see `vfs.fs.size[/,pused]` (or a dependent item with the same idea) and a number. Wait one interval if the list is empty — do not recreate the host.

Open one item → **Triggers** or the host’s **Triggers** tab. Find a filesystem used-space trigger. Note the macro name (often `{$VFS.FS.PUSED.MAX.WARN}`). That macro is how you raise the threshold on a fat log disk without forking the template.

## Task 4. What you can say in an interview

Write four lines in `~/nimbus-zabbix/README.md`:

- host `node-01` IP and template name;
- one item key you actually saw;
- one trigger name;
- the macro you would change before a planned 90% fill.

## Success criteria

- [ ] Three hosts in `nimbus-lab`, template attached
- [ ] Availability green (or Latest data has values — that is enough)
- [ ] You can point at `vfs.fs.size` / pused without guessing
- [ ] README names the macro

Next: [04. Lab: disk page, `df` is fine](04-lab-inode.md).
