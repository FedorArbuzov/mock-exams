# 10. Лаба: ACL read-only пользователь

## Цель лабы

Создать пользователя **readonly** с доступом только к `app:*` и командам чтения; проверить отказ на `SET` и `FLUSHALL`.

## Предварительно

- Single-стенд: `docker compose up -d` в `deploy/redis`.
- Пример ACL: [`examples/acl-readonly.acl`](examples/acl-readonly.acl)

---

## Задание 1. Подготовить данные от admin

```bash
docker exec mock-redis redis-cli SET app:product:1 '{"name":"Book"}'
docker exec mock-redis redis-cli SET app:product:2 '{"name":"Pen"}'
docker exec mock-redis redis-cli SET internal:secret token
```

---

## Задание 2. Создать пользователя readonly

**Зачем:** воспроизвести файл примера в runtime.

```bash
docker exec mock-redis redis-cli ACL SETUSER readonly on \
  '>readonly-secret' '~app:*' '-@all' '+@read' '+ping' '+info'
docker exec mock-redis redis-cli ACL LIST | grep readonly
```

Или загрузить файл (если смонтирован в контейнер):

```bash
docker cp courses/redis-intermediate/examples/acl-readonly.acl mock-redis:/tmp/readonly.acl
docker exec mock-redis redis-cli ACL LOAD
```

(путь с хоста — из корня репозитория)

---

## Задание 3. Проверка чтения

```bash
docker exec mock-redis redis-cli --user readonly --pass readonly-secret GET app:product:1
docker exec mock-redis redis-cli --user readonly --pass readonly-secret PING
```

**Что увидите:** `PONG` и JSON книги.

---

## Задание 4. Запрет записи и чужих ключей

```bash
docker exec mock-redis redis-cli --user readonly --pass readonly-secret SET app:hack 1
docker exec mock-redis redis-cli --user readonly --pass readonly-secret GET internal:secret
docker exec mock-redis redis-cli --user readonly --pass readonly-secret FLUSHALL
```

**Что увидите:** `NOPERM` на каждую операцию.

---

## Задание 5. Запись под default

```bash
docker exec mock-redis redis-cli SET app:product:1 '{"name":"Book","v":2}'
docker exec mock-redis redis-cli --user readonly --pass readonly-secret GET app:product:1
```

---

## Задание 6. ACL LOG (опционально)

```bash
docker exec mock-redis redis-cli ACL LOG 5
```

**Что увидите:** записи об отказах readonly.

---

## Задание 7. Сохранение (осторожно)

На учебном стенде:

```bash
docker exec mock-redis redis-cli ACL SAVE
```

Не коммитьте production-секреты; в примере курса пароль учебный.

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | `readonly` читает `app:*` |
| 2 | `SET` / `FLUSHALL` / `GET internal:*` — `NOPERM` |
| 3 | `default` по-прежнему пишет |
| 4 | Понимаете строку ACL из `examples/acl-readonly.acl` |

Следующий урок: [11. Lua](11-lua.md).
