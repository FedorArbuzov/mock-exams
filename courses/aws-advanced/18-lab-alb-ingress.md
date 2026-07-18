# 18. Лаба: Ingress для Image Platform

## Цель

Поднять HTTP API из [`image-platform`](../aws-intermediate/projects/image-platform/) **в EKS** за ALB вместо API Gateway.

## Задание 1. Deployment + Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-api
  namespace: images
spec:
  replicas: 2
  selector:
    matchLabels: { app: image-api }
  template:
    metadata:
      labels: { app: image-api }
    spec:
      serviceAccountName: s3-reader  # IRSA с расширенными правами
      containers:
        - name: api
          image: YOUR_ECR/image-api:latest
          ports: [{ containerPort: 8080 }]
---
apiVersion: v1
kind: Service
metadata:
  name: image-api
  namespace: images
spec:
  selector: { app: image-api }
  ports:
    - port: 80
      targetPort: 8080
```

## Задание 2. Установить LB Controller

Helm + IRSA (см. [17-alb-ingress.md](17-alb-ingress.md)).

## Задание 3. Ingress

Host = DNS ALB или Route53 record. Проверка:

```bash
curl http://ALB_DNS/health
curl http://ALB_DNS/images/UUID
```

## Задание 4. Сравнение

| | API Gateway (intermediate) | ALB Ingress (advanced) |
|---|---|---|
| Auth | built-in | ваш middleware / WAF |
| Cost model | per request | ALB hourly + LCU |
| Coupling | AWS | Kubernetes |

## Критерии успеха

- [ ] ALB создан controller'ом
- [ ] 2 pod в target group healthy
- [ ] GET /images/{id} работает

Следующий урок: [19-kms-advanced.md](19-kms-advanced.md).
