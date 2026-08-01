# 08. Lab: OIDC into AWS (optional)

## Real-world scenario

Security checklist: "Show me the `terraform plan` job log — it should not contain `AWS_SECRET_ACCESS_KEY` in the env dump." The OIDC lab is proof of zero static keys.

Compliance asks: "Where's the rotation policy for CI credentials?" — with OIDC the answer is: "TTL 1 hour, no rotation needed."

---

## Lab goal

Set up **OIDC federation** GitLab → AWS: `aws sts get-caller-identity` and `terraform plan` **without** keys in CI variables. Without an AWS account — `docs/oidc-aws.md` modeled on [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

**Time:** ~120 min (AWS) / ~60 min (docs).  
**Prerequisites:** [07-oidc-cloud.md](07-oidc-cloud.md).

---

## Choosing a track

| Track | Result |
|------|-----------|
| **AWS live** | Pipeline with `id_tokens`, STS in the log |
| **Docs only** | `docs/oidc-aws.md` complete |

---

## AWS track: Task 1. OIDC provider

```hcl
resource "aws_iam_openid_connect_provider" "gitlab" {
  url             = "https://gitlab.com"
  client_id_list  = ["https://gitlab.com"]
  thumbprint_list = ["<thumbprint>"]
}
```

Self-hosted: your own `url` and `client_id_list`.

IAM → Identity providers → Active.

---

## Task 2. Role `gitlab-ci-readonly`

Trust policy with **your** `project_path`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/gitlab.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "gitlab.com:aud": "https://gitlab.com"
      },
      "StringLike": {
        "gitlab.com:sub": "project_path:platform/infra-terraform:ref_type:branch:ref:main"
      }
    }
  }]
}
```

Attach `ReadOnlyAccess`. `AWS_ROLE_ARN` in a CI variable (not a secret).

---

## Task 3. Job `aws sts get-caller-identity`

```yaml
oidc-smoke:
  stage: validate
  image:
    name: amazon/aws-cli:2
    entrypoint: [""]
  id_tokens:
    AWS_ID_TOKEN:
      aud: https://gitlab.com
  variables:
    AWS_ROLE_ARN: "arn:aws:iam::ACCOUNT:role/gitlab-ci-readonly"
    AWS_DEFAULT_REGION: "eu-central-1"
  script:
    - |
      read -r AK SK ST < <(
        aws sts assume-role-with-web-identity \
          --role-arn "$AWS_ROLE_ARN" \
          --role-session-name "gitlab-${CI_PIPELINE_ID}" \
          --web-identity-token "$AWS_ID_TOKEN" \
          --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
          --output text
      )
      export AWS_ACCESS_KEY_ID="$AK" AWS_SECRET_ACCESS_KEY="$SK" AWS_SESSION_TOKEN="$ST"
    - aws sts get-caller-identity
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

**Success:** `assumed-role/gitlab-ci-readonly`. **No** `AWS_SECRET_ACCESS_KEY` in Variables.

---

## Task 4. Terraform plan on the MR

```yaml
.oidc-aws-auth:
  id_tokens:
    AWS_ID_TOKEN:
      aud: https://gitlab.com
  before_script:
    - |
      read -r AK SK ST < <(
        aws sts assume-role-with-web-identity \
          --role-arn "$AWS_ROLE_ARN" \
          --role-session-name "gitlab-${CI_PIPELINE_ID}" \
          --web-identity-token "$AWS_ID_TOKEN" \
          --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
          --output text
      )
      export AWS_ACCESS_KEY_ID="$AK" AWS_SECRET_ACCESS_KEY="$SK" AWS_SESSION_TOKEN="$ST"

terraform-plan:
  extends: .oidc-aws-auth
  image: hashicorp/terraform:1.6
  script:
    - terraform init -input=false
    - terraform plan -input=false -no-color
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

Apply — **not** in this lab.

---

## Task 5. Fork protection

```yaml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_SOURCE_PROJECT_ID != $CI_PROJECT_ID"
      when: never
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Document in `docs/oidc-aws.md` § Security.

---

## Documentation track: `docs/oidc-aws.md`

1. **The problem** of static keys
2. **Diagram** of the OIDC flow
3. **Steps** provider, role, job, plan
4. **Trust policy** with project_path
5. **Self-hosted** differences
6. **Fork MR** risks
7. **Link** [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md)

---

## Task 6. Checking Variables

Settings → CI/CD → Variables:

- **There should be no** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `AWS_ROLE_ARN` — a regular variable (an ARN is not a secret)

---

## Troubleshooting

| Error | Cause |
|--------|---------|
| `Not authorized` | Trust `sub` / `aud` mismatch |
| Invalid token | Wrong `aud` in `id_tokens` |
| `AccessDenied` plan | Role policy narrow |
| Works main, not MR | `sub` only `ref:main` |

Debug: decode the JWT payload **locally**, not in the CI log.

---

## Success criteria

- [ ] No AWS access keys in Variables
- [ ] `get-caller-identity` shows the assumed role
- [ ] `terraform plan` **or** `docs/oidc-aws.md`
- [ ] Trust policy restricts `project_path`
- [ ] Fork MR policy documented

---

## Relation to the final project

[15-final-project.md](15-final-project.md) — OIDC **or** the doc counts.

---

## Summary

OIDC is the industry standard for cloud CI. Without an AWS account, complete documentation is enough. Next lesson: [09-runners-kubernetes.md](09-runners-kubernetes.md).
