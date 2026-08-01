# 24. Lab: "disk full" runbook

## Lab goal

Write a full **runbook** `disk-full.md` with metadata, diagnosis, mitigation, escalation — and run the diagnosis on lab after simulating a full `/tmp`.

## Prerequisites

- [23. Capacity and runbooks](23-capacity-runbooks.md).

```bash
docker compose exec lab bash
mkdir -p /home/course/runbooks
```

---

## Task 1. Create the runbook

The file `/home/course/runbooks/disk-full.md` must contain **all** the sections:

### Metadata

- Title: Disk full on Linux host
- Severity: SEV2
- Owner: platform on-call
- Last reviewed: date

### Symptoms

- Alert: filesystem > 90%
- Application: `No space left on device`
- SSH may work, services fail on write

### Impact

- Writing logs, the DB, and deploys are stopped
- Risk of corruption from forced actions

### Diagnosis (commands)

```bash
df -h
df -i
du -xhd1 /var 2>/dev/null | sort -h | tail -10
du -sh /var/log/* 2>/dev/null | sort -h | tail -5
journalctl --disk-usage
docker system df 2>/dev/null
sudo lsof +D /var 2>/dev/null | head -20
```

### Mitigation

1. Find the top directory (`du`)
2. `journalctl --vacuum-size=500M` (if the journal is large)
3. Rotate/archive logs per policy
4. Delete known junk (`/tmp`, old backups)
5. Expand the LV — [linux-basic/14-lvm](../linux-basic/14-lvm.md)
6. **Do not** delete files at random in `/var/lib` without understanding

### Escalation

- DBA if Postgres WAL
- Storage team if SAN
- Security if there's a sudden growth in `/home`

### Post-incident

- Disk trend in Grafana
- Ticket to increase the volume
- Update the runbook

---

## Task 2. Check the length

```bash
wc -l /home/course/runbooks/disk-full.md
```

**Goal:** ≥ 40 lines of meaningful text.

---

## Task 3. Simulation

```bash
df -h /tmp
dd if=/dev/zero of=/tmp/fill-lab bs=1M count=80 2>/dev/null
df -h /tmp
```

Go through the **Diagnosis** from the runbook — run the commands, find `/tmp/fill-lab`.

```bash
rm -f /tmp/fill-lab
df -h /tmp
```

---

## Task 4. Peer review (self-check)

- [ ] Copy-paste commands without typos?
- [ ] Is there escalation?
- [ ] Is the mitigation safe (not `rm -rf /`)?

---

## Success criteria

- [ ] Runbook ≥ 40 lines, all sections
- [ ] Simulation: `du`/`df` found fill-lab
- [ ] The file is in `/home/course/runbooks/`

## What to take to work

- Runbook in git, reviewed once a quarter.
- The capstone requires this runbook on srv1/lab.

Next lesson: [25. Docker socket](25-docker-socket.md).
