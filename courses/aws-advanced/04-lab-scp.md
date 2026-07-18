# 04. Лаба: SCP в Organizations

> Требует **management account** Organizations. См. [optional-aws-advanced.md](optional-aws-advanced.md).

## Задание 1. Создать SCP

В Console: Organizations → Policies → SCP → Create.

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

## Задание 2. Attach к OU Sandbox

Attach policy к OU, где лежит dev account — **не** к management account root без теста.

## Задание 3. Проверка

В member account попробуйте `RunInstances` с `t3.large` — `AccessDenied`.

`t3.micro` — успех.

## Задание 4. Terraform (опционально)

```hcl
resource "aws_organizations_policy" "deny_large" {
  name    = "deny-large-instances"
  type    = "SERVICE_CONTROL_POLICY"
  content = jsonencode({ ... })
}
```

## Критерии успеха

- [ ] Large instance denied
- [ ] Small instance allowed
- [ ] SCP attached к OU, не к root management без плана

Следующий урок: [05-landing-zone.md](05-landing-zone.md).
