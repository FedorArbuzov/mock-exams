# 15. ECS Fargate behind ALB

## When not Lambda

| Criterion | Lambda | ECS Fargate |
|---|---|---|
| Long-running requests | 15 min limit | no hard limit |
| In-memory state | no | yes |
| Docker image | container image support | native |
| Cost at low traffic | often cheaper | minimum per task |

**Image Platform:** API on Fargate, worker on Lambda — a hybrid.

## ECS components

```text
Cluster
  └── Service (desired count, rolling deploy)
        └── Task Definition (CPU, memory, containers)
              └── Container (image, env, ports)
```

Fargate — **no** EC2 management; AWS places the task on AWS infrastructure.

## Terraform (outline)

```hcl
resource "aws_ecs_cluster" "app" {
  name = "${var.project}-cluster"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "api"
    image = "${aws_ecr_repository.api.repository_url}:latest"
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    environment = [{ name = "DYNAMODB_TABLE", value = aws_dynamodb_table.images.name }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "${var.project}-api"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "api"
    container_port   = 8080
  }
}
```

## ECR

The image is pushed to **Elastic Container Registry**; the task definition references a digest/tag.

## Comparison with Kubernetes

| ECS Fargate | EKS |
|---|---|
| AWS-native, simpler | Portable, CNCF |
| Less control plane ops | Full k8s API |
| ALB integration | Ingress + LB controller |

## Checklist

- execution role vs task role?
- Why `awsvpc` network mode?
- Why service in private subnet + ALB public?
- Fargate vs EC2 launch type?

Next lesson: [16-lab-ecs-fargate.md](16-lab-ecs-fargate.md).
