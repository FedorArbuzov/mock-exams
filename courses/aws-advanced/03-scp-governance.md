# 03. Service Control Policies (SCP)

## Что такое SCP

**SCP** — policy на уровне **Organizations**, ограничивает **максимальные** права во всех IAM policy member accounts.

```text
Effective permissions = IAM policies ∩ SCP (разрешено только если ОБА allow)
```

SCP **не** grant — только **deny/limit**.

## Примеры guardrails

| SCP | Эффект |
|---|---|
| Deny `ec2:RunInstances` без tag `Environment` | нет untagged VMs |
| Deny regions кроме `eu-central-1` | data residency |
| Deny `s3:PutBucketPublicAccessBlock` false | нельзя открыть bucket |
| Deny root user actions | harden root |

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyUnapprovedRegions",
    "Effect": "Deny",
    "Action": "*",
    "Resource": "*",
    "Condition": {
      "StringNotEquals": {
        "aws:RequestedRegion": ["eu-central-1", "eu-west-1"]
      }
    }
  }]
}
```

## SCP vs IAM

| | IAM | SCP |
|---|---|---|
| Scope | user/role в account | весь account/OU |
| Grant access | да | нет |
| Deny | да | да |

## FullAWSAccess

По умолчанию OU имеет `FullAWSAccess` SCP — не ограничивает. Заменяют на **deny-list** или **allow-list** модель.

## Чек-лист

- SCP grant'ит права? (нет)
- Почему admin в account не обходит SCP Organizations?
- Зачем deny region?
- FullAWSAccess — что делает?

Следующий урок: [04-lab-scp.md](04-lab-scp.md).
