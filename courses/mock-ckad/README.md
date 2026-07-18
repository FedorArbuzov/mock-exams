# Mock CKAD

Имитация экзамена **CKAD** (Certified Kubernetes Application Developer). Три «прогона» по ~7 задач в каждом, рассчитанных на 2 часа — это и есть формат настоящего CKAD.

Подходит, чтобы:

- проверить готовность к CKAD;
- тренироваться выполнять задачи **на скорость** в живом кластере, а не на бумаге;
- закрепить материал [`kuber-basic`](../kuber-basic/README.md) + [`kuber-intermediate`](../kuber-intermediate/README.md).

## Формат

Каждый прогон — отдельная директория со структурой:

```text
mock-ckad/<NN>/
├── README.md       # условия задач (RU + EN)
├── prepare.sh      # создаёт исходные namespace и ресурсы
├── verify.sh       # автопроверка через kubectl get/jsonpath
└── solution.md     # эталонное решение (открывается ПОСЛЕ попытки)
```

Запуск:

```bash
# Поднять кластер
mockctl up

# Подготовить окружение для прогона
bash courses/mock-ckad/01/prepare.sh

# Засекаем 2 часа, читаем README.md, решаем

# Проверка
bash courses/mock-ckad/01/verify.sh
```

`verify.sh` печатает строки вида:

```text
[OK]   Q1: namespace 'dev' exists
[FAIL] Q2: deployment 'web' has 3 replicas (got 1)
...

Score: 5 / 7
```

После завершения можно посмотреть [`solution.md`](#) для разбора.

## Прогоны

| # | Темы | Сложность | Длительность |
|---|---|---|---|
| [01](01/README.md) | Pod, Deployment, Service, ConfigMap, Secret, Namespace | Низкая | 90 мин |
| [02](02/README.md) | Probes, Resources, Init / Sidecar, Job, CronJob, Volumes | Средняя | 120 мин |
| [03](03/README.md) | Ingress, NetworkPolicy, RBAC, ServiceAccount, HPA | Высокая | 120 мин |

Прохождение трёх прогонов с результатом ≥ 80% — хороший индикатор готовности к реальному CKAD.

## Как считается результат

- Каждая задача — 1 балл, частичные не учитываются.
- Прогон сдан, если ≥ 70% баллов (как на реальном экзамене).
- `verify.sh` детерминированный: можно запускать сколько угодно раз.

## Как откатить состояние

После прогона:

```bash
kubectl delete ns dev qa prod 2>/dev/null
mockctl up   # быстро, кластер уже запущен
```

Или на чистую:

```bash
mockctl clean
mockctl up
```

## Полезные хоткеи `kubectl` для скорости

```bash
alias k=kubectl
alias kn='kubectl config set-context --current --namespace'
export do='--dry-run=client -o yaml'   # k create deploy x --image=nginx $do > deploy.yaml
export now='--grace-period=0 --force'  # k delete pod p $now
```

`vim ~/.vimrc`:

```text
set number expandtab shiftwidth=2 tabstop=2
```

(на реальном экзамене это первое, что обычно настраивают).
