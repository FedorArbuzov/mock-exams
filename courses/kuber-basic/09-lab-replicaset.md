# 9. Лаба: ReplicaSet

Цель — увидеть «магию самовосстановления» и понять связь selector ↔ labels.

## Задание 1. Создать ReplicaSet

Создайте файл `rs.yaml`:

- `kind: ReplicaSet`, имя `web-rs`.
- `replicas: 3`.
- `selector.matchLabels: { app: web }`.
- `template.metadata.labels: { app: web }`.
- В контейнере: `nginx:1.27`, порт 80.

Примените и проверьте:

```bash
kubectl apply -f rs.yaml
kubectl get rs
kubectl get pods -l app=web
```

**Проверка:** видите 3 пода со статусом `Running`.

## Задание 2. Самовосстановление

1. Удалите один из подов вручную:
   ```bash
   kubectl delete pod <имя-одного-пода>
   ```
2. Сразу же выполните `kubectl get pods -l app=web -w`.

**Проверка:** RS быстро создаёт новый Pod, общее число снова `3`.

## Задание 3. Масштабирование

1. Увеличьте до 5 реплик:
   ```bash
   kubectl scale rs/web-rs --replicas=5
   ```
2. Уменьшите до 2.
3. Проверьте, как меняется список подов.

**Проверка:** число `Running` подов соответствует `replicas`.

## Задание 4. Чужой Pod с такими же метками

1. Создайте отдельный Pod (не из RS) с меткой `app=web`:
   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: stranger
     labels:
       app: web
   spec:
     containers:
       - name: nginx
         image: nginx:1.27
   ```
2. Примените и сразу посмотрите `kubectl get pods -l app=web`.

**Что произойдёт:** RS «возьмёт» этот Pod как свой, и если общее число превышает `replicas`, RS удалит **один из** подов с такой меткой (может оказаться именно `stranger`).

**Вывод:** selectors считают поды по labels — будьте аккуратны с пересекающимися метками.

## Задание 5. Попытка обновить образ

1. Поменяйте в `rs.yaml` образ на `nginx:1.27.1`.
2. `kubectl apply -f rs.yaml`.
3. Посмотрите образы у уже работающих подов:
   ```bash
   kubectl get pods -l app=web -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
   ```

**Что увидите:** ReplicaSet **не обновит** существующие поды. Они продолжат быть на старом образе. Чтобы получить новые образы, придётся удалить поды (и RS их пересоздаст с актуальным шаблоном).

**Вывод:** для плавных обновлений нужен **Deployment** (следующая тема).

## Уборка

```bash
kubectl delete rs web-rs
kubectl delete pod stranger 2>/dev/null
```

## Вопросы для самопроверки

1. Что случится, если в `selector.matchLabels` и `template.metadata.labels` метки **не совпадут**?
2. Можно ли иметь два ReplicaSet с одинаковыми selectors? Что будет?
3. Почему «голый» Pod без RS/Deployment — плохая идея для прода?
