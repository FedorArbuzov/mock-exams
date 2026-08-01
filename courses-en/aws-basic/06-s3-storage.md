# 06. S3: object storage

## Data model

**S3 (Simple Storage Service)** stores **objects** (files) in a **bucket** — not a file system with folders, but a flat key-value store with prefixes in the keys.

```text
s3://my-course-bucket/
    uploads/2024/photo.jpg   ← key = "uploads/2024/photo.jpg"
    data/report.csv
```

- The bucket name is **globally unique** across all of AWS.
- A bucket is tied to a **region** at creation.
- Object size: from 0 bytes up to **5 TB** (multipart upload for large ones).

## Core API operations

| Operation | API | Terraform |
|---|---|---|
| Create a bucket | `CreateBucket` | `aws_s3_bucket` |
| Upload a file | `PutObject` | `aws_s3_object` |
| Download | `GetObject` | — |
| List | `ListObjectsV2` | `aws s3 ls` |
| Delete | `DeleteObject` | — |

## Storage classes

| Class | When |
|---|---|
| **Standard** | Frequent access |
| **Standard-IA** | Infrequent access, cheaper storage |
| **Glacier** | Archive, restore in minutes–hours |
| **Intelligent-Tiering** | Auto-transition based on access pattern |

For the course and dev, **Standard** is enough.

## Versioning and lifecycle

- **Versioning** — every overwrite creates a new object version (protection against accidental delete).
- **Lifecycle rules** — transition to Glacier, delete old versions after N days.

## Security

| Mechanism | Description |
|---|---|
| **Block Public Access** | Account/bucket level — blocks public access (turn it on by default) |
| **Bucket policy** | JSON on the bucket (cross-account, CloudFront OAC) |
| **ACL** | Legacy, avoid |
| **Encryption** | SSE-S3, SSE-KMS, SSE-C |
| **IAM policy** | Who can `s3:GetObject` on which prefix |

A typical leak: `Principal: "*"` in a bucket policy + Block Public Access disabled.

## Presigned URL

A temporary link for `GetObject` / `PutObject` without handing IAM keys to the client:

```text
Backend (IAM role) → generates a presigned URL (15 min)
    → Browser uploads the file directly to S3
```

This is the pattern for uploading images in the final project of the Terraform course.

## S3 and the web

- Static site: `index.html` + website hosting (legacy; more commonly **CloudFront + S3**).
- **CORS** — needed if the browser calls an API and S3 from a different origin.

## Event notifications

S3 can send events on `s3:ObjectCreated:*`:

```text
S3 (new file uploads/*.jpg)
    → Event notification → SQS / Lambda / EventBridge
```

The basis of the "uploaded an image → Lambda resizes it" pipeline.

## Local emulation

LocalStack / MiniStack support S3 at `http://localhost:4566`. In Terraform — `endpoints { s3 = "..." }` or `tflocal`.

Emulator limitations: not all edge cases (replication, Object Lock) behave as in production.

## Checklist

- Why is a bucket name globally unique?
- How does a bucket policy differ from an IAM policy?
- Why Block Public Access?
- How does S3 trigger Lambda?
- What is a presigned URL?

Next lesson: [07-databases.md](07-databases.md).
