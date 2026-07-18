# 07. Лаба: self-heal и prune

## Цель

Увидеть self-heal после ручного scale и понять prune на тестовом ресурсе.

## Предварительно

Application `hello-gitops-direct` в состоянии Synced ([лаба 05](05-lab-first-application.md)).

## Часть 1 — self-heal

```bash
kubectl scale deploy hello-gitops -n gitops-demo --replicas=5
kubectl get deploy hello-gitops -n gitops-demo -o jsonpath='{.spec.replicas}{"\n"}'
# 5

# подождать 1–3 мин или:
argocd app sync hello-gitops-direct

kubectl get deploy hello-gitops -n gitops-demo -o jsonpath='{.spec.replicas}{"\n"}'
# 2
```

В UI: History — запись sync после drift.

## Часть 2 — Git-driven change

В fork измените `deploy/gitops/manifests/hello-gitops/deployment.yaml`:

```yaml
replicas: 3
```

Commit, push. Дождитесь auto-sync или Sync в UI.

```bash
kubectl get deploy hello-gitops -n gitops-demo -o jsonpath='{.spec.replicas}{"\n"}'
# 3
```

Верните `replicas: 2` в Git после эксперимента.

## Часть 3 — prune (осторожно)

На копии ветки удалите `service.yaml` из hello-gitops, push, sync.

```bash
kubectl get svc hello-gitops -n gitops-demo
# NotFound после sync
```

Восстановите Service из Git и sync снова.

## Критерии успеха

- [ ] Scale откатывается при selfHeal
- [ ] Push в Git меняет replicas
- [ ] Понимаете, что prune удаляет ресурс из кластера

Следующий урок: [08-ui-cli.md](08-ui-cli.md).
