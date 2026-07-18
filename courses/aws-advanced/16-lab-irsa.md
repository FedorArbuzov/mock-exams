# 16. Лаба: Pod → S3 через IRSA

## Предварительно

EKS кластер из [14-lab-eks.md](14-lab-eks.md) или учебный account.

## Задание 1. IAM policy S3 read

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

## Задание 2. IRSA role + SA

Через `eksctl`:

```bash
eksctl create iamserviceaccount \
  --cluster course-advanced \
  --namespace images \
  --name s3-reader \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \
  --approve
```

Или Terraform module из урока 15.

## Задание 3. Pod test

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

## Задание 4. Без IRSA (должно fail)

Pod с `default` ServiceAccount — `AccessDenied`.

## Критерии успеха

- [ ] IRSA pod читает S3
- [ ] default SA не читает
- [ ] Role trust содержит OIDC condition на namespace/SA

Следующий урок: [17-alb-ingress.md](17-alb-ingress.md).
