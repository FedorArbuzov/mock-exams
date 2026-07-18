# 09. Безопасность: FGAC, TLS и tabletop

> **Важно:** учебный стенд [`deploy/opensearch`](../../deploy/opensearch/README.md) поднимается с `DISABLE_SECURITY_PLUGIN=true`. Эта глава — **теория** и **настольная лаба** (tabletop). Не отключайте security в production «для удобства curl».

## Угрозы для кластера поиска

OpenSearch часто содержит **логи приложений**, токены в query string, PII, внутренние hostnames. Типичные инциденты:

- открытый порт **9200** в интернет без auth (сканеры индексируют `/_cat/indices` за минуты);
- Dashboards с **admin/admin**;
- snapshot repository в S3 без encryption;
- чтение чужого tenant'а через wildcard index pattern.

Параллель: [linux-intermediate/07-firewall](../linux-intermediate/07-firewall.md) — закрытый порт важнее, чем надежда на «никто не узнает URL».

## Fine-Grained Access Control (FGAC)

**Security plugin** OpenSearch даёт:

| Механизм | Назначение |
|----------|------------|
| **Internal users** / **roles** | Кто может логиниться |
| **Role mapping** | LDAP, SAML, JWT (в т.ч. через proxy) |
| **Index permissions** | `indices:admin/*`, `indices:data/read/*`, `indices:data/write/*` на маски имён |
| **Document-level security** | Фильтр документов внутри индекса (multi-tenant) |
| **Field-level security** | Скрыть поле `credit_card` |
| **Tenants** | Изоляция saved objects в Dashboards |

Пример роли «только чтение логов приложения X»:

```text
index_permissions:
  index_patterns: ["logs-app-x-*"]
  allowed_actions: ["read", "search"]
```

Роль «ingest pipeline operator» — отдельно от «analyst», чтобы compromise pipeline не давал `cluster:admin/*`.

## TLS

| Соединение | Требование |
|------------|------------|
| Client → OpenSearch REST | HTTPS, проверка сертификата |
| Dashboards → OpenSearch | HTTPS внутри VPC |
| Node → node transport | TLS + certificate validation (cluster trust) |

На стенде HTTP — **только lab**. В AWS managed domain **HTTPS enforced** по умолчанию для endpoint.

Сертификаты: корпоративный CA или ACM Private CA; ротация до истечения.

## Аутентификация в Dashboards

- Включённый security plugin: логин через OpenSearch Security, SAML, или OIDC proxy.
- **Не** хранить master user password в git; Secrets Manager / Vault — как для RDS ([aws-basic/07-databases](../aws-basic/07-databases.md)).

## Аудит и соответствие

- **Audit logs** security plugin — кто выполнил `DELETE`, смену ISM, export snapshot.
- Связка с SIEM: те же логи можно слать в **отдельный** кластер или в S3 + Athena, чтобы атакующий не удалил следы из того же OpenSearch, который атаковал.

## Tabletop-лаба (45–60 минут, без стенда)

**Сценарий:** инженер открыл порт 9200 на `0.0.0.0` в staging для «быстрого дебага» ingest pipeline. Через 48 часов в индексе `logs-*` появились чужие документы с майнингом, а billing AWS вырос.

Работа в паре или solo, письменные ответы:

1. **Обнаружение:** какие сигналы? (CloudTrail нет для self-hosted; `_cat/indices`, необычный рост `store.size`, GuardDuty на EC2, алерт на открытый SG).
2. **Сдерживание:** SG default deny, revoke `0.0.0.0/0`, rotate credentials, snapshot forensic.
3. **Восстановление:** новый domain с FGAC, restore из snapshot до инцидента, ротация секретов приложений, попавших в логи.
4. **Профилактика:** checklist из 8 пунктов (TLS, FGAC, no public endpoint, ISM, separate admin role, …).

Сверьте с тем, что **не** делает учебный compose: security off — осознанный компромисс.

## Связь с observability и Kafka

- **Метрики** алерта на disk watermark OpenSearch — в Prometheus ([observability-intermediate](../observability-intermediate/README.md)).
- **Логи** broker'а в Kafka не должны утекать в общий `logs-*` без RBAC ([kafka-intermediate/19-security-basics](../kafka-intermediate/19-security-basics.md)).

## Чек-лист

- [ ] Можете перечислить компоненты FGAC.
- [ ] Объясняете, почему lab с `DISABLE_SECURITY_PLUGIN` недопустим в prod.
- [ ] Заполнили tabletop: detect → contain → recover → prevent.

**Дальше:** [10-managed-opensearch.md](10-managed-opensearch.md).
