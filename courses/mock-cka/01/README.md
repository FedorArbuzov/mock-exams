# Mock CKA — Прогон 01

**Уровень:** низкий. **Время:** 90–120 минут. **Домен CKA:** кластер, RBAC, workloads, troubleshooting (базовый).

Связь: [kuber-advanced/01](../kuber-advanced/01-control-plane.md), [intermediate RBAC](../kuber-intermediate/README.md).

## Подготовка

```bash
mockctl up
bash courses/mock-cka/01/prepare.sh
```

Создаются namespace `cka-m1`, `cka-m1-vault` и сломанный deployment `billing-api`.

## Задачи

### Q1. Контекст и namespace

Установите namespace по умолчанию для **текущего** kube-context в `cka-m1` (чтобы `kubectl get pods` без `-n` показывал поды `cka-m1`).

### Q2. RBAC в namespace

В namespace `cka-m1` создайте:

- ServiceAccount `ops`;
- Role `ops-deploy-reader` с правами `get`, `list`, `watch` на ресурс `deployments`;
- RoleBinding `ops-deploy-reader`, связывающий SA `ops` с этой Role.

### Q3. Метки нод

Пометьте **все** ноды кластера label `workload=general`.

### Q4. Починить deployment

В `cka-m1` deployment `billing-api` не поднимается (неверный образ). Исправьте:

- образ: `nginx:1.27-alpine`;
- реплик: **2**;
- label подов `app=billing` (уже на deployment — сохраните).

Дождитесь `2/2` Ready.

### Q5. ClusterRole для секретов

Создайте:

- ClusterRole `secret-reader` — verbs `get`, `list` на ресурс `secrets` (все namespace);
- ClusterRoleBinding `vault-sync-secrets`, привязка к ServiceAccount `vault-sync` в namespace `cka-m1-vault` (SA уже создан `prepare.sh`).

### Q6. Инвентаризация control plane

Запишите в файл `~/cka-m1-q6.txt` **только число** — сколько подов в статусе `Running` в namespace `kube-system`.

### Q7. ResourceQuota

В `cka-m1` создайте ResourceQuota `platform-quota`:

- `cpu`: `4`
- `memory`: `8Gi`
- `pods`: `20`

## Проверка

```bash
bash courses/mock-cka/01/verify.sh
```

## Откат

```bash
kubectl delete ns cka-m1 cka-m1-vault
rm -f ~/cka-m1-q6.txt
```

## После попытки

[`solution.md`](solution.md)
