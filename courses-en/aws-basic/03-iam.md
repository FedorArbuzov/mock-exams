# 03. IAM: users, roles, policies

## Why IAM

**IAM (Identity and Access Management)** is a global AWS service: **who** can do **what** with **which** resources.

Without IAM:

- Anyone with an access key could delete everything in the account.
- Applications couldn't be granted minimal permissions (the principle of least privilege).

IAM has **no** charge. It's not Active Directory, but the concepts are similar.

## Core entities

| Entity | What it is | When to use it |
|---|---|---|
| **Root user** | The email the account was created with | Billing and break-glass only; **not for daily work** |
| **IAM User** | A person or service with long-lived credentials | Legacy; avoid for applications |
| **IAM Group** | A set of users (Developers, Admins) | Convenient for assigning policies to a group |
| **IAM Role** | A set of permissions **without** its own keys | EC2, Lambda, cross-account, **recommended** |
| **Policy** | A JSON document with permissions | Attached to a user/role/group |

```text
Policy (permissions document)
    │
    ├── attach → User "alice"
    ├── attach → Group "developers" → bob, carol
    └── attach → Role "lambda-s3-reader"
                      │
                      └── assume → Lambda function
```

## Policy document

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBuckets",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::my-course-*"
    },
    {
      "Effect": "Deny",
      "Action": "s3:DeleteBucket",
      "Resource": "*"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `Effect` | `Allow` or `Deny` (**Deny always wins**) |
| `Action` | An API operation (`ec2:StartInstances`, `s3:GetObject`) |
| `Resource` | The resource ARN or `*` |
| `Condition` | IP, MFA, time, tags (optional) |

### Managed vs Inline policies

- **AWS Managed** — ready-made (`AdministratorAccess`, `ReadOnlyAccess`). Don't hand out `AdministratorAccess` without need.
- **Customer Managed** — your own, reusable ones.
- **Inline** — attached to a single user/role, deleted along with it.

## ARN — a resource identifier

```text
arn:aws:iam::123456789012:role/lambda-execution
arn:aws:s3:::my-bucket/object.jpg
arn:aws:ec2:eu-central-1:123456789012:instance/i-0abc123
```

Format: `arn:partition:service:region:account-id:resource`.

## Roles vs users

### IAM User + Access Key (the old pattern)

```text
Developer → Access Key ID + Secret → aws cli
```

Downsides: keys leak, they're hard to rotate, and they're long-lived.

### IAM Role (the modern pattern)

```text
Lambda → assume Role "lambda-role" → temporary credentials (STS)
EC2 instance profile → Role → access to S3 without keys in code
```

**AssumeRole** via **STS (Security Token Service)** issues temporary keys (usually 1 hour).

## Trust policy (who can assume the role)

A Role has two types of policy:

1. **Permission policy** — what the role **can do**.
2. **Trust policy** — **who can** assume this role.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

Lambda "assumes" the role because the trust policy allows `lambda.amazonaws.com`.

## IRSA (for EKS)

In Kubernetes on AWS, pods get an IAM Role via **IAM Roles for Service Accounts** — the analog of a ServiceAccount + RBAC, but for the AWS API.

## MFA and least privilege

- Enable **MFA** on the root and admin users.
- Grant minimal permissions: `s3:GetObject` on one bucket, not `s3:*` on `*`.
- Use **IAM Access Analyzer** to find excessive permissions.

## Local emulation

LocalStack / MiniStack **don't validate** real keys. In Terraform and the CLI you'll often use:

```hcl
access_key = "test"
secret_key = "test"
```

IAM behavior is simplified, but API calls (`iam:CreateRole`) work for learning.

## Checklist

- Why isn't the root user meant for daily work?
- How does a Role differ from a User?
- Which wins: Allow or Deny?
- Why does Lambda need a Role instead of an Access Key?
- What is an ARN?

Next lesson: [04-vpc-networking.md](04-vpc-networking.md).
