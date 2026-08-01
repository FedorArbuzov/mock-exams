# 24. Lab: S3 Cross-Region Replication

> Real AWS (two regions). See [optional-aws-advanced.md](optional-aws-advanced.md).

## Task 1. Source bucket (eu-central-1)

Versioning enabled, SSE-KMS.

## Task 2. Destination bucket (eu-west-1)

```hcl
resource "aws_s3_bucket_replication_configuration" "thumbs" {
  bucket = aws_s3_bucket.source.id
  role   = aws_iam_role.replication.arn
  rule {
    id     = "thumbs-crr"
    status = "Enabled"
    filter { prefix = "thumbs/" }
    destination {
      bucket        = aws_s3_bucket.destination.arn
      storage_class = "STANDARD"
    }
  }
}
```

IAM role: `s3:GetReplicationConfiguration`, `s3:ObjectReplication`, etc.

## Task 3. Test

Upload `thumbs/test.jpg` to the source — after a few minutes the object appears in the destination region.

```bash
aws s3 ls s3://DEST_BUCKET/thumbs/ --region eu-west-1
```

## Task 4. Failover drill (tabletop)

Describe the steps: primary region unavailable → DNS failover → read from the CRR bucket.

## Success criteria

- [ ] Replication status REPLICA
- [ ] Object in destination
- [ ] Runbook of 10 steps

Next lesson: [25-cost-optimization.md](25-cost-optimization.md).
