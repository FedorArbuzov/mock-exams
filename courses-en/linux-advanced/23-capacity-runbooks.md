# 23. Capacity planning and runbooks

## Intro: the alert "CPU 90%" — scale or fix?

The reflex "add replicas" without analysis often **multiplies** the problem (an I/O-bound DB, a memory leak). **Capacity planning** — looking at trends **before** 80% utilization. A **runbook** — what to do at 03:00 when the on-call person doesn't remember all the commands.

## What you'll learn

- Per-resource metrics: CPU, RAM, disk, network.
- Horizontal vs vertical scaling.
- The structure of a **runbook**.
- On-call severity and post-incident.

---

## Capacity — what to watch

| Resource | Metrics | Action |
|--------|---------|----------|
| CPU | load, %util, throttling | optimize, scale out, limits |
| RAM | used, swap, OOM | fix leak, add RAM, limits |
| Disk | %used, iowait, await | cleanup, expand, tiering |
| Network | bandwidth, errors, drops | LB, NIC, fw |

**Rule:** plan the action **before** a stable 80% (don't wait for 95%).

Related: [linux-intermediate/29-performance](../linux-intermediate/29-performance.md).

```bash
df -h
free -h
uptime
vmstat 1 3
```

---

## Runbook — structure

1. **Metadata** — title, severity, owner, last reviewed
2. **Symptoms** — the alert, the user complaint
3. **Impact** — who/what is affected
4. **Diagnosis** — copy-paste commands
5. **Mitigation** — a quick fix
6. **Escalation** — who to call
7. **Post-incident** — ticket, blameless review

Report template: [postgresql-ops/templates/incident-report.md](../postgresql-ops/templates/incident-report.md) (if present in the repo).

---

## Example: disk full (fragment)

**Symptoms:** `node_filesystem_avail_bytes` < 10%, `No space left on device`.

**Diagnosis:**

```bash
df -h
df -i
du -xhd1 /var | sort -h | tail -10
journalctl --disk-usage
docker system df 2>/dev/null
```

**Mitigation:** vacuum the journal, rotate logs, expand the LV — see [lab 24](24-runbook-lab.md).

---

## On-call

| Severity | Example | Response |
|----------|--------|---------|
| SEV1 | prod down | immediately, all hands |
| SEV2 | degradation | 15–30 min |
| SEV3 | non-prod | working hours |

Communication: a status channel, a timeline, don't "fix silently".

---

## Common mistakes

| Mistake | Risk |
|--------|------|
| runbook without commands | panic |
| mitigation only, no root cause | recurrence |
| scale without metrics | money + the same bottleneck |
| runbook out of date | wrong paths |

---

## In production

Runbooks in git next to the code. Test the runbook on a game day. SLO/SLI from the error budget.

---

## Summary

**Capacity** — trends and thresholds. **Runbook** — reproducible steps. **Post-incident** — improving the documentation.

## Checklist

- [ ] What goes in a runbook for "disk full"?
- [ ] When to scale horizontal vs vertical?
- [ ] Which 3 diagnosis commands for disk?

Next lesson: [24. Lab: runbook](24-runbook-lab.md).
