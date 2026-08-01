# AWS Basic

A foundational Amazon Web Services course. The goal is to understand the **AWS cloud model**, its key services and terminology, so that you can confidently write Terraform later and practice **locally** (LocalStack / MiniStack) without any risk to your bill.

Terraform, `tflocal`, and labs are covered in the [`aws-terraform`](../aws-terraform/README.md) course. This one covers AWS theory only.

## Who it's for

- Newcomers to the cloud (Kubernetes experience from the `kuber-*` courses is a plus, but not required).
- Anyone who wants to pass the **AWS Certified Cloud Practitioner (CLF-C02)** or prepare for the **Solutions Architect Associate**.
- Developers and DevOps engineers before an IaC course.

## Local practice (later)

| Tool | RAM | Services | License |
|---|---|---|---|
| [LocalStack](https://localstack.cloud/) | ~500 MB+ | 40+ | Community + Pro |
| [MiniStack](https://github.com/ministackorg/ministack) | ~30 MB | 41 | MIT, free |

Both listen on port `4566`. See [10-local-emulation.md](10-local-emulation.md) for details.

## Curriculum — theory ✅

All 10 lessons are ready. Read them in order.

### Intro

1. [The cloud and AWS: why and how it works](01-cloud-and-aws.md)
2. [Regions, AZs, and global infrastructure](02-regions-and-availability.md)
3. [IAM: users, roles, policies](03-iam.md)

### Networking and compute

4. [VPC: a virtual network in AWS](04-vpc-networking.md)
5. [EC2 and compute models](05-ec2-compute.md)

### Data

6. [S3 and object storage](06-s3-storage.md)
7. [Databases: RDS, DynamoDB, ElastiCache](07-databases.md)

### Modern patterns

8. [Serverless: Lambda, API Gateway](08-serverless-lambda.md)
9. [Queues and events: SQS, SNS, EventBridge](09-messaging.md)

### Practice without a bill

10. [Local AWS emulation](10-local-emulation.md)

## Curriculum — practice (plan)

| # | Topic | Status |
|---|---|---|
| 11 | Lab: IAM and CLI (`aws sts get-caller-identity`) | planned |
| 12 | Lab: S3 bucket via Console / CLI | planned |
| … | Terraform + LocalStack | [`aws-terraform`](../aws-terraform/README.md) |

## What you should end up with after the theory

- You can explain the difference between Region / AZ / Edge.
- You understand why Lambda uses an IAM Role instead of an Access Key in code.
- You can draw the diagram: user → ALB → EC2 → RDS in a private subnet.
- You know when to use S3, when EBS, and when EFS.
- You understand how to learn with LocalStack/MiniStack instead of paid AWS.

## Related to the Kubernetes courses

| AWS | Kubernetes (our courses) |
|---|---|
| Region / AZ | Cluster / Node |
| VPC, Subnet | CNI, NetworkPolicy |
| IAM Role | ServiceAccount + IRSA |
| EC2 | Node (worker) |
| ECS / EKS | Managed Kubernetes |
| ALB | Ingress / Service LoadBalancer |
| S3 | Object storage (not a PV) |

## Next

- [`aws-terraform`](../aws-terraform/README.md) — IaC, `tflocal`, final S3+Lambda+DynamoDB project.
- [`aws-intermediate`](../aws-intermediate/README.md) — VPC, API Gateway, SQS, observability.
- [`aws-advanced`](../aws-advanced/README.md) — Organizations, EKS+IRSA, WAF, DR.
- Official AWS documentation: [https://docs.aws.amazon.com/](https://docs.aws.amazon.com/)
