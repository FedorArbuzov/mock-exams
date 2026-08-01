# 05. Landing Zone and Control Tower

## Landing Zone

A **Landing Zone** is a baseline multi-account environment: networking, logging, security, and IAM patterns "out of the box".

Components of a typical LZ:

| Component | Purpose |
|---|---|
| Organizations + OU | structure |
| SCP | guardrails |
| Central logging account | CloudTrail, Config, VPC Flow |
| Shared services | DNS, egress, CI |
| Account factory | new account in minutes |

## AWS Control Tower

A managed service on top of Organizations:

- **Account Factory** — creates an account with a baseline.
- **Guardrails** — managed SCPs (for example, disallow public S3).
- **Dashboard** — drift, non-compliance.

Alternatives: **Terraform Landing Zone Accelerator (LZA)**, **AFT** (Account Factory for Terraform) — for teams without the Control Tower UI.

## Account vending flow

```text
Request (ServiceNow / PR)
    → AFT / Control Tower
    → New account in Workloads OU
    → Default VPC disabled, logging enabled
    → CI role pre-created
```

## vs "manual" Terraform

| Control Tower | Custom Terraform LZ |
|---|---|
| Fast start | Full control |
| Less flexibility | More maintenance |
| AWS opinionated | Your standards |

## Checklist

- What is a Landing Zone in one sentence?
- Why a central logging account?
- Control Tower vs eksctl — different levels?
- Account Factory — what does it create?

Next lesson: [06-lab-oidc-ci.md](06-lab-oidc-ci.md).
