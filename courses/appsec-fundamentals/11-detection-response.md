# 11. Обнаружение, аудит и реагирование

## Введение

Превентивные контроли **не гарантируют** отсутствие инцидента. Нужны **логи, алерты, playbooks** — и связь с SRE on-call, не отдельный «чёрный ящик security».

---

## Defense in depth (detection layer)

```text
Prevent → Detect → Respond → Recover → Learn
```

| Слой | Примеры |
|------|---------|
| Prevent | RBAC, NP, WAF |
| Detect | audit log, Falco, GuardDuty |
| Respond | isolate NS, revoke key, block IP |
| Recover | restore from backup |
| Learn | postmortem |

---

## Audit logs

| Источник | Что даёт |
|----------|----------|
| K8s audit | кто создал Secret, exec в pod |
| CloudTrail / Cloud Audit | IAM, S3 API |
| Vault audit | access to secret path |
| GitLab audit | who changed protected variable |
| nginx / Ingress access | suspicious paths |

**Retention** и **immutability** (WORM bucket, SIEM) — требования compliance.

Практика: [kuber-advanced/04](../kuber-advanced/04-audit.md), [aws-advanced/21](../aws-advanced/21-guardduty-config-trail.md).

---

## Runtime security (концепт)

| Инструмент | Назначение |
|------------|------------|
| **Falco** | syscall rules (shell in container, sensitive file) |
| **eBPF** based | низкий overhead |
| **EDR** on nodes | enterprise endpoint |

Пример сигнала: `terminal shell in container` в prod namespace.

Не заменяет patch management — дополняет.

---

## CSPM и cloud alerts

| Сигнал | Действие |
|--------|----------|
| S3 bucket public | auto-remediate or ticket |
| Root login | page security |
| IAM policy change | review in 24h |
| GuardDuty Finding CRITICAL | runbook |

---

## Security metrics в observability

| Метрика / лог | Алерт |
|---------------|-------|
| 401/403 spike on admin | brute force |
| RBAC denied (audit) | reconnaissance |
| Image pull failures | registry attack / typo |
| cert expiry < 14d | renewal |

Связь: [observability-basic](../observability-basic/README.md), [sre/07–09](../sre/07-alerting-on-call.md).

---

## Инцидент security vs availability

| | Availability | Security |
|---|--------------|----------|
| Цель | restore service | contain + evidence |
| Первый шаг | scale / rollback | revoke creds, isolate |
| Comms | status page | legal / regulator (insurance!) |

**Не выключайте логи** при «тушении пожара» — нужны для расследования.

---

## Playbook (шаблон)

```markdown
## Security: leaked AWS key
1. Disable key (IAM) — owner @platform
2. CloudTrail filter Last 24h — @security
3. Rotate dependent secrets — @app-team
4. Postmortem 5 business days
```

---

## OpenSearch / SIEM (обзор)

Централизация: CloudTrail + K8s audit + app logs → **OpenSearch** → dashboards + alerts.

Практика: [opensearch-basic](../opensearch-basic/README.md) — не полноценный SOC-курс, но pipeline логов.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Alerting | [observability-intermediate](../observability-intermediate/README.md) |
| Postmortem | [sre/09](../sre/09-postmortems.md) |
| Vault audit | [secrets-advanced](../secrets-advanced/README.md) |

---

## Резюме

Detection — **audit everywhere + алерты на аномалии + runbooks**. Security и SRE делят on-call для **критичных** сигналов.

---

## Чек-лист

- [ ] K8s audit включён для secrets и RBAC?
- [ ] Есть runbook на compromised CI token?
- [ ] Логи хранятся дольше 30 дней?

**Дальше:** [12. Secure SDLC](12-secure-sdlc.md).
