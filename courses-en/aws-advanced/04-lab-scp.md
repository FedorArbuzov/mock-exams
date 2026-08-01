# 04. Lab: SCP in Organizations

> Requires an Organizations **management account**. See [optional-aws-advanced.md](optional-aws-advanced.md).

## Task 1. Create an SCP

In the Console: Organizations → Policies → SCP → Create.

**Deny large instances:**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": "ec2:RunInstances",
    "Resource": "arn:aws:ec2:*:*:instance/*",
    "Condition": {
      "StringNotLike": {
        "ec2:InstanceType": ["t3.micro", "t3.small", "t3.medium"]
      }
    }
  }]
}
```

## Task 2. Attach to the Sandbox OU

Attach the policy to the OU that holds the dev account — **not** to the management account root without testing.

## Task 3. Verification

In the member account, try `RunInstances` with `t3.large` — `AccessDenied`.

`t3.micro` — success.

## Task 4. Terraform (optional)

```hcl
resource "aws_organizations_policy" "deny_large" {
  name    = "deny-large-instances"
  type    = "SERVICE_CONTROL_POLICY"
  content = jsonencode({ ... })
}
```

## Success criteria

- [ ] Large instance denied
- [ ] Small instance allowed
- [ ] SCP attached to an OU, not to the root management account without a plan

Next lesson: [05-landing-zone.md](05-landing-zone.md).
