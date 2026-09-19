# 04. Lab: disk page, `df` is fine

This is the line from the vacancy interview. Default brain looks at **bytes**. Production fills **inodes** (tiny files, mail dir, container layers) and `df -h` still looks polite.

## Ticket

P2 — false disk alert

`node-01` pages “disk”. On-call SSH’d, `df -h` is fine, they closed the ticket. It pages again. Find the real item. Prove it. Write the postmortem.

## Task 1. A small filesystem

On **`node-01` only**. Author picture: [`examples/scripts/fill-inodes.sh`](examples/scripts/fill-inodes.sh). You may run it via `lxc exec` or `ansible.builtin.script`.

Need:

- loop file ~64 MiB, `mkfs.ext4 -N 2000` (few inodes, plenty of byte space);
- mount at `/data`;
- create empty files until `df -i /data` is **≥ 90%** and `df -h /data` is **under 50%**.

```bash
df -h /data
df -i /data
```

If bytes fill first, you used too many inodes (`-N` too high) or wrote data into the files. `touch` only.

Leave `/` alone. Do not fill the LXC root.

## Task 2. Two items, two triggers

The Linux template may discover `/data` after an hour. **Do not wait.** On host `node-01` create **two items** (Zabbix agent, 30s interval):

| Name | Key |
|------|-----|
| `/data` space pused | `vfs.fs.size[/data,pused]` |
| `/data` inode pused | `vfs.fs.inode[/data,pused]` |

Triggers (severity Warning is enough):

| Name | Idea |
|------|-----|
| `/data` bytes high | `last(/node-01/vfs.fs.size[/data,pused])>80` |
| `/data` inodes high | `last(/node-01/vfs.fs.inode[/data,pused])>80` |

Trigger syntax in 7.0 is `function(/host/key,…)`. If the UI helper writes it for you, keep that.

Wait two intervals. **Monitoring → Problems**: inode trigger PROBLEM, bytes trigger **not** in problem (or OK).

## Task 3. What on-call should have typed

On `node-01`:

```bash
df -h /data
df -i /data
# if this were Docker overlay on a real Dell:
# docker system df
# df -i /
```

You do not have Docker in this LXC. Still write `docker system df` in the postmortem as the sentence you would add on metal.

## Task 4. Postmortem (six lines, English)

File `~/nimbus-zabbix/artifacts/postmortem-inode.md`:

1. Symptom (what Zabbix showed).
2. What `df -h` said.
3. What `df -i` said.
4. What you changed (item + trigger, not “restarted Zabbix”).
5. How you would stop the page (delete the tiny files, or raise the macro, or both).
6. What you will attach on the next 35 hosts (inode item in a **template**, not a one-off on `node-01`).

## Cleanup

Do **not** delete `/data` yet — lesson 06 reuses the mount for a UserParameter. You may delete the empty files so the trigger goes OK:

```bash
sudo find /data -type f -delete
```

Leave the mount.

## Success criteria

- [ ] `df -h /data` low, `df -i /data` high **while files exist**
- [ ] Inode trigger PROBLEM; bytes trigger quiet
- [ ] Postmortem is six lines, in English, in `artifacts/`
- [ ] You did not fill `/`

Next: [05. Maintenance and actions](05-maintenance.md).
