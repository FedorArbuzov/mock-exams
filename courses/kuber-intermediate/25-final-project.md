# 25. Финальный проект: Postgres + API + Web + Ingress + HPA + RBAC

Цель — собрать **полный** приложенческий стек, в котором используются почти все элементы из этого курса. Это и итог, и ваш «портфолио-кейс»: можно потом ссылаться на него в собеседованиях.

## Что строим

```text
                              Internet (curl)
                                    │
                              [ Ingress: app.local ]
                                    │
                ┌───────────────────┼─────────────────────┐
                ▼                                          ▼
        [ Service: web ]                         [ Service: api ]
                │                                          │
        [ Deployment: web (HPA 2..5) ]            [ Deployment: api (HPA 2..6) ]
                                                          │
                                                          ▼
                                                  [ Service: db (headless) ]
                                                          │
                                                  [ StatefulSet: db (1 replica) ]
                                                          │
                                                  [ PVC: data-db-0 ]
```

Параллельно:

- **NetworkPolicy** в namespace `app-prod`: запретить вход извне, кроме ingress-controller-а.
- **ServiceAccount + Role**: API-pod может читать только Secret `db-credentials` в этом namespace, ничего больше.
- **PDB**: web и api не могут уйти ниже 2 реплик при disruption.
- **CronJob** `backup-db`: каждые 5 минут пишет timestamp в файл (имитация backup-job).

## Подготовка

```bash
mockctl up
kubectl create namespace app-prod
kubectl label namespace app-prod name=app-prod
kubectl config set-context --current --namespace=app-prod
```

## Шаг 1. Postgres StatefulSet + Secret

(если хотите — возьмите готовый чарт `bitnami/postgresql`; тут — голым YAML для практики)

`db.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata: { name: db-credentials }
type: Opaque
stringData:
  POSTGRES_PASSWORD: "S3cretP@ss"
---
apiVersion: v1
kind: Service
metadata: { name: db }
spec:
  clusterIP: None
  selector: { app: db }
  ports:
    - port: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: db }
spec:
  serviceName: db
  replicas: 1
  selector:
    matchLabels: { app: db }
  template:
    metadata:
      labels: { app: db }
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_PASSWORD
              valueFrom: { secretKeyRef: { name: db-credentials, key: POSTGRES_PASSWORD } }
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          ports: [{ containerPort: 5432, name: pg }]
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits:   { cpu: 500m, memory: 256Mi }
          readinessProbe:
            exec: { command: ["pg_isready","-U","postgres"] }
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata: { name: data }
      spec:
        accessModes: [ReadWriteOnce]
        resources: { requests: { storage: 200Mi } }
```

```bash
kubectl apply -f db.yaml
kubectl rollout status sts/db --timeout=180s
```

## Шаг 2. API + ServiceAccount с минимальным RBAC

API будет читать Secret из namespace, чтобы получить пароль к БД (хорошо так не делают — обычно через env), но это иллюстрация RBAC. Возьмём `bitnami/kubectl` как «API-приложение», которое демонстративно зовёт `kubectl get secret`.

`api.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata: { name: api-sa }
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: api-role }
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["db-credentials"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: api-rb }
subjects:
  - kind: ServiceAccount
    name: api-sa
roleRef:
  kind: Role
  name: api-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }
  ports: [{ port: 8080, targetPort: 8080 }]
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 2
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      serviceAccountName: api-sa
      containers:
        - name: api
          image: hashicorp/http-echo:latest
          args: ["-listen=:8080","-text=hello from api"]
          ports: [{ containerPort: 8080 }]
          resources:
            requests: { cpu: 50m, memory: 32Mi }
            limits:   { cpu: 200m, memory: 64Mi }
          readinessProbe:
            httpGet: { path: /, port: 8080 }
            periodSeconds: 5
```

```bash
kubectl apply -f api.yaml
kubectl rollout status deploy/api
```

## Шаг 3. Web (frontend)

