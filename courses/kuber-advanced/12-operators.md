# 12. Operator pattern и kubebuilder

## Паттерн

```text
CRD (Tenant)  →  Controller (watch)  →  reconcile loop  →  создать Namespace, RBAC, ...
```

1. Пользователь создаёт `Tenant` CR.
2. Controller видит событие.
3. Сравнивает desired (spec) vs actual (что в кластере).
4. Создаёт/обновляет/удаляет зависимые объекты.
5. Пишет status (phase, conditions).

## kubebuilder

Фреймворк для генерации Go-оператора:

```bash
kubebuilder init --domain example.com --repo github.com/you/project
kubebuilder create api --group example --version v1 --kind Tenant
make install   # CRD в кластер
make run       # controller локально
```

Требует Go 1.21+ на хосте.

## Альтернативы

- **Operator SDK** (Red Hat)
- **Kopf** (Python)
- **shell-operator** (bash)

## Когда operator

- Сложный lifecycle (БД: backup, failover, upgrade).
- Доменная логика «если Tenant создан → создать 5 объектов».
- Не для простого Deployment — достаточно Helm/Argo.

## Чек-лист

- Что такое reconcile loop?
- Чем CRD от controller?
- Зачем `.status` subresource?

Лаба: [13-lab-operator.md](13-lab-operator.md).
