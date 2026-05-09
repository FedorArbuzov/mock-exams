# 11. Лаба: Deployment

Цель — пройти полный цикл: создать, обновить, откатить, отмасштабировать.

## Задание 1. Создать Deployment

Файл `deploy.yaml`:

- `kind: Deployment`, имя `web`.
- `replicas: 3`.
- `selector.matchLabels: { app: web }`.
- В шаблоне: метка `app=web`, контейнер `web` с образом `nginx:1.27`, порт 80.

Применить:

```bash
kubectl apply -f deploy.yaml
kubectl get deploy
kubectl get rs
kubectl get pods -l app=web
```

**Проверка:** есть один Deployment, один ReplicaSet и три Pod в `Running`.

## Задание 2. Rolling update

1. Обновите образ:
   ```bash
   kubectl set image deploy/web web=nginx:1.27.1
   ```
2. Сразу:
   ```bash
   kubectl rollout status deploy/web
   kubectl get rs -l app=web
   ```

**Проверка:** появился новый ReplicaSet, старый — с `0` реплик; на подах теперь новый образ:

```bash
kubectl get pods -l app=web -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
```

## Задание 3. История и откат

```bash
kubectl rollout history deploy/web
kubectl rollout undo deploy/web
kubectl rollout status deploy/web
```

**Проверка:** Deployment вернулся на предыдущую ревизию; образ снова `nginx:1.27`.

## Задание 4. Сломанный релиз

1. Поставьте заведомо плохой образ:
   ```bash
   kubectl set image deploy/web web=nginx:does-not-exist
   ```
2. Посмотрите статус:
   ```bash
   kubectl rollout status deploy/web --timeout=30s
   kubectl get pods -l app=web
   ```

**Что должно быть:** появятся поды с `ImagePullBackOff`. Старые поды при стандартном `RollingUpdate` остаются, чтобы сервис не падал полностью.

3. Откатите:
   ```bash
   kubectl rollout undo deploy/web
   ```

## Задание 5. Масштабирование

1. Увеличьте до 6 реплик:
   ```bash
   kubectl scale deploy/web --replicas=6
   ```
2. Уменьшите до 2.

**Проверка:** `kubectl get pods -l app=web` показывает соответствующее число подов.

## Задание 6. Стратегия Recreate

1. Скопируйте `deploy.yaml` в `deploy-recreate.yaml`, поменяйте имя на `web-recreate`, добавьте:
   ```yaml
   spec:
     strategy:
       type: Recreate
   ```
2. Примените и обновите образ. Сравните поведение с `RollingUpdate`.

**Что увидите:** при `Recreate` сначала все старые поды умирают, и только потом поднимаются новые.

## Уборка

```bash
kubectl delete -f deploy.yaml
kubectl delete deploy web-recreate 2>/dev/null
```

## Вопросы для самопроверки

1. Чем Deployment отличается от ReplicaSet «по обязанностям»?
2. Что произойдёт, если в `template.metadata.labels` поменять метку, не меняя `selector.matchLabels`?
3. Что такое `maxSurge=1, maxUnavailable=0` на пальцах?