`web.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }
  ports: [{ port: 80, targetPort: 80 }]
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 2
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: nginx
          image: nginx:1.27-alpine
          ports: [{ containerPort: 80 }]
          resources:
            requests: { cpu: 50m, memory: 32Mi }
            limits:   { cpu: 200m, memory: 64Mi }
          lifecycle:
            preStop:
              exec: { command: ["sh","-c","sleep 5"] }
          readinessProbe:
            httpGet: { path: /, port: 80 }
            periodSeconds: 5
```

```bash
kubectl apply -f web.yaml
kubectl rollout status deploy/web
```

## Шаг 4. Ingress

`ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
spec:
  rules:
    - host: app.local
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service: { name: api, port: { number: 8080 } }
          - path: /
            pathType: Prefix
            backend:
              service: { name: web, port: { number: 80 } }
```

```bash
kubectl apply -f ingress.yaml
kubectl get ingress
```

Локальная проверка:

```bash
IP=$(minikube ip -p mock-exams)
curl --resolve app.local:80:$IP http://app.local/
curl --resolve app.local:80:$IP http://app.local/api
```

## Шаг 5. HPA для web и api

```bash
kubectl autoscale deploy web --cpu-percent=50 --min=2 --max=5
kubectl autoscale deploy api --cpu-percent=50 --min=2 --max=6
kubectl get hpa
```

## Шаг 6. PDB

`pdb.yaml`:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: web-pdb }
spec:
  selector: { matchLabels: { app: web } }
  minAvailable: 2
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: api-pdb }
spec:
  selector: { matchLabels: { app: api } }
  minAvailable: 2
```

```bash
kubectl apply -f pdb.yaml
kubectl get pdb
```

## Шаг 7. CronJob для бэкапов

```yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: backup-db }
spec:
  schedule: "*/5 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 1
      ttlSecondsAfterFinished: 600
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: postgres:16-alpine
              env:
                - name: PGPASSWORD
                  valueFrom: { secretKeyRef: { name: db-credentials, key: POSTGRES_PASSWORD } }
              command:
                - sh
                - -c
                - "pg_dump -h db -U postgres -d postgres > /tmp/dump.sql && wc -l /tmp/dump.sql"
```

```bash
kubectl apply -f cronjob.yaml
```

Через 5 минут:

```bash
kubectl get jobs
kubectl logs job/$(kubectl get jobs -o name | head -1 | sed 's@job.batch/@@')
```

## Шаг 8. NetworkPolicy (нужен calico — пропустить, если на дефолтном CNI)

Если у вас calico: запретить весь вход в namespace, кроме ingress-controller-а.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress }
spec:
  podSelector: {}
  policyTypes: [Ingress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-from-ingress }
spec:
  podSelector:
    matchExpressions:
      - { key: app, operator: In, values: [web, api] }
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector:
            matchLabels: { kubernetes.io/metadata.name: ingress-nginx }
```

`kubernetes.io/metadata.name` — авто-label, который k8s ставит на каждый namespace.

## Проверка

```bash
kubectl get all,pdb,hpa,ingress,sa,role,rolebinding,cronjob -n app-prod
kubectl top pods -n app-prod
curl --resolve app.local:80:$(minikube ip -p mock-exams) http://app.local/api
```

## Уборка

```bash
kubectl delete namespace app-prod
kubectl config set-context --current --namespace=default
```

## Что вы только что сделали

В одном проекте использованы:

- StatefulSet + Headless Service + PVC.
- Deployment с probes, resources, preStop.
- Ingress с host-based маршрутизацией и path-routing.
- HPA на CPU.
- PDB для двух Deployment-ов.
- ServiceAccount + Role + RoleBinding с **точечным** доступом.
- CronJob с подключением к Secret через env.
- NetworkPolicy «default-deny + allow-from-ingress» (с calico).

Это и есть production-ready минимум для веб-приложения. Всё, что выше — observability, GitOps, security hardening — следующий курс [`kuber-advanced`](../kuber-advanced/README.md).
