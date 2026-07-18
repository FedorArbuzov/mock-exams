# 23. CustomResourceDefinition (CRD)

## Зачем своему «kind»

Все встроенные объекты Kubernetes (Pod, Deployment, ConfigMap, Service…) — это просто JSON-документы, которые лежат в etcd по адресам типа `/registry/pods/default/web`. **API сервер** валидирует их, кладёт в etcd, отдаёт по запросу. **Контроллеры** (kube-controller-manager и др.) их обрабатывают.

CRD позволяет добавить **свой kind** в этот же API-сервер. После apply CRD можно делать:

```bash
kubectl apply -f - <<EOF
apiVersion: example.com/v1
kind: Tenant
metadata: { name: t1 }
spec:
  owner: alice
EOF
kubectl get tenants
kubectl describe tenant t1
```

— как с любым встроенным объектом. Без своего контроллера это будет «база данных в кубе» — просто хранилище. Если есть **оператор**, он подписывается на изменения и реагирует (создаёт namespace, выдаёт RBAC и т.п.).

## Что такое CRD

`CustomResourceDefinition` — мета-объект, описывающий ваш ресурс. Указывает:

- группу (`example.com`);
- версию (`v1`);
- имя ресурса (`tenants`);
- что он `Namespaced` или `Cluster`-scoped;
- **схему** (validate-OpenAPI v3) для полей.

Минимальный CRD:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: tenants.example.com           # формат: <plural>.<group>
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
                quota:
                  type: integer
                  minimum: 1
                  maximum: 100
            status:
              type: object
              properties:
                phase:
                  type: string
```

После apply:

```bash
kubectl get crd tenants.example.com
kubectl api-resources | grep tenants
# tenants   tn          example.com/v1   true   Tenant
```

## Создание ресурса

```yaml
apiVersion: example.com/v1
kind: Tenant
metadata: { name: alice }
spec:
  owner: alice
  quota: 5
```

API-сервер валидирует это против схемы. Если `quota: 200` — отклонит (`maximum: 100`). Если `owner` не указан — отклонит (`required`).

## Subresources: `/status`, `/scale`

```yaml
versions:
  - name: v1
    served: true
    storage: true
    subresources:
      status: {}
      scale:
        specReplicasPath: .spec.replicas
        statusReplicasPath: .status.replicas
        labelSelectorPath: .status.selector
```

Что даёт:

- **status** — отдельный endpoint `kubectl patch tenant t --type=merge --subresource=status -p '{"status":{"phase":"Ready"}}'`. Контроллеры обновляют только статус, не трогая spec. Это правильный паттерн «оператор не должен переписывать spec пользователя».
- **scale** — `kubectl scale tenant t --replicas=3` будет работать, если в spec/status есть `replicas`.

## Дополнительные колонки

```yaml
versions:
  - name: v1
    served: true
    storage: true
    additionalPrinterColumns:
      - name: Owner
        type: string
        jsonPath: .spec.owner
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

`kubectl get tenants` покажет колонки Owner / Quota / Phase / Age — как у встроенных объектов.

## Multiple versions и conversion

CRD может иметь несколько версий одновременно:

```yaml
versions:
  - name: v1alpha1
    served: true
    storage: false
  - name: v1
    served: true
    storage: true
```

`storage: true` — версия, в которой объект **физически хранится** в etcd. `served: true` — версия отдаётся API. Нельзя иметь две `storage: true`.

Если схемы разные — нужен **conversion webhook**, который превращает одну версию в другую. Это уже сложно — в этом курсе не делаем.

## Где CRD не подходит

- Если вам нужна **сложная бизнес-логика** в API server (импersonation, кастомная авторизация). Это `aggregated apiserver`, а не CRD.
- Если объект очень большой (50+ МБ) — etcd негодный сторедж для blob-ов.
- Если вам нужен **строгий контроль** над schema migrations — CRD validation хорошая, но не SQL-уровень.

В 95% случаев CRD достаточно.

## Полезные команды

```bash
kubectl get crd
kubectl explain tenants.example.com.spec     # документация по схеме
kubectl get tenants -A
kubectl api-resources --api-group=example.com
```

## Чек-лист

- В чём разница между CRD и пользовательским объектом этого CRD?
- Что произойдёт, если apply объект, не соответствующий схеме CRD?
- Зачем `subresources.status`?
- Чем `served` отличается от `storage` в versions?
- В каком случае нужен conversion webhook?

В лабе [24-lab-crd.md](24-lab-crd.md) создадим свою CRD `Tenant` и потренируем работу с ней.
