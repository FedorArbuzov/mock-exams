# 12. Лаба: WAF на ALB

> Real AWS рекомендуется.

## Задание 1. Web ACL

```hcl
resource "aws_wafv2_web_acl" "main" {
  name  = "course-advanced-waf"
  scope = "REGIONAL"  # ALB

  default_action { allow {} }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "courseWaf"
    sampled_requests_enabled   = true
  }
}
```

## Задание 2. Associate с ALB

```hcl
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.app.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

## Задание 3. Rate limit rule

Block IP с > 100 requests / 5 min к `/images/*`.

## Задание 4. Тест

```bash
# SQLi probe — должен блокироваться managed rule
curl "https://ALB/images/1' OR '1'='1"
```

## Критерии успеха

- [ ] WAF associated с ALB
- [ ] Malicious request blocked (403)
- [ ] CloudWatch metric WAF виден

Следующий урок: [13-eks-architecture.md](13-eks-architecture.md).
