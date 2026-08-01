# 16. Lab: Pod → S3 via IRSA

## Prerequisites

EKS cluster from [14-lab-eks.md](14-lab-eks.md) or a training account.

## Task 1. IAM policy S3 read

```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:ListBucket"],
  "Resource": [
    "arn:aws:s3:::YOUR_BUCKET",
    "arn:aws:s3:::YOUR_BUCKET/*"
  ]
}
```

## Task 2. IRSA role + SA

Via `eksctl`:

```bash
eksctl create iamserviceaccount \
  --cluster course-advanced \
  --namespace images \
  --name s3-reader \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \
  --approve
```

Or the Terraform module from lesson 15.

## Task 3. Pod test

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-test
  namespace: images
spec:
  serviceAccountName: s3-reader
  containers:
    - name: aws-cli
      image: amazon/aws-cli
      command: ["sleep", "3600"]
```

```bash
kubectl exec -n images s3-test -- aws s3 ls s3://YOUR_BUCKET/
```

## Task 4. Without IRSA (should fail)

A pod with the `default` ServiceAccount — `AccessDenied`.

## Success criteria

- [ ] IRSA pod reads S3
- [ ] default SA does not read
- [ ] Role trust contains an OIDC condition on the namespace/SA

Next lesson: [17-alb-ingress.md](17-alb-ingress.md).
