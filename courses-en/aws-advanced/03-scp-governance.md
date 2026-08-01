# 03. Service Control Policies (SCP)

## What is an SCP

An **SCP** is a policy at the **Organizations** level; it limits the **maximum** permissions across all IAM policies of member accounts.

```text
Effective permissions = IAM policies ∩ SCP (allowed only if BOTH allow)
```

An SCP does **not** grant — only **deny/limit**.

## Guardrail examples

| SCP | Effect |
|---|---|
| Deny `ec2:RunInstances` without tag `Environment` | no untagged VMs |
| Deny regions other than `eu-central-1` | data residency |
| Deny `s3:PutBucketPublicAccessBlock` false | can't open a bucket |
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
| Scope | user/role in an account | entire account/OU |
| Grant access | yes | no |
| Deny | yes | yes |

## FullAWSAccess

By default an OU has the `FullAWSAccess` SCP — it does not restrict anything. It's replaced with a **deny-list** or **allow-list** model.

## Checklist

- Does an SCP grant permissions? (no)
- Why can't an admin in an account bypass an Organizations SCP?
- Why deny a region?
- FullAWSAccess — what does it do?

Next lesson: [04-lab-scp.md](04-lab-scp.md).
