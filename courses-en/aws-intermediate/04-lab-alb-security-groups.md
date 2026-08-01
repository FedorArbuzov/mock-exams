# 04. Lab: ALB + Security Groups

Minimal setup: ALB → target (on LocalStack you can attach a **dummy IP** target or skip the attachment and only verify LB creation).

## Task 1. security_groups.tf

```hcl
resource "aws_security_group" "alb" {
  name   = "course-alb-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name   = "course-app-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## Task 2. alb.tf

```hcl
resource "aws_lb" "app" {
  name               = "course-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "app" {
  name     = "course-app-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

## Task 3. output DNS

```hcl
output "alb_dns_name" {
  value = aws_lb.app.dns_name
}
```

```bash
tflocal apply
tflocal output alb_dns_name
```

On real AWS: `curl http://$(terraform output -raw alb_dns_name)/health`.

## Success criteria

- [ ] ALB in state Active (or LocalStack equivalent)
- [ ] SG app does not accept 8080 from 0.0.0.0/0, only from alb-sg
- [ ] Listener on port 80

Next lesson: [05-api-gateway.md](05-api-gateway.md).
