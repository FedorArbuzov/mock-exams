# 24. Лаба: своя CRD `Tenant`

## Подготовка

```bash
kubectl create namespace lab-crd
kubectl config set-context --current --namespace=lab-crd
```

## Задание 1. Создать CRD

`crd.yaml`:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: tenants.example.com
spec:
  group: example.com
  scope: Namespaced
  names:
    kind: Tenant
    plural: tenants
    singular: tenant
    shortNames: [tn]
  versions:
    - name: v1
      served: true
      storage: true
      subresources:
        status: {}
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required: [owner]
              properties:
                owner:
                  type: string
                  minLength: 1
                quota:
                  type: integer
                  minimum: 1
                  maximum: 100
                  default: 10
                tier:
                  type: string
                  enum: [free, pro, enterprise]
                  default: free
            status:
              type: object
              properties:
                phase:
                  type: string
                createdNamespaces:
                  type: array
                  items:
                    type: string
      additionalPrinterColumns:
        - name: Owner
          type: string
          jsonPath: .spec.owner
        - name: Tier
          type: string
          jsonPath: .spec.tier
        - name: Quota
          type: integer
          jsonPath: .spec.quota
        - name: Phase
          type: string
          jsonPath: .status.phase
        - name: Age
          type: date
          jsonPath: .metadata.creationTimestamp
```

```bash
kubectl apply -f crd.yaml
kubectl get crd tenants.example.com
kubectl api-resources | grep tenants
```

**Что увидите:** `tenants` появился в списке api-resources, group `example.com/v1`, namespaced.

## Задание 2. Попробовать невалидный объект

```bash
cat <<EOF | kubectl apply -f -
apiVersion: example.com/v1
kind: Tenant
metadata: { name: bad }
spec:
  quota: 9000
EOF
```

**Что увидите:** API-сервер отклонит:

```text
error validating data: ... missing required field "owner" ... spec.quota: Invalid value: 9000: spec.quota in body should be less than or equal to 100
```

Это работает встроенная валидация по OpenAPI v3.

## Задание 3. Создать корректные объекты

`tenants.yaml`:

```yaml
apiVersion: example.com/v1
kind: Tenant
metadata: { name: alice }
spec:
  owner: alice
  tier: pro
  quota: 25
---
apiVersion: example.com/v1
kind: Tenant
metadata: { name: bob }
spec:
  owner: bob
  # tier и quota возьмутся из default
```

```bash
kubectl apply -f tenants.yaml
kubectl get tenants
```

**Что увидите:** таблица с колонками `OWNER TIER QUOTA PHASE AGE`. У `bob` tier=`free`, quota=`10` (defaults).

## Задание 4. Subresource status

```bash
kubectl patch tenant alice --type=merge --subresource=status -p \
  '{"status":{"phase":"Active","createdNamespaces":["alice-prod","alice-dev"]}}'
kubectl get tenant alice -o yaml | grep -A4 status
```

**Что увидите:** в `.status.phase = Active`. Изменение через subresource — нормальный путь для оператора.

Попробуйте обновить status через обычный `apply`:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: example.com/v1
kind: Tenant
metadata: { name: alice }
spec:
  owner: alice
  tier: pro
  quota: 25
status:
  phase: Apply-Style
EOF
kubectl get tenant alice -o jsonpath='{.status.phase}{"\n"}'
```

**Что увидите:** статус **не поменялся**. Когда `subresources.status: {}` объявлен в CRD, обычный apply **игнорирует** изменения `.status`. Это и нужно для разделения «спека пользователя / статус системы».

## Задание 5. Использовать short-name

```bash
kubectl get tn
kubectl describe tn alice
```

`tn` — short-name из CRD. Полезно для скорости.

## Задание 6. Удаление

```bash
kubectl delete tenant alice bob
kubectl delete crd tenants.example.com
kubectl get tenants 2>&1 | head -3
```

**Что увидите:** «server doesn't have a resource type tenants». CRD удалена — все её объекты тоже удалены автоматически.

## Уборка

```bash
kubectl delete namespace lab-crd
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Чем CRD отличается от Tenant-объекта (созданного по этой CRD)?
2. Что произойдёт при `kubectl delete crd tenants.example.com`, если есть существующие Tenant-объекты?
3. Зачем `subresources.status: {}`?
4. Что такое `served: true` и `storage: true`?
5. Как сделать default-значение для поля в CRD?
