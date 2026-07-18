# 10. IaC и policy as code

## Введение

Terraform/Pulumi описывают **желаемое состояние** — и **желаемые дыры**, если SG открыт в коде. **IaC security** ловит misconfig **до** `apply`; **policy as code** удерживает prod в рамках guardrails.

---

## Static analysis IaC

| Tool | Фокус |
|------|--------|
| **tfsec** | Terraform, AWS-focused rules |
| **checkov** | TF, K8s YAML, CloudFormation |
| **trivy config** | multi-format |
| **terrascan** | policies as code |

```bash
tfsec .
checkov -d .
trivy config .
```

Типичные findings:

- S3 public access
- RDS `publicly_accessible = true`
- SG ingress 0.0.0.0/0
- Unencrypted EBS/RDS

Практика: [aws-intermediate/21](../aws-intermediate/21-security-ci.md).

---

## В CI pipeline

```text
PR → terraform fmt/validate → tfsec/checkov → plan → human review → apply (OIDC)
```

| Правило | |
|---------|---|
| `soft_fail: false` на prod modules | |
| Plan artifact в MR | |
| Separate role plan vs apply | |

Практика: [aws-terraform/21–22](../aws-terraform/21-ci-terraform.md).

---

## State и secrets

| Риск | Контроль |
|------|----------|
| State в git | remote backend S3 + encryption |
| Secrets in `.tfvars` committed | gitignore + SM |
| State readable всей команде | IAM on bucket, locking |

---

## Policy as code (runtime / admission)

| Слой | Инструмент |
|------|------------|
| Cloud org | SCP (AWS), org policies |
| K8s | Kyverno, OPA Gatekeeper |
| Git | branch protection |

**OPA Rego** — мощно, крутая кривая; **Kyverno** — YAML policies, проще для platform team.

Пример намерения: «все Ingress must have TLS annotation».

---

## Drift

| Тип | Опасность |
|-----|-----------|
| Manual console change | Terraform next apply reverts OR hides drift |
| Drift undetected | security group opened в UI |

**Config / drift detection** + GitOps «single source of truth».

---

## Pulumi / Terraform — security одинаково

Сканеры смотрят **HCL/plan JSON**, не язык. TypeScript Pulumi → `trivy config` на сгенерированные stacks или policy на plan.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Terraform + LocalStack | [aws-terraform](../aws-terraform/README.md) |
| Security CI | [aws-intermediate/21](../aws-intermediate/21-security-ci.md) |
| Kyverno | [kuber-advanced/11](../kuber-advanced/11-lab-validating-webhook.md) |
| SCP | [aws-advanced/03–04](../aws-advanced/03-scp-governance.md) |

---

## Резюме

IaC — **код инфраструктуры = код атаки**. Сканируйте в PR, храните state безопасно, дополняйте admission в K8s.

---

## Чек-лист

- [ ] tfsec/checkov в каждом MR с Terraform?
- [ ] State bucket encrypted + locked?
- [ ] Есть ли Kyverno/Gatekeeper в prod cluster?

**Дальше:** [11. Обнаружение](11-detection-response.md).
