# 10. IaC and policy as code

## Intro

Terraform/Pulumi describe the **desired state** — and **desired holes**, if an SG is opened in the code. **IaC security** catches misconfigs **before** `apply`; **policy as code** keeps prod within the guardrails.

---

## Static analysis of IaC

| Tool | Focus |
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

Typical findings:

- S3 public access
- RDS `publicly_accessible = true`
- SG ingress 0.0.0.0/0
- Unencrypted EBS/RDS

Practice: [aws-intermediate/21](../aws-intermediate/21-security-ci.md).

---

## In the CI pipeline

```text
PR → terraform fmt/validate → tfsec/checkov → plan → human review → apply (OIDC)
```

| Rule | |
|---------|---|
| `soft_fail: false` on prod modules | |
| Plan artifact in the MR | |
| Separate role for plan vs apply | |

Practice: [aws-terraform/21–22](../aws-terraform/21-ci-terraform.md).

---

## State and secrets

| Risk | Control |
|------|----------|
| State in git | remote backend S3 + encryption |
| Secrets in a committed `.tfvars` | gitignore + SM |
| State readable by the whole team | IAM on the bucket, locking |

---

## Policy as code (runtime / admission)

| Layer | Tool |
|------|------------|
| Cloud org | SCP (AWS), org policies |
| K8s | Kyverno, OPA Gatekeeper |
| Git | branch protection |

**OPA Rego** is powerful with a steep learning curve; **Kyverno** uses YAML policies, simpler for a platform team.

Example of intent: "all Ingress must have a TLS annotation".

---

## Drift

| Type | Danger |
|-----|-----------|
| Manual console change | Terraform's next apply reverts OR hides the drift |
| Drift undetected | a security group opened in the UI |

**Config / drift detection** + GitOps as the "single source of truth".

---

## Pulumi / Terraform — security is the same

Scanners look at the **HCL/plan JSON**, not the language. TypeScript Pulumi → `trivy config` on the generated stacks or a policy on the plan.

---

## In mock-exams

| Topic | Course |
|------|------|
| Terraform + LocalStack | [aws-terraform](../aws-terraform/README.md) |
| Security CI | [aws-intermediate/21](../aws-intermediate/21-security-ci.md) |
| Kyverno | [kuber-advanced/11](../kuber-advanced/11-lab-validating-webhook.md) |
| SCP | [aws-advanced/03–04](../aws-advanced/03-scp-governance.md) |

---

## Summary

IaC — **infrastructure code = attack code**. Scan it in the PR, store state securely, and complement it with admission in K8s.

---

## Checklist

- [ ] tfsec/checkov in every MR with Terraform?
- [ ] State bucket encrypted + locked?
- [ ] Is there Kyverno/Gatekeeper in the prod cluster?

**Next:** [11. Detection](11-detection-response.md).
