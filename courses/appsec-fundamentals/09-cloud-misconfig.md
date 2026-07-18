# 09. Облако: IAM, сети, шифрование, публичные ресурсы

## Введение

Облако — **API с правами**. Типовая утечка: **публичный S3**, **0.0.0.0/0 на SSH**, **overprivileged IAM user**. Модель AWS переносится на **Яндекс.Облако, VK Cloud** (каталог/folder, SA, security groups, KMS).

---

## Shared responsibility

| Вы | Провайдер |
|----|-----------|
| IAM, SG, encryption config | физическая безопасность |
| Patch guest OS / image | гипервизор |
| K8s workload config | managed control plane (частично) |
| Data classification | regional compliance |

---

## IAM misconfigurations

| Misconfig | Риск |
|-----------|------|
| `AdministratorAccess` для CI user | полный account |
| No MFA on console users | credential stuffing |
| Long-lived access keys | leak в git |
| Wildcard `*` in policy | unintended S3/RDS |
| Cross-account trust без ExternalId | confused deputy |

**Least privilege:** start deny-all, add actions по мере необходимости.

Практика: [aws-basic/03](../aws-basic/03-iam.md), [aws-advanced/15 IRSA](../aws-advanced/15-irsa.md).

---

## Сеть

| Misconfig | Риск |
|-----------|------|
| SG `0.0.0.0/0` :22, :3389 | brute force |
| Public RDS / Redis | data exfiltration |
| Flat VPC | lateral movement |
| Missing VPC endpoints | traffic via public internet |

Связь: [networking-deep/14](../networking-deep/14-security-zones.md), [aws-intermediate/01](../aws-intermediate/01-vpc-custom.md).

---

## Storage (S3 / Object Storage)

| Проблема | Контроль |
|----------|----------|
| `Principal: *` | Block Public Access |
| Bucket policy + ACL conflict | policy review |
| No encryption | SSE-KMS default |
| Logging off | access logs → SIEM |

**CSPM** (Config, Security Hub, аналог в YC) — continuous check.

---

## Шифрование

| Слой | Механизм |
|------|----------|
| At rest | KMS / managed keys для disk, S3, RDS |
| In transit | TLS 1.2+, private link |
| Secrets | Secrets Manager / Vault, не Parameter Store plaintext в git |

Практика: [aws-advanced/19–20](../aws-advanced/19-kms-advanced.md).

---

## Аудит

| Сервис (AWS) | Аналоги (концепт) |
|--------------|-------------------|
| CloudTrail | audit trail API calls |
| Config | drift detection |
| GuardDuty | threat detection |

Правило: **включить audit до инцидента**, не после.

Практика: [aws-advanced/21–22](../aws-advanced/21-guardduty-config-trail.md).

---

## Kubernetes в облаке

| Риск | Контроль |
|------|----------|
| Public API endpoint | private + VPN/bastion |
| IMDS v1 | IMDSv2 required |
| Node IAM too broad | IRSA per workload |

---

## Российские облака (маппинг)

| AWS | Yandex Cloud / VK Cloud (типично) |
|-----|-----------------------------------|
| IAM User/Role | SA, folder roles |
| S3 | Object Storage bucket |
| Security Group | security group |
| KMS | KMS key |
| CloudTrail | Cloud Audit Trail |

Документация провайдера — источник имён; **принципы** те же.

---

## В mock-exams

| Тема | Курс |
|------|------|
| IAM, VPC | [aws-basic](../aws-basic/README.md), [aws-intermediate](../aws-intermediate/README.md) |
| WAF | [aws-advanced/11–12](../aws-advanced/11-waf-shield.md) |
| Organizations SCP | [aws-advanced/03](../aws-advanced/03-scp-governance.md) |

---

## Резюме

Cloud security = **IAM least privilege + network segmentation + encryption + audit + no public data**. Автоматизируйте проверки в CI и CSPM.

---

## Чек-лист

- [ ] Есть ли buckets/objects с public ACL?
- [ ] CI использует OIDC, не admin user?
- [ ] CloudTrail / audit включён на все регионы?

**Дальше:** [10. IaC](10-iac-policy.md).
