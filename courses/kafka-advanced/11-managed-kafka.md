# 11. Managed Kafka: MSK, Confluent Cloud, self-hosted

## Введение: «строим сами или берём managed?»

Platform team считает TCO: **MSK** в AWS, **Confluent Cloud**, или **Strimzi on EKS**. Интервьюер спрашивает: кто патчит брокеры, как **IAM**, что с **Kafka Connect**, какой **SLA**.

## Что вы узнаете

- Слои ответственности **shared responsibility**.
- **Amazon MSK** vs **Confluent Cloud** vs **self-hosted (Strimzi)**.
- Networking: VPC, PrivateLink, SASL/SCRAM, IAM auth.
- Когда managed **не** окупается.

**Лаба:** [12-lab-managed-mapping](12-lab-managed-mapping.md).

---

## Shared responsibility

| Вы | Провайдер |
|----|-----------|
| ACL design, topic design, client tuning | patching Kafka, broker HA |
| Schema governance | control plane (частично) |
| Consumer apps | AZ placement брокеров (MSK) |
| Encryption in transit config | underlying hardware |

---

## Amazon MSK

- Kafka **в вашем VPC**; security groups, subnets.
- Auth: **IAM**, **SCRAM**, mTLS, no auth (dev only).
- **MSK Connect** — managed Connect workers.
- **MSK Serverless** — autoscale, limits на throughput/partition.
- Monitoring: CloudWatch, Prometheus open monitoring.

**Плюсы:** нативная интеграция AWS, billing прозрачен, данные в VPC.  
**Минусы:** версии Kafka с задержкой, не все Confluent features.

См. [`aws-intermediate`](../aws-intermediate/README.md) для VPC patterns.

---

## Confluent Cloud

- SaaS / hybrid (**Confluent Platform** on-prem).
- **ksqlDB**, **Schema Registry**, **Stream Governance**, **Cluster Linking**.
- Billing по **CKU** / throughput tier.

**Плюсы:** быстрый time-to-market, rich tooling.  
**Минусы:** cost at scale, vendor lock-in concerns.

---

## Self-hosted (Strimzi / Operator)

- Kafka на **Kubernetes** — [`StatefulSet`](../kuber-intermediate/01-statefulset.md), PVC, rolling updates.
- Вы делаете: upgrades, capacity, incident response.
- **Плюсы:** control, cost at very large scale, on-prem air-gap.
- **Минусы:** нужна сильная platform team.

[`deploy/kafka`](../../deploy/kafka/README.md) — учебный аналог **self-managed** без k8s.

---

## Сравнение (интервью)

| Критерий | MSK | Confluent Cloud | Strimzi self |
|----------|-----|-----------------|--------------|
| Ops burden | низкий | низкий | высокий |
| VPC/private | да | PrivateLink | да |
| IAM native | да | OIDC/cloud IAM | K8s RBAC |
| ksqlDB | нет* | да | CP license |
| Connect | MSK Connect | managed | self |
| Multi-DC | MM2 / Replicator | Cluster Linking | MM2 |

\* проверяйте актуальную roadmap AWS.

---

## Security в managed

- **Encryption in transit** mandatory prod.
- **Secrets Manager** / **Parameter Store** для SCRAM.
- **Private** bootstrap brokers only.
- **ACL** или IAM policies (MSK) — least privilege per app.

См. [13-security-advanced](13-security-advanced.md).

---

## Cost drivers

| Фактор | Влияние |
|--------|---------|
| Retention × ingress | storage |
| Cross-AZ traffic | $$$ |
| RF=3 | ×3 |
| Partition count | metadata, file handles |
| Egress to internet | avoid |

Tiered storage: [06-tiered-storage](06-tiered-storage.md).

---

## Выбор (framework)

1. **Cloud уже AWS-only?** → MSK в shortlist.
2. **Нужен ksql + governance из коробки?** → Confluent.
3. **Petabyte и своя SRE?** → Strimzi/bare metal.
4. **Compliance on-prem?** → Confluent Platform / Strimzi.

---

## Резюме

Managed снимает **day-2 broker ops**, не снимает **data modeling** и **client discipline**. MSK = AWS-native; Confluent = product suite; self = control + cost curve.

**Дальше:** [12-lab-managed-mapping](12-lab-managed-mapping.md).
