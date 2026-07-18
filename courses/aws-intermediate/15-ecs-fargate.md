# 15. ECS Fargate за ALB

## Когда не Lambda

| Критерий | Lambda | ECS Fargate |
|---|---|---|
| Длительные запросы | лимит 15 min | нет жёсткого лимита |
| Состояние в памяти | нет | да |
| Docker image | container image support | native |
| Стоимость при низком трафике | часто дешевле | минимум за task |

**Image Platform:** API на Fargate, worker на Lambda — гибрид.

## Компоненты ECS

```text
Cluster
  └── Service (desired count, rolling deploy)
        └── Task Definition (CPU, memory, containers)
              └── Container (image, env, ports)
```

Fargate — **нет** управления EC2; AWS ставит task на инфраструктуру AWS.

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

Образ пушится в **Elastic Container Registry**; task definition ссылается на digest/tag.

## Сравнение с Kubernetes

| ECS Fargate | EKS |
|---|---|
| AWS-native, проще | Portable, CNCF |
| Меньше control plane ops | Полный k8s API |
| ALB integration | Ingress + LB controller |

## Чек-лист

- execution role vs task role?
- Зачем `awsvpc` network mode?
- Почему service в private subnet + ALB public?
- Fargate vs EC2 launch type?

Следующий урок: [16-lab-ecs-fargate.md](16-lab-ecs-fargate.md).
