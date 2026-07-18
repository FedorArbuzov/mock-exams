# 17. AWS Load Balancer Controller

## Задача

Kubernetes `Ingress` → реальный **AWS ALB** (не NodePort вручную).

```text
Ingress resource
    → AWS Load Balancer Controller (pod in kube-system)
    → создаёт ALB + Target Group (pods/IP)
    → traffic → Service → Pods
```

## Установка (outline)

```bash
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=course-advanced \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

Controller SA — **IRSA** с IAM policy `AWSLoadBalancerControllerIAMPolicy`.

## Ingress пример

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: image-api
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  ingressClassName: alb
  rules:
    - host: api.course.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: image-api
                port:
                  number: 80
```

## WAF integration

Annotation или associate Web ACL ARN с ALB после создания.

## vs API Gateway

| ALB Ingress | API Gateway |
|---|---|
| L7 HTTP to pods | Managed API, auth, throttling |
| Kubernetes-native | Serverless integration |

Image Platform: **внутренний** трафик — Ingress; **публичный B2B API** — API Gateway.

## Чек-лист

- Зачем IRSA controller'у?
- `target-type: ip` vs `instance`?
- ingressClassName `alb` — зачем?
- Кто создаёт ALB — kubectl или controller?

Следующий урок: [18-lab-alb-ingress.md](18-lab-alb-ingress.md).
