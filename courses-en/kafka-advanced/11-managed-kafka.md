# 11. Managed Kafka: MSK, Confluent Cloud, self-hosted

## Intro: "build it ourselves or take managed?"

The platform team calculates TCO: **MSK** on AWS, **Confluent Cloud**, or **Strimzi on EKS**. The interviewer asks: who patches the brokers, how does **IAM** work, what about **Kafka Connect**, and what's the **SLA**.

## What you'll learn

- The **shared responsibility** layers.
- **Amazon MSK** vs **Confluent Cloud** vs **self-hosted (Strimzi)**.
- Networking: VPC, PrivateLink, SASL/SCRAM, IAM auth.
- When managed **doesn't** pay off.

**Lab:** [12-lab-managed-mapping](12-lab-managed-mapping.md).

---

## Shared responsibility

| You | Provider |
|----|-----------|
| ACL design, topic design, client tuning | patching Kafka, broker HA |
| Schema governance | control plane (partially) |
| Consumer apps | broker AZ placement (MSK) |
| Encryption in transit config | underlying hardware |

---

## Amazon MSK

- Kafka **in your VPC**; security groups, subnets.
- Auth: **IAM**, **SCRAM**, mTLS, no auth (dev only).
- **MSK Connect** — managed Connect workers.
- **MSK Serverless** — autoscale, limits on throughput/partition.
- Monitoring: CloudWatch, Prometheus open monitoring.

**Pros:** native AWS integration, transparent billing, data in the VPC.  
**Cons:** Kafka versions lag behind, not all Confluent features.

See [`aws-intermediate`](../aws-intermediate/README.md) for VPC patterns.

---

## Confluent Cloud

- SaaS / hybrid (**Confluent Platform** on-prem).
- **ksqlDB**, **Schema Registry**, **Stream Governance**, **Cluster Linking**.
- Billing by **CKU** / throughput tier.

**Pros:** fast time-to-market, rich tooling.  
**Cons:** cost at scale, vendor lock-in concerns.

---

## Self-hosted (Strimzi / Operator)

- Kafka on **Kubernetes** — [`StatefulSet`](../kuber-intermediate/01-statefulset.md), PVC, rolling updates.
- You do: upgrades, capacity, incident response.
- **Pros:** control, cost at very large scale, on-prem air-gap.
- **Cons:** you need a strong platform team.

[`deploy/kafka`](../../deploy/kafka/README.md) — a training analog of **self-managed** without k8s.

---

## Comparison (interview)

| Criterion | MSK | Confluent Cloud | Strimzi self |
|----------|-----|-----------------|--------------|
| Ops burden | low | low | high |
| VPC/private | yes | PrivateLink | yes |
| IAM native | yes | OIDC/cloud IAM | K8s RBAC |
| ksqlDB | no* | yes | CP license |
| Connect | MSK Connect | managed | self |
| Multi-DC | MM2 / Replicator | Cluster Linking | MM2 |

\* check the current AWS roadmap.

---

## Security in managed

- **Encryption in transit** mandatory in prod.
- **Secrets Manager** / **Parameter Store** for SCRAM.
- **Private** bootstrap brokers only.
- **ACL** or IAM policies (MSK) — least privilege per app.

See [13-security-advanced](13-security-advanced.md).

---

## Cost drivers

| Factor | Impact |
|--------|---------|
| Retention × ingress | storage |
| Cross-AZ traffic | $$$ |
| RF=3 | ×3 |
| Partition count | metadata, file handles |
| Egress to internet | avoid |

Tiered storage: [06-tiered-storage](06-tiered-storage.md).

---

## Choice (framework)

1. **Already AWS-only cloud?** → MSK on the shortlist.
2. **Need ksql + governance out of the box?** → Confluent.
3. **Petabyte and your own SRE?** → Strimzi/bare metal.
4. **On-prem compliance?** → Confluent Platform / Strimzi.

---

## Summary

Managed removes **day-2 broker ops**, but not **data modeling** and **client discipline**. MSK = AWS-native; Confluent = product suite; self = control + cost curve.

**Next:** [12-lab-managed-mapping](12-lab-managed-mapping.md).
