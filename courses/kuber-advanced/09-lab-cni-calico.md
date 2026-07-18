# 09. Лаба: calico и egress NetworkPolicy

> Нужен перезапуск minikube с calico:  
> `minikube delete -p mock-exams && minikube start -p mock-exams --driver=docker --cni=calico`  
> `mockctl kubeconfig`

Содержание совпадает с [intermediate/12-lab-networkpolicy.md](../kuber-intermediate/12-lab-networkpolicy.md), но здесь акцент на **egress** и проверку calico:

```bash
kubectl get pods -n kube-system -l k8s-app=calico-node
```

Повторите лабу 12 из intermediate + добавьте egress-политику, разрешающую только DNS и backend:80.

## Дополнительно: calicoctl (опционально)

```bash
# Если установлен calicoctl:
calicoctl get ippool -o wide
```

## Уборка

По завершении — вернуть обычный CNI или оставить calico для advanced-лаб.
