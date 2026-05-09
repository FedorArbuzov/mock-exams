# 2. Docker vs containerd

## Коротко

- **Docker** — это **набор инструментов** для разработчика: CLI (`docker`), демон, сборка образов, реестр, сеть и т.д.
- **containerd** — это **container runtime**, низкоуровневый движок, который реально запускает контейнеры.

**Docker под капотом использует containerd.** То есть containerd — это «двигатель», а Docker — «приборная панель» вокруг него.

## Слои

```
[Пользователь] -> docker CLI
                    |
                    v
                 dockerd (демон Docker)
                    |
                    v
                 containerd
                    |
                    v
                 runc (запуск процесса в namespace/cgroup ядра Linux)
```

## Зачем это знать в Kubernetes

Раньше kubelet общался с Docker через прослойку **dockershim**. Начиная с **Kubernetes 1.24** dockershim удалили. Теперь kubelet общается напрямую с runtime через **CRI** (Container Runtime Interface).

Сегодня в большинстве кластеров runtime — это **containerd** или **CRI-O**, а не Docker.

| | **Docker** | **containerd** |
|---|------------|-----------------|
| Уровень | Высокий (CLI, build, registry…) | Низкий (запуск контейнеров) |
| CLI | `docker` | `ctr`, `crictl` |
| Используется в Kubernetes как runtime? | Уже нет (через прослойку) | Да, по умолчанию |
| Где встретится | На рабочих машинах разработчиков, CI | Внутри узлов кластера |

## На вашем minikube

Проверка runtime в кластере:

```bash
kubectl get nodes -o wide
```

В колонке `CONTAINER-RUNTIME` обычно будет `containerd://...` или `docker://...` (зависит от версии и параметров minikube).

## Что использовать на практике

- На своей машине вы по-прежнему пользуетесь **Docker** (собрать образ, толкнуть в registry, запустить локально).
- В кластере контейнеры запускает **containerd**, и для пользователя кластера это **прозрачно** — вы работаете через `kubectl`, а не напрямую с runtime.
