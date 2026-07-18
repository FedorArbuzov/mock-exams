# 10. Лаба: Route 53 failover

## Задание 1. Два ALB (или mock targets)

Primary и secondary region — для учёбы достаточно **два target IP** и health check на HTTP.

## Задание 2. Hosted zone

```hcl
resource "aws_route53_zone" "main" {
  name = "course-advanced.local"  # или ваш домен
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

## Задание 3. Симуляция failover

Остановите primary target — через 1–3 мин health check fail — DNS на secondary.

## Задание 4. Private hosted zone (бонус)

`db.course.internal` → RDS private IP, associate VPC.

## Критерии успеха

- [ ] Health check в state
- [ ] Failover record настроен
- [ ] Понимаете TTL и propagation delay

Следующий урок: [11-waf-shield.md](11-waf-shield.md).
