# 22. Lab: Config rule and CloudTrail

## Task 1. Organization / account trail

```hcl
resource "aws_cloudtrail" "org" {
  name                          = "course-org-trail"
  s3_bucket_name                = aws_s3_bucket.trail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
}
```

## Task 2. Config rule

```hcl
resource "aws_config_config_rule" "s3_public" {
  name = "s3-bucket-public-access-prohibited"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }
}
```

Start the recorder, create a public bucket (in the sandbox) — you'll get **NON_COMPLIANT**.

## Task 3. GuardDuty

```bash
aws guardduty create-detector --enable
aws guardduty list-findings --detector-id DETECTOR_ID
```

Simulating a finding is hard — it's enough to enable the detector and describe the response in a runbook.

## Task 4. EventBridge → SNS

A rule on `GuardDuty Finding` → SNS topic for the team.

## Task 5. Athena query (bonus)

CloudTrail logs in S3 → Athena table → `SELECT * WHERE eventName = 'AssumeRole'`.

## Success criteria

- [ ] Trail writes to S3
- [ ] Config rule shows compliance status
- [ ] GuardDuty detector enabled
- [ ] Runbook: a 1-page "what to do on a HIGH finding"

Next lesson: [23-backup-dr.md](23-backup-dr.md).
