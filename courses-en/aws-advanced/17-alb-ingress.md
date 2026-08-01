# 17. AWS Load Balancer Controller

## The task

Kubernetes `Ingress` → a real **AWS ALB** (not a manual NodePort).

```text
Ingress resource
    → AWS Load Balancer Controller (pod in kube-system)
    → creates ALB + Target Group (pods/IP)
    → traffic → Service → Pods
```

## Installation (outline)

```bash
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=course-advanced \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

The controller SA — **IRSA** with the IAM policy `AWSLoadBalancerControllerIAMPolicy`.

## Ingress example

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

An annotation, or associate the Web ACL ARN with the ALB after creation.

## vs API Gateway

| ALB Ingress | API Gateway |
|---|---|
| L7 HTTP to pods | Managed API, auth, throttling |
| Kubernetes-native | Serverless integration |

Image Platform: **internal** traffic — Ingress; **public B2B API** — API Gateway.

## Checklist

- Why does the controller need IRSA?
- `target-type: ip` vs `instance`?
- ingressClassName `alb` — why?
- Who creates the ALB — kubectl or the controller?

Next lesson: [18-lab-alb-ingress.md](18-lab-alb-ingress.md).
