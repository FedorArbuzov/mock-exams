# 12. Lab: WAF on ALB

> Real AWS recommended.

## Task 1. Web ACL

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

## Task 2. Associate with the ALB

```hcl
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.app.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

## Task 3. Rate limit rule

Block an IP with > 100 requests / 5 min to `/images/*`.

## Task 4. Test

```bash
# SQLi probe — should be blocked by the managed rule
curl "https://ALB/images/1' OR '1'='1"
```

## Success criteria

- [ ] WAF associated with the ALB
- [ ] Malicious request blocked (403)
- [ ] CloudWatch WAF metric visible

Next lesson: [13-eks-architecture.md](13-eks-architecture.md).
