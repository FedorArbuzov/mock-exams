# 13. Lab: security audit report

**Lab stand:** [`deploy/linux`](../../deploy/linux/README.md).

## Task 1. Collect data from srv1

On lab, run and save the output:

```bash
ssh course@172.28.0.11 'hostname; sudo ufw status; sudo ss -tlnp; sudo sshd -T 2>/dev/null | grep -i permitroot' > /tmp/srv1-audit-raw.txt
cat /tmp/srv1-audit-raw.txt
```

## Task 2. Report

Create `/home/course/security-audit-srv1.md`:

```markdown
# Security audit: srv1 (172.28.0.11)
Date: YYYY-MM-DD
Auditor: your name

## Executive summary
One paragraph: overall posture (acceptable / needs work).

## Scope
- Host: srv1, Ubuntu lab container
- In scope: SSH, firewall, users, listening ports
- Out of scope: physical DC, K8s cluster

## Findings

### F-01: [Title]
- Severity: High | Medium | Low
- Evidence: command output or config line
- Impact: what attacker can do
- Recommendation: specific fix
- Status: Open | Fixed

### F-02: ...

## Positive controls
- ufw enabled
- ...

## Next steps
1. ...
```

At least **3 findings** (real or instructional, with honest remediation).

## Task 3. Peer review

Ask a colleague (or review yourself after 24h): one finding closed — update Status.

## Success criteria

- [ ] Report ≥ 3 findings with severity
- [ ] Evidence and recommendation present
- [ ] Raw data saved

Next lesson: [14. Final project](14-final-project.md).
