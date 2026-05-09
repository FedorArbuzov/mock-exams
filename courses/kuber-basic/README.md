# Kubernetes Basic

Базовый курс по Kubernetes. Подразумевается локальный кластер **minikube** (профиль `mock-exams`) и установленный `kubectl`.

## Программа

### Введение

1. [Архитектура кластера Kubernetes](01-architecture.md)
2. [Docker vs containerd](02-docker-vs-containerd.md)
3. [Элементы Kubernetes](03-elements.md)
4. [kubectl: основы](04-kubectl-basics.md)

### Pods

5. [Поды (Pods)](05-pods.md)
6. [Создание подов с YAML](06-pods-yaml.md)
7. [Лаба: Поды](07-lab-pods.md)

### Контроллеры

8. [ReplicaSet](08-replicaset.md)
9. [Лаба: ReplicaSet](09-lab-replicaset.md)
10. [Deployment](10-deployment.md)
11. [Лаба: Deployment](11-lab-deployment.md)

### Конфиги и «настоящее» приложение

12. [ConfigMap и Secret](12-config-and-secret.md)
13. [Лаба: ConfigMap и Secret](13-lab-config-and-secret.md)
14. [Probes и Resources](14-probes-and-resources.md)
15. [Лаба: Probes и Resources](15-lab-probes-and-resources.md)

### Сеть и организация

16. [Service](16-service.md)
17. [Лаба: Service](17-lab-service.md)
18. [Namespace](18-namespace.md)
19. [Лаба: Namespace](19-lab-namespace.md)
20. [Ingress](20-ingress.md)
21. [Лаба: Ingress](21-lab-ingress.md)

### Эксплуатация

22. [Troubleshooting](22-troubleshooting.md)
23. [Лаба: Troubleshooting](23-lab-troubleshooting.md)

## Что нужно для лаб

- Запущенный кластер: `scripts\minikube-up.cmd` (Windows) или `./scripts/minikube-up.sh` (macOS).
- `kubectl` в `PATH` или вызов с `--kubeconfig .\output\kubeconfig.yaml`.
- Проверка: `kubectl get nodes` — узел в `Ready`.
- Для урока 14–15 (Probes и Resources): `minikube -p mock-exams addons enable metrics-server`.
- Для урока 20–21 (Ingress): `minikube -p mock-exams addons enable ingress`.
