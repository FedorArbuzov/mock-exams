# 12. Lab: S3 bucket and object

## Task 1. s3.tf

Implement a bucket with encryption and a public access block from [11-s3-terraform.md](11-s3-terraform.md).

`bucket_name` via a variable.

## Task 2. Upload a test object via Terraform

`upload.tf`:

```hcl
resource "aws_s3_object" "sample" {
  bucket = aws_s3_bucket.images.id
  key    = "uploads/sample.jpg"
  source = "${path.module}/fixtures/sample.jpg"
}
```

Create `fixtures/sample.jpg` — any small JPEG (or PNG, then change the suffix in the notification later).

## Task 3. apply

```bash
tflocal apply
aws --endpoint-url=http://localhost:4566 s3 ls s3://YOUR_BUCKET/uploads/
```

## Task 4. Versioning

Enable `aws_s3_bucket_versioning`. Upload an object with the same key again — check the versions (support in LocalStack may be simplified).

## Success criteria

- [ ] Bucket with encryption and block public
- [ ] The object `uploads/sample.jpg` is accessible via the CLI
- [ ] `terraform destroy` clears the bucket (empty the bucket before destroy)

Next lesson: [13-lambda-terraform.md](13-lambda-terraform.md).
