# 09. Cloud: IAM, networks, encryption, public resources

## Intro

The cloud is an **API with permissions**. A typical leak: a **public S3**, **0.0.0.0/0 on SSH**, an **overprivileged IAM user**. The AWS model maps onto **Yandex Cloud, VK Cloud** (catalog/folder, SA, security groups, KMS).

---

## Shared responsibility

| You | Provider |
|----|-----------|
| IAM, SG, encryption config | physical security |
| Patch guest OS / image | hypervisor |
| K8s workload config | managed control plane (partially) |
| Data classification | regional compliance |

---

## IAM misconfigurations

| Misconfig | Risk |
|-----------|------|
| `AdministratorAccess` for a CI user | the entire account |
| No MFA on console users | credential stuffing |
| Long-lived access keys | leak into git |
| Wildcard `*` in a policy | unintended S3/RDS |
| Cross-account trust without an ExternalId | confused deputy |

**Least privilege:** start deny-all, add actions as needed.

Practice: [aws-basic/03](../aws-basic/03-iam.md), [aws-advanced/15 IRSA](../aws-advanced/15-irsa.md).

---

## Network

| Misconfig | Risk |
|-----------|------|
| SG `0.0.0.0/0` :22, :3389 | brute force |
| Public RDS / Redis | data exfiltration |
| Flat VPC | lateral movement |
| Missing VPC endpoints | traffic via the public internet |

Related: [networking-deep/14](../networking-deep/14-security-zones.md), [aws-intermediate/01](../aws-intermediate/01-vpc-custom.md).

---

## Storage (S3 / Object Storage)

| Problem | Control |
|----------|----------|
| `Principal: *` | Block Public Access |
| Bucket policy + ACL conflict | policy review |
| No encryption | SSE-KMS default |
| Logging off | access logs → SIEM |

**CSPM** (Config, Security Hub, an analog in YC) — continuous check.

---

## Encryption

| Layer | Mechanism |
|------|----------|
| At rest | KMS / managed keys for disk, S3, RDS |
| In transit | TLS 1.2+, private link |
| Secrets | Secrets Manager / Vault, not Parameter Store plaintext in git |

Practice: [aws-advanced/19–20](../aws-advanced/19-kms-advanced.md).

---

## Audit

| Service (AWS) | Analogs (concept) |
|--------------|-------------------|
| CloudTrail | audit trail of API calls |
| Config | drift detection |
| GuardDuty | threat detection |

Rule: **enable audit before an incident**, not after.

Practice: [aws-advanced/21–22](../aws-advanced/21-guardduty-config-trail.md).

---

## Kubernetes in the cloud

| Risk | Control |
|------|----------|
| Public API endpoint | private + VPN/bastion |
| IMDS v1 | IMDSv2 required |
| Node IAM too broad | IRSA per workload |

---

## Russian clouds (mapping)

| AWS | Yandex Cloud / VK Cloud (typical) |
|-----|-----------------------------------|
| IAM User/Role | SA, folder roles |
| S3 | Object Storage bucket |
| Security Group | security group |
| KMS | KMS key |
| CloudTrail | Cloud Audit Trail |

The provider's documentation is the source for names; the **principles** are the same.

---

## In mock-exams

| Topic | Course |
|------|------|
| IAM, VPC | [aws-basic](../aws-basic/README.md), [aws-intermediate](../aws-intermediate/README.md) |
| WAF | [aws-advanced/11–12](../aws-advanced/11-waf-shield.md) |
| Organizations SCP | [aws-advanced/03](../aws-advanced/03-scp-governance.md) |

---

## Summary

Cloud security = **IAM least privilege + network segmentation + encryption + audit + no public data**. Automate the checks in CI and CSPM.

---

## Checklist

- [ ] Are there buckets/objects with a public ACL?
- [ ] Does CI use OIDC, not an admin user?
- [ ] Is CloudTrail / audit enabled in all regions?

**Next:** [10. IaC](10-iac-policy.md).
