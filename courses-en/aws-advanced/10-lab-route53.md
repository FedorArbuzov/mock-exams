# 10. Lab: Route 53 failover

## Task 1. Two ALBs (or mock targets)

Primary and secondary region — for learning, **two target IPs** and an HTTP health check are enough.

## Task 2. Hosted zone

```hcl
resource "aws_route53_zone" "main" {
  name = "course-advanced.local"  # or your domain
}

resource "aws_route53_record" "api_primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api"
  type    = "A"
  set_identifier  = "primary"
  failover_routing_policy { type = "PRIMARY" }
  health_check_id = aws_route53_health_check.primary.id
  alias { ... }
}
```

## Task 3. Failover simulation

Stop the primary target — after 1–3 min the health check fails — DNS switches to secondary.

## Task 4. Private hosted zone (bonus)

`db.course.internal` → RDS private IP, associate the VPC.

## Success criteria

- [ ] Health check in state
- [ ] Failover record configured
- [ ] You understand TTL and propagation delay

Next lesson: [11-waf-shield.md](11-waf-shield.md).
