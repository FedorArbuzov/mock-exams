# 13. Compliance и benchmarks для инженера

## Введение

**Compliance** (PCI DSS, 152-ФЗ, отраслевые требования страхования) задаёт **что доказать аудитору**. Инженеру нужны **benchmarks** — конкретные чеклисты hardening, не только PDF политик.

---

## Benchmarks (практика)

| Benchmark | Область |
|-----------|---------|
| **CIS Kubernetes** | API, kubelet, RBAC |
| **CIS Docker** | daemon, images |
| **CIS AWS Foundations** | IAM, logging, networking |
| **CIS PostgreSQL** | auth, logging |

Инструменты: **kube-bench**, **Docker bench**, **Prowler** (AWS) — отчёт + remediation hints.

---

## Что обычно требуют аудиторы

| Тема | Артефакт |
|------|----------|
| Access control | IAM matrix, RBAC export |
| Encryption | KMS keys, TLS configs |
| Logging | retention policy, sample logs |
| Change management | MR history, approvals |
| Vulnerability mgmt | scan reports, SLA |
| Backup / DR | RTO/RPO doc, test record |
| Incident response | runbooks, postmortems |

Связь: [sre/12](../sre/12-disaster-recovery.md), [postgresql-security/12](../postgresql-security/12-compliance.md).

---

## 152-ФЗ и персональные данные (РФ, обзор)

| Требование | Infra-ответ |
|------------|-------------|
| Локализация ПДн | РФ region / YC zone |
| Учёт доступа | audit logs |
| Защита при передаче | TLS |
| Резервное копирование | encrypted backup |

**Юристы** интерпретируют закон; инженер **реализует** controls по их matrix.

---

## Страхование (контекст вакансий)

| Риск | Контроль |
|------|----------|
| Утечка данных полисов | encryption, DLP (опционально), access logs |
| Недоступность | HA, DR drills |
| Подмена расчёта | integrity monitoring, signed releases |
| Third-party | vendor security questionnaire |

Threat model из [главы 02](02-threat-modeling.md) привяжите к **конкретным активам** (полис, платёж, мед.данные).

---

## Segregation of duties

| Роль | Не должен |
|------|-----------|
| Developer | apply to prod alone |
| DevOps | approve own MR to prod policy |
| Security | единственный holder root (anti-pattern) |

**Four eyes** на prod Terraform apply и break-glass access.

---

## Documentation minimum

Для namespace / сервиса храните в Git:

- `SECURITY.md` — contacts, reporting
- `threat-model.md` — обновлять при major change
- `baseline.yaml` — Kyverno policies list
- `exceptions.md` — time-boxed waivers

---

## В mock-exams

| Тема | Курс |
|------|------|
| PG compliance | [postgresql-security](../postgresql-security/README.md) |
| Linux audit | [linux-security/12–13](../linux-security/12-audit-review.md) |
| AWS governance | [aws-advanced/01–05](../aws-advanced/README.md) |

---

## Резюме

Compliance для инженера — **benchmarks + доказательства controls + audit trail**. Автоматизируйте CIS-проверки в CI/CD и quarterly reports.

---

## Чек-лист

- [ ] Запускали ли kube-bench / аналог на кластере?
- [ ] Есть ли матрица «роль → доступ к prod»?
- [ ] Retention логов соответствует политике?

**Дальше:** [14. Синтез](14-synthesis.md).
