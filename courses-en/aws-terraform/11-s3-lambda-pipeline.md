# 11. Lambda writes a file

The bucket, role, and function are already in **`~/aws-labs`**. This lesson is the **win**: you invoke Lambda → it `put_object` into the hello bucket. You `s3 ls` and see a file you did not upload with Terraform.

```text
You (CLI invoke)
  │  payload { "filename": "hello.txt" }
  ▼
Lambda
  └── PUT files/hello.txt  →  S3 (aws_s3_bucket.hello)
```

## What to add

- env on the function: `BUCKET_NAME` = `aws_s3_bucket.hello.id`
- a handler that calls `s3.put_object` (lab 08 already granted `PutObject` on `bucket-arn/*`)

Invoking twice with the same filename overwrites the object. Fine for the lab.

If the function cannot reach S3, LocalStack usually injects `AWS_ENDPOINT_URL`; on Docker Desktop you may need `http://host.docker.internal:4566`.

DynamoDB, S3 events, and APIs are [`aws-intermediate`](../aws-intermediate/README.md).

## Checklist

- Why `PutObject` on `bucket/*`, not only the bucket ARN?
- Who creates the object — Terraform or the function?

Next lesson: [12-lab-s3-lambda-pipeline.md](12-lab-s3-lambda-pipeline.md).
