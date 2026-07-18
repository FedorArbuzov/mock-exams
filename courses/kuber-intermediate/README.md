# Kubernetes Intermediate

Средний уровень. Подразумевается, что пройден [`kuber-basic`](../kuber-basic/README.md): человек уверенно создаёт Pod / Deployment / Service / Ingress, читает `describe` и `logs`.

Цель курса — превратить «знаю объекты» в «делаю production-ready приложения и понимаю эксплуатацию».

Локальная среда: кластер `mock-exams` (`mockctl up`), `kubectl` в PATH, для урока 6 — Helm.

## Программа

### Хранилище

1. [StatefulSet и Headless Service](01-statefulset.md)
2. [Лаба: StatefulSet + Postgres](02-lab-statefulset.md)
3. [Persistent Volumes: PV / PVC / StorageClass](03-persistent-volumes.md)
4. [Лаба: PVC, retention, ReadWriteOnce](04-lab-persistent-volumes.md)

### Запуск задач

5. [Job и CronJob](05-jobs.md)
6. [Лаба: Job, CronJob, поведение при failure](06-lab-jobs.md)

### Helm и переиспользование

7. [Helm: install, upgrade, values, шаблоны](07-helm.md)
8. [Лаба: упаковать demo-приложение в Helm-чарт](08-lab-helm.md)

### Доступ и сеть

9. [RBAC: ServiceAccount, Role, RoleBinding](09-rbac.md)
10. [Лаба: дать поду права читать ConfigMap](10-lab-rbac.md)
11. [NetworkPolicy](11-networkpolicy.md)
12. [Лаба: «закрыть» namespace, кроме одного клиента](12-lab-networkpolicy.md)

### Production-readiness приложения

13. [Probes продвинуто: startupProbe, тайминги, behaviour](13-probes-advanced.md)
14. [Лаба: довести «битое» приложение до Ready](14-lab-probes-advanced.md)
15. [Resources и QoS-классы (Guaranteed/Burstable/BestEffort)](15-resources-qos.md)
16. [Лаба: эксперимент с eviction](16-lab-resources-qos.md)
17. [HorizontalPodAutoscaler (HPA)](17-hpa.md)
18. [Лаба: HPA по CPU](18-lab-hpa.md)
19. [PodDisruptionBudget, surge / unavailable, drain](19-pdb-and-rollouts.md)
20. [Лаба: drain ноды без даунтайма](20-lab-pdb-and-rollouts.md)
21. [Init и sidecar контейнеры](21-init-and-sidecar.md)
22. [Лаба: общий volume init→app, sidecar-логгер](22-lab-init-and-sidecar.md)

### Расширение API

23. [CustomResourceDefinition (CRD)](23-crd.md)
24. [Лаба: своя CRD `Tenant`](24-lab-crd.md)

### Финальный проект

25. [Мини-проект: Postgres + API + Web + Ingress + HPA + RBAC](25-final-project.md)

## Что должно получиться к концу

- Уверенно отвечаете «как задеплоить вот это приложение в k8s»: state, конфиги, секреты, HPA, ingress, RBAC.
- Читаете и пишете Helm-чарты.
- Можете объяснить QoS-классы, причины OOMKilled и Evicted, что такое graceful shutdown, lifecycle hooks.
- Закрываете namespace через NetworkPolicy.
- Создаёте простую CRD и понимаете, как её расширить контроллером.

## Дальнейшие шаги

- [`kuber-advanced`](../kuber-advanced/README.md) — для тех, кто идёт в SRE / DevOps / Cluster-admin.
- [`mock-ckad`](../mock-ckad/README.md) — если цель сдать сертификацию CKAD.

## План каждого урока

Каждый урок состоит из двух файлов:

- `NN-topic.md` — теория (10–20 мин чтения).
- `NN-lab-topic.md` — практическая задача (15–40 мин), с подсказками и эталонным решением в конце.

Файлы создаются по мере прохождения программы. Текущий статус — каркас курса (программа), уроки наполняются итеративно.
