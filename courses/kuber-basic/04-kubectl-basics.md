# 4. kubectl: основы

`kubectl` — основной инструмент общения с кластером. Под капотом он просто шлёт HTTP-запросы в **kube-apiserver** и форматирует ответ.

## Как kubectl находит кластер

Через файл **kubeconfig**. По умолчанию ищется в `~/.kube/config`, но можно указать явно:

```bash
kubectl --kubeconfig ./output/kubeconfig.yaml get nodes
```

или через переменную:

```bash
# bash / zsh
export KUBECONFIG=./output/kubeconfig.yaml

# PowerShell
$env:KUBECONFIG = ".\output\kubeconfig.yaml"
```

В файле kubeconfig три сущности:

- **clusters** — адрес API + сертификаты.
- **users** — учётка (токен/сертификат клиента).
- **contexts** — связка «кластер + user + namespace по умолчанию».

```bash
kubectl config view
kubectl config get-contexts
kubectl config use-context mock-exams
kubectl config set-context --current --namespace=dev
```

## Базовый набор команд

### Чтение

```bash
kubectl get pods                       # список в текущем namespace
kubectl get pods -A                    # из всех namespace
kubectl get pods -n kube-system        # из конкретного namespace
kubectl get pods -o wide               # + IP и нода
kubectl get pods -l app=web            # фильтр по label
kubectl get pods --show-labels         # видеть метки
kubectl get pods -w                    # watch (наблюдать в реальном времени)
```

### Подробности

```bash
kubectl describe pod <name>            # человекочитаемая сводка + Events
kubectl get pod <name> -o yaml         # «живой» YAML объекта
kubectl get pod <name> -o json         # JSON
```

### Создание / изменение / удаление

```bash
kubectl apply -f file.yaml             # создать или обновить из YAML
kubectl apply -f .                     # все YAML в каталоге
kubectl delete -f file.yaml            # удалить по тому же манифесту
kubectl delete pod <name>              # удалить точечно
kubectl edit deploy/web                # открыть в редакторе и применить
```

`apply` — **декларативный** способ: «сделай так, как написано в файле». На практике используется в 99% случаев.

### Логи и exec

```bash
kubectl logs <pod>                     # один контейнер
kubectl logs <pod> -c <container>      # многоконтейнерный pod
kubectl logs <pod> --previous          # логи прошлого крэша контейнера
kubectl logs deploy/web                # из любого пода Deployment
kubectl logs -l app=web --tail=100 -f  # follow по label

kubectl exec -it <pod> -- sh           # войти в контейнер
kubectl exec <pod> -- env              # выполнить команду без TTY
```

### Доступ снаружи (без Service / Ingress)

```bash
kubectl port-forward pod/<name> 8080:80
kubectl port-forward svc/web 8080:80
```

Работает, пока команда запущена. Удобно отлаживать.

### Запуск временного pod

```bash
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
```

`--rm` удалит pod после выхода, `--restart=Never` сделает его «голым» Pod, а не Deployment.

## Полезные приёмы

### Узнать поля объекта

```bash
kubectl explain pod
kubectl explain pod.spec
kubectl explain pod.spec.containers --recursive
```

### Сгенерировать YAML-шаблон

```bash
kubectl run nginx --image=nginx:1.27 --dry-run=client -o yaml > pod.yaml
kubectl create deploy web --image=nginx:1.27 --dry-run=client -o yaml > deploy.yaml
```

`--dry-run=client` означает «ничего не отправлять в кластер, просто покажи, что бы ты сделал».

### Точечный вывод (jsonpath)

```bash
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
```

### Сокращения имён

| Полное | Короткое |
|--------|-----------|
| pods | po |
| services | svc |
| deployments | deploy |
| replicasets | rs |
| namespaces | ns |
| nodes | no |
| configmaps | cm |
| persistentvolumeclaims | pvc |

```bash
kubectl get po,svc,deploy
```

### Все типы объектов

```bash
kubectl api-resources                  # что вообще есть в этом кластере
kubectl api-resources --namespaced=true
```

## Полезные флаги

- `-n <ns>` / `--namespace=<ns>` — namespace.
- `-A` / `--all-namespaces` — из всех namespaces.
- `-l <label>` — фильтр по labels (`app=web`, `app!=web`, `tier in (front,back)`).
- `-o yaml | json | wide | jsonpath=...` — формат вывода.
- `--dry-run=client` — без применения, для проверки.
- `-f <file|dir|->` — источник манифеста (`-` — stdin).

## Советы

- Большая часть «магии» — это `describe` + `events`. Если что-то не работает, начинайте оттуда.
- В `~/.bashrc` / `$PROFILE` стоит добавить алиас `alias k=kubectl` (на Windows в PowerShell: `Set-Alias k kubectl`).
- `kubectl get` без аргументов в нужном неймспейсе быстро показывает картину; если непонятно — `kubectl get all -n <ns>`.
