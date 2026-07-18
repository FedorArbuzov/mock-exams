# 14. Лаба: минимальный EKS

## Трек A — EKS (real AWS)

```bash
eksctl create cluster \
  --name course-advanced \
  --region eu-central-1 \
  --nodes 2 \
  --node-type t3.medium \
  --managed

kubectl get nodes
```

Удаление:

```bash
eksctl delete cluster --name course-advanced
```

## Трек B — mockctl (без EKS bill)

Для сравнения архитектуры:

```bash
mockctl up
kubectl get nodes
```

Заполните таблицу:

| Вопрос | minikube | EKS |
|---|---|---|
| Где API server? | | |
| Где etcd? | | |
| Как добавить node? | | |
| Стоимость | | |

## Задание 1. Add-ons

На EKS:

```bash
aws eks describe-addon-versions --kubernetes-version 1.29
eksctl create addon --name aws-ebs-csi-driver --cluster course-advanced
```

## Задание 2. Deploy sample

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=ClusterIP
```

## Критерии успеха

- [ ] `kubectl get nodes` Ready
- [ ] Таблица сравнения minikube vs EKS заполнена
- [ ] Кластер удалён (трек A)

Следующий урок: [15-irsa.md](15-irsa.md).
