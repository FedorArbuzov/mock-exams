# 18. Lab: Ingress for Image Platform

## Goal

Bring up the HTTP API from [`image-platform`](../aws-intermediate/projects/image-platform/) **in EKS** behind an ALB instead of API Gateway.

## Task 1. Deployment + Service

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
      serviceAccountName: s3-reader  # IRSA with extended permissions
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

## Task 2. Install the LB Controller

Helm + IRSA (see [17-alb-ingress.md](17-alb-ingress.md)).

## Task 3. Ingress

Host = ALB DNS or a Route53 record. Verification:

```bash
curl http://ALB_DNS/health
curl http://ALB_DNS/images/UUID
```

## Task 4. Comparison

| | API Gateway (intermediate) | ALB Ingress (advanced) |
|---|---|---|
| Auth | built-in | your middleware / WAF |
| Cost model | per request | ALB hourly + LCU |
| Coupling | AWS | Kubernetes |

## Success criteria

- [ ] ALB created by the controller
- [ ] 2 pods healthy in the target group
- [ ] GET /images/{id} works

Next lesson: [19-kms-advanced.md](19-kms-advanced.md).
