# 11. Detection, audit and response

## Intro

Preventive controls **don't guarantee** the absence of an incident. You need **logs, alerts, playbooks** — and a connection to the SRE on-call, not a separate "security black box".

---

## Defense in depth (detection layer)

```text
Prevent → Detect → Respond → Recover → Learn
```

| Layer | Examples |
|------|---------|
| Prevent | RBAC, NP, WAF |
| Detect | audit log, Falco, GuardDuty |
| Respond | isolate NS, revoke key, block IP |
| Recover | restore from backup |
| Learn | postmortem |

---

## Audit logs

| Source | What it gives |
|----------|----------|
| K8s audit | who created a Secret, exec into a pod |
| CloudTrail / Cloud Audit | IAM, S3 API |
| Vault audit | access to a secret path |
| GitLab audit | who changed a protected variable |
| nginx / Ingress access | suspicious paths |

**Retention** and **immutability** (WORM bucket, SIEM) are compliance requirements.

Practice: [kuber-advanced/04](../kuber-advanced/04-audit.md), [aws-advanced/21](../aws-advanced/21-guardduty-config-trail.md).

---

## Runtime security (concept)

| Tool | Purpose |
|------------|------------|
| **Falco** | syscall rules (shell in container, sensitive file) |
| **eBPF** based | low overhead |
| **EDR** on nodes | enterprise endpoint |

Example signal: `terminal shell in container` in a prod namespace.

Doesn't replace patch management — it complements it.

---

## CSPM and cloud alerts

| Signal | Action |
|--------|----------|
| S3 bucket public | auto-remediate or ticket |
| Root login | page security |
| IAM policy change | review within 24h |
| GuardDuty Finding CRITICAL | runbook |

---

## Security metrics in observability

| Metric / log | Alert |
|---------------|-------|
| 401/403 spike on admin | brute force |
| RBAC denied (audit) | reconnaissance |
| Image pull failures | registry attack / typo |
| cert expiry < 14d | renewal |

Related: [observability-basic](../observability-basic/README.md), [sre/07–09](../sre/07-alerting-on-call.md).

---

## Security incident vs availability incident

| | Availability | Security |
|---|--------------|----------|
| Goal | restore service | contain + evidence |
| First step | scale / rollback | revoke creds, isolate |
| Comms | status page | legal / regulator (insurance!) |

**Don't turn off the logs** while "putting out the fire" — you need them for the investigation.

---

## Playbook (template)

```markdown
## Security: leaked AWS key
1. Disable key (IAM) — owner @platform
2. CloudTrail filter Last 24h — @security
3. Rotate dependent secrets — @app-team
4. Postmortem 5 business days
```

---

## OpenSearch / SIEM (overview)

Centralization: CloudTrail + K8s audit + app logs → **OpenSearch** → dashboards + alerts.

Practice: [opensearch-basic](../opensearch-basic/README.md) — not a full-fledged SOC course, but the log pipeline.

---

## In mock-exams

| Topic | Course |
|------|------|
| Alerting | [observability-intermediate](../observability-intermediate/README.md) |
| Postmortem | [sre/09](../sre/09-postmortems.md) |
| Vault audit | [secrets-advanced](../secrets-advanced/README.md) |

---

## Summary

Detection is **audit everywhere + alerts on anomalies + runbooks**. Security and SRE share the on-call for **critical** signals.

---

## Checklist

- [ ] Is K8s audit enabled for secrets and RBAC?
- [ ] Is there a runbook for a compromised CI token?
- [ ] Are logs kept longer than 30 days?

**Next:** [12. Secure SDLC](12-secure-sdlc.md).
