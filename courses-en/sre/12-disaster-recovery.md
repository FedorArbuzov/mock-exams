# 12. DR, RTO/RPO, and drills

## Intro: "the data center burned down — do we have a plan?"

A cloud region is unavailable for **4 hours**. Backups exist, but **nobody has restored** from them in six months. DNS points to the old cluster. The contractual RTO is **1 hour**, the reality is **1 day**. SRE is responsible not only for "restart the Pod" but for **surviving a disaster** with measurable promises.

---

## RTO and RPO

| Term | Definition | Question |
|--------|-------------|--------|
| **RPO** (Recovery Point Objective) | how much **data** can be lost | "Is losing the last 5 min acceptable?" |
| **RTO** (Recovery Time Objective) | how long to **restore the service** | "In how many hours does checkout work again?" |

```text
Incident ──►|.... RPO ....|──► last recoverable backup
            ──►|...... RTO ......|──► service restored
```

**Stricter RPO/RTO** — **more expensive** (sync replication, active-active).

---

## DR strategies

| Strategy | RTO | RPO | Cost |
|-----------|-----|-----|------|
| **Backup & restore** | hours–days | hours | $ |
| **Pilot light** | hours | minutes | $$ |
| **Warm standby** | minutes–hours | minutes | $$$ |
| **Active-active multi-region** | minutes | ~0 | $$$$ |

The choice is the **business's**, not SRE's in a vacuum. A payment gateway and an internal wiki are **different** tiers.

---

## Backup: what to check

| Question | Why it matters |
|--------|--------------|
| Is the backup **automatic**? | manual = will be forgotten |
| **Encrypted**? | compliance |
| **Restore tested**? | a backup without a restore is hope |
| **Retention** vs RPO? | a daily backup at RPO 1h — not enough |
| **Cross-region** copy? | region loss |

[postgresql-ops](../postgresql-ops/README.md), [aws-advanced/23](../aws-advanced/23-backup-dr.md).

---

## DR runbook

Minimum:

1. **Declare** a disaster (who decides).
2. **Comms** template ([chapter 08](08-incident-management.md)).
3. **DNS / traffic** switch steps.
4. **Restore** order: DB → cache → app → verify SLI.
5. **Return** to primary (failback) — a separate plan.

**Runbook in Git**, reviewed every six months.

---

## DR drill

| Type | Frequency |
|-----|---------|
| Tabletop | quarterly |
| Restore DB on staging | monthly |
| Full region failover | 1–2× per year |

Without a drill, the RTO is a **fantasy**.

---

## Multi-region and data

| Pattern | Complexity |
|---------|-----------|
| Read replica in another region | medium |
| Active-active writes | conflicts, CRDT, sharding |
| Global load balancing | DNS, health checks |

**Split brain** is the price of active-active; you need **quorum** and fencing.

---

## In mock-exams

| Topic | Course |
|------|------|
| Velero backup K8s | [kuber-advanced/23](../kuber-advanced/23-velero.md) |
| S3 CRR | [aws-advanced/24](../aws-advanced/24-lab-s3-crr.md) |
| Postgres PITR | [postgresql-intermediate](../postgresql-intermediate/README.md) |

Tabletop: "an AZ is lost" — fill in the RTO/RPO for a fictional checkout.

---

## Checklist

- [ ] Are RTO/RPO recorded per tier?
- [ ] Was a restore tested < 6 months ago?
- [ ] Does a DR runbook exist?
- [ ] Is the customer SLA aligned with the RTO?

**Next:** [13. How to embed SRE in a company](13-organizing-sre.md).
