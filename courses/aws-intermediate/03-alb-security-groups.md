# 03. Security Groups и Application Load Balancer

## Security Group (SG)

**Stateful** firewall на уровне ENI (инстанс, ALB, Lambda ENI в VPC).

- Только **Allow** rules.
- Ссылка на другой SG: «разрешить 8080 от `alb-sg`».

```text
Internet → ALB (sg-alb: 443 in) → Target (sg-app: 8080 from sg-alb) → RDS (sg-db: 5432 from sg-app)
```

## ALB (Application Load Balancer)

| Компонент | Назначение |
|---|---|
| `aws_lb` | Сам балансировщик (application) |
| `aws_lb_target_group` | Группа targets + health check |
| `aws_lb_listener` | Порт 80/443 → forward to TG |
| `aws_lb_target_group_attachment` | EC2 instance / IP / Lambda (через AWSLambdaType) |

Health check типично: `GET /health` → HTTP 200.

## Listener и HTTPS

```hcl
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.app.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

ACM-сертификат в real AWS; в LocalStack — HTTP :80 для лаб.

## ALB в public subnet

ALB nodes получают IP в **каждой AZ** из public subnets. Targets могут быть в **private** subnets — ALB достучится внутри VPC.

## Сравнение с Kubernetes

| AWS | k8s |
|---|---|
| ALB | Ingress Controller → AWS LB |
| Target Group | Service Endpoints |
| SG | NetworkPolicy (грубее) |

## Чек-лист

- Почему RDS не открывают на `0.0.0.0/0`?
- Stateful — что это значит для ответного трафика?
- Где живёт ALB — public или private subnet?
- Зачем health check на target group?

Следующий урок: [04-lab-alb-security-groups.md](04-lab-alb-security-groups.md).
