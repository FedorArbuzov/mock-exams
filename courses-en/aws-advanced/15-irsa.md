# 15. IRSA: IAM Roles for Service Accounts

## The problem

A pod needs access to S3. Antipatterns:

- Access Key in a Secret in etcd
- Node IAM role with `s3:*` — all pods on the node inherit the risk

## IRSA

```text
Pod → ServiceAccount (annotation role ARN)
    → STS AssumeRoleWithWebIdentity (OIDC token)
    → Temporary AWS credentials
    → S3 API
```

## Setup (concept)

1. The EKS cluster has an **OIDC issuer URL**.
2. The IAM OIDC provider trusts the issuer.
3. IAM Role trust policy: `sts:AssumeRoleWithWebIdentity` for `system:serviceaccount:ns:sa-name`.
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

## Comparison with k8s RBAC

| IRSA | Kubernetes RBAC |
|---|---|
| AWS API (S3, DynamoDB) | Kubernetes API (pods, secrets) |
| IAM policy | Role/RoleBinding |

You need **both** for a secure platform.

## Checklist

- Why an annotation on the ServiceAccount?
- Why not a node role for everything?
- OIDC issuer — who creates it?
- Trust policy Principal for IRSA?

Next lesson: [16-lab-irsa.md](16-lab-irsa.md).
