# Architecture (fill in for the final submission)

## Accounts and OUs

```mermaid
flowchart TB
  Mgmt[Management Account]
  Sec[Security OU]
  Dev[Workloads Dev]
  Prod[Workloads Prod]
  Mgmt --> Sec
  Mgmt --> Dev
  Mgmt --> Prod
```

## Application flow

```mermaid
flowchart LR
  Client --> WAF
  WAF --> ALB
  ALB --> EKS[EKS Ingress]
  EKS --> API[API Pods]
  Client --> S3upload[S3 uploads]
  S3upload --> SQS
  SQS --> Worker[Lambda or K8s Job]
  Worker --> S3thumbs[S3 thumbs]
  Worker --> DDB[(DynamoDB)]
  API --> DDB
```

## Controls checklist

- [ ] SCP attached to Workloads OU
- [ ] CloudTrail org trail → security account S3
- [ ] Config rule: no public S3
- [ ] GuardDuty enabled
- [ ] KMS CMK for S3
- [ ] IRSA least privilege
- [ ] Budget alert 80%

## DR

| Metric | Target |
|---|---|
| RPO | _hours_ |
| RTO | _hours_ |
| CRR region | _eu-west-1_ |

## Runbooks

- `runbook-guardduty.md` — TBD
- `dr-failover.md` — TBD
