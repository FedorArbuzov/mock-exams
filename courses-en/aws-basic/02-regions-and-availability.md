# 02. Regions, AZs, and global infrastructure

## Region

A **Region** is a named geographic area of AWS (for example, `eu-central-1` in Frankfurt or `us-east-1` in Northern Virginia).

- Most resources are **tied to a region**: EC2, VPC, RDS, Lambda.
- Data **physically** stays in the region (important for GDPR and compliance).
- Prices and service availability **differ** across regions.

Choosing a region is one of the first architectural decisions:

| Criterion | Example |
|---|---|
| Proximity to users | EU for a European audience |
| Price | `us-east-1` is often cheaper |
| Service availability | New features land in `us-east-1` first |
| Legal requirements | Data must not leave the EU |

## Availability Zone (AZ)

Within a region there are several **isolated** data centers called **Availability Zones** (`eu-central-1a`, `eu-central-1b`, …).

- AZs within one region are connected by a **low-latency** network.
- AZs are **physically isolated** (separate buildings, power) — the failure of one AZ should not bring down another.
- High Availability = spreading across **at least 2 AZs**.

```text
Region eu-central-1
├── eu-central-1a   ← AZ
├── eu-central-1b   ← AZ
└── eu-central-1c   ← AZ
```

**Rule:** production RDS / EKS / EC2 Auto Scaling Groups should be **multi-AZ**.

## Local Zone and Wavelength (briefly)

- **Local Zones** — "nearby" mini-regions close to major cities (low latency).
- **Wavelength** — compute at the edge of 5G carriers.

For a basic course it's enough to know they exist; they're rarely needed at the start.

## Global vs regional services

| Type | Examples | Where it "lives" |
|---|---|---|
| **Global** | IAM, Route 53 (partly), CloudFront | Everywhere / edge |
| **Regional** | EC2, S3, Lambda, VPC | A specific region |
| **S3 — special** | The bucket name is globally unique; data lives in the chosen region | |

**IAM** is global: users and roles are the same across the whole account. An **S3 bucket** named `my-app-data` uses one name across all of AWS.

## Edge Locations and CloudFront

An **Edge Location** is a CDN point of presence (hundreds worldwide). **CloudFront** caches static content (S3, a custom origin) closer to the user.

```text
User (Tokyo)
    → Edge Location (Tokyo)  ← cache hit, fast
    → Origin (S3 eu-central-1)  ← cache miss
```

## Partitions and endpoints

AWS is divided into **partitions**:

| Partition | Description |
|---|---|
| `aws` | The public commercial cloud |
| `aws-cn` | China (separate accounts) |
| `aws-us-gov` | US government sector |

The API endpoint for `eu-central-1` is `ec2.eu-central-1.amazonaws.com`. LocalStack substitutes it with `localhost:4566`.

## Practical patterns

### Single-AZ (dev only)

```text
VPC → 1 public subnet → 1 EC2
```

Cheap, unreliable.

### Multi-AZ (production)

```text
VPC → public subnets (2 AZ) + private subnets (2 AZ)
      ALB (multi-AZ) → EC2 ASG (2 AZ) → RDS Multi-AZ
```

### Active-Passive across regions

Disaster Recovery: a replica in another region (expensive, complex). For this course, just know it exists.

## Checklist

- How does a Region differ from an AZ?
- Why are production databases made Multi-AZ?
- Is IAM global or regional?
- Is an S3 bucket name globally unique?
- Why use CloudFront if S3 is already in the region?

Next lesson: [03-iam.md](03-iam.md) — there's no getting around IAM in AWS.
