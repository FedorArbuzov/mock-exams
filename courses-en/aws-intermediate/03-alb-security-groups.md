# 03. Security Groups and Application Load Balancer

## Security Group (SG)

**Stateful** firewall at the ENI level (instance, ALB, Lambda ENI in a VPC).

- Only **Allow** rules.
- Reference another SG: “allow 8080 from `alb-sg`”.

```text
Internet → ALB (sg-alb: 443 in) → Target (sg-app: 8080 from sg-alb) → RDS (sg-db: 5432 from sg-app)
```

## ALB (Application Load Balancer)

| Component | Purpose |
|---|---|
| `aws_lb` | The load balancer itself (application) |
| `aws_lb_target_group` | Target group + health check |
| `aws_lb_listener` | Port 80/443 → forward to TG |
| `aws_lb_target_group_attachment` | EC2 instance / IP / Lambda (via AWSLambdaType) |

Typical health check: `GET /health` → HTTP 200.

## Listener and HTTPS

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

ACM certificate on real AWS; on LocalStack — HTTP :80 for labs.

## ALB in a public subnet

ALB nodes get an IP in **each AZ** from the public subnets. Targets can be in **private** subnets — the ALB reaches them inside the VPC.

## Comparison with Kubernetes

| AWS | k8s |
|---|---|
| ALB | Ingress Controller → AWS LB |
| Target Group | Service Endpoints |
| SG | NetworkPolicy (coarser) |

## Checklist

- Why not open RDS to `0.0.0.0/0`?
- Stateful — what does that mean for return traffic?
- Where does the ALB live — public or private subnet?
- Why a health check on the target group?

Next lesson: [04-lab-alb-security-groups.md](04-lab-alb-security-groups.md).
