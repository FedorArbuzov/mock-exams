# 19. KMS: rotation, grants, multi-Region

## CMK lifecycle

| | AWS managed key | Customer managed CMK |
|---|---|---|
| Creation | automatic | you |
| Rotation | AWS | optional automatic yearly |
| Policy | AWS | your JSON |

```hcl
resource "aws_kms_key" "app" {
  enable_key_rotation = true
  description         = "App encryption"
}
```

## Key policy

Who can `kms:Encrypt`, `kms:Decrypt`, `kms:GenerateDataKey`:

```json
{
  "Sid": "Allow use via S3",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::123456789012:role/lambda-exec" },
  "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
  "Resource": "*"
}
```

## Multi-Region keys (MRK)

One logical key in several regions — DR without re-encrypting the entire archive (a complex topic, know it at the "it exists" level).

## Secrets Manager + KMS

A secret is encrypted with a CMK. **Rotation** — an AWS Lambda re-creates the RDS password automatically.

## CloudTrail

All `kms:Decrypt` calls are logged — audit of who read the data.

## Checklist

- enable_key_rotation — what does it rotate?
- Key policy vs IAM policy?
- Why a separate CMK per environment?
- Secrets rotation vs KMS rotation?

Next lesson: [20-lab-kms-secrets.md](20-lab-kms-secrets.md).
