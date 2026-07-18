# 15. IRSA: IAM Roles for Service Accounts

## Проблема

Pod нужен доступ к S3. Антипаттерны:

- Access Key в Secret в etcd
- Node IAM role с `s3:*` — все pods на ноде наследуют риск

## IRSA

```text
Pod → ServiceAccount (annotation role ARN)
    → STS AssumeRoleWithWebIdentity (OIDC token)
    → Temporary AWS credentials
    → S3 API
```

## Настройка (концепт)

1. EKS cluster имеет **OIDC issuer URL**.
2. IAM OIDC provider trusts issuer.
3. IAM Role trust policy: `sts:AssumeRoleWithWebIdentity` для `system:serviceaccount:ns:sa-name`.
4. ServiceAccount:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: image-worker
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/eks-image-worker
```

5. Pod `serviceAccountName: image-worker`.

## Terraform

```hcl
module "irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  role_name = "eks-image-worker"
  oidc_providers = {
    main = {
      provider_arn               = aws_iam_openid_connect_provider.eks.arn
      namespace_service_accounts = ["images:worker"]
    }
  }
  role_policy_arns = [aws_iam_policy.s3_read.arn]
}
```

## Сравнение с k8s RBAC

| IRSA | Kubernetes RBAC |
|---|---|
| AWS API (S3, DynamoDB) | Kubernetes API (pods, secrets) |
| IAM policy | Role/RoleBinding |

Нужны **оба** для secure platform.

## Чек-лист

- Зачем annotation на ServiceAccount?
- Почему не node role для всего?
- OIDC issuer — кто создаёт?
- Trust policy Principal для IRSA?

Следующий урок: [16-lab-irsa.md](16-lab-irsa.md).
