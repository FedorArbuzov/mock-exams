# 09. Security: FGAC, TLS, and a tabletop

> **Important:** the training stack [`deploy/opensearch`](../../deploy/opensearch/README.md) starts with `DISABLE_SECURITY_PLUGIN=true`. This chapter is **theory** and a **tabletop lab**. Do not disable security in production "for the convenience of curl".

## Threats to a search cluster

OpenSearch often holds **application logs**, tokens in query strings, PII, and internal hostnames. Typical incidents:

- an open port **9200** on the internet without auth (scanners index `/_cat/indices` within minutes);
- Dashboards with **admin/admin**;
- a snapshot repository in S3 without encryption;
- reading another tenant's data through a wildcard index pattern.

Parallel: [linux-intermediate/07-firewall](../linux-intermediate/07-firewall.md) — a closed port matters more than hoping "nobody will find the URL".

## Fine-Grained Access Control (FGAC)

The OpenSearch **security plugin** provides:

| Mechanism | Purpose |
|----------|------------|
| **Internal users** / **roles** | Who can log in |
| **Role mapping** | LDAP, SAML, JWT (including via a proxy) |
| **Index permissions** | `indices:admin/*`, `indices:data/read/*`, `indices:data/write/*` on name masks |
| **Document-level security** | Filtering documents within an index (multi-tenant) |
| **Field-level security** | Hide the `credit_card` field |
| **Tenants** | Isolation of saved objects in Dashboards |

An example role "read-only access to application X logs":

```text
index_permissions:
  index_patterns: ["logs-app-x-*"]
  allowed_actions: ["read", "search"]
```

The "ingest pipeline operator" role should be separate from "analyst" so that compromising the pipeline does not grant `cluster:admin/*`.

## TLS

| Connection | Requirement |
|------------|------------|
| Client → OpenSearch REST | HTTPS, certificate validation |
| Dashboards → OpenSearch | HTTPS inside the VPC |
| Node → node transport | TLS + certificate validation (cluster trust) |

HTTP on the stack is **lab only**. In an AWS managed domain, **HTTPS is enforced** by default for the endpoint.

Certificates: a corporate CA or ACM Private CA; rotate before expiry.

## Authentication in Dashboards

- With the security plugin enabled: login via OpenSearch Security, SAML, or an OIDC proxy.
- Do **not** store the master user password in git; Secrets Manager / Vault — as for RDS ([aws-basic/07-databases](../aws-basic/07-databases.md)).

## Audit and compliance

- **Audit logs** in the security plugin — who ran `DELETE`, changed ISM, exported a snapshot.
- Integration with SIEM: the same logs can be sent to a **separate** cluster or to S3 + Athena, so an attacker cannot erase their traces from the same OpenSearch they attacked.

## Tabletop lab (45–60 minutes, no stack)

**Scenario:** an engineer opened port 9200 on `0.0.0.0` in staging for "quick debugging" of the ingest pipeline. After 48 hours, foreign documents from mining appeared in the `logs-*` index, and the AWS bill grew.

Work in pairs or solo, written answers:

1. **Detection:** what signals? (No CloudTrail for self-hosted; `_cat/indices`, unusual growth in `store.size`, GuardDuty on EC2, an alert on an open SG).
2. **Containment:** SG default deny, revoke `0.0.0.0/0`, rotate credentials, forensic snapshot.
3. **Recovery:** a new domain with FGAC, restore from a snapshot before the incident, rotate secrets of applications that ended up in the logs.
4. **Prevention:** an 8-point checklist (TLS, FGAC, no public endpoint, ISM, separate admin role, …).

Check against what the training compose does **not** do: security off — a deliberate compromise.

## Relationship to observability and Kafka

- **Metrics** for an OpenSearch disk-watermark alert — in Prometheus ([observability-intermediate](../observability-intermediate/README.md)).
- **Broker logs** in Kafka should not leak into a shared `logs-*` without RBAC ([kafka-intermediate/19-security-basics](../kafka-intermediate/19-security-basics.md)).

## Checklist

- [ ] You can list the components of FGAC.
- [ ] You explain why a lab with `DISABLE_SECURITY_PLUGIN` is unacceptable in prod.
- [ ] You completed the tabletop: detect → contain → recover → prevent.

**Next:** [10-managed-opensearch.md](10-managed-opensearch.md).
