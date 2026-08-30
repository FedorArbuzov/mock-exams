# File writer (same stack as the labs)

Lambda **invoke** → object under `files/`. Same story as **`~/aws-labs`** after [lab 12](../../12-lab-s3-lambda-pipeline.md).

## Quick start

```bash
cd courses-en/aws-terraform/projects/image-pipeline
cp terraform.tfvars.example terraform.tfvars
# edit bucket_name

terraform init
terraform apply
```

```bash
BUCKET=$(terraform output -raw bucket_name)
LAMBDA=$(terraform output -raw lambda_function_name)

aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name "$LAMBDA" \
  --cli-binary-format raw-in-base64-out \
  --payload '{"filename":"test.txt"}' \
  response.json

aws --endpoint-url=http://localhost:4566 s3 ls "s3://$BUCKET/files/"
```

## Cleanup

```bash
terraform destroy
```
