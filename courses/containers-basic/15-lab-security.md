# 15. Лаба: hardening образа и проверки

## Цель лабы

Проверить **non-root** на стенде, усилить **.dockerignore**, опционально запустить **read-only** контейнер, выполнить **scan** (если установлен trivy) и зафиксировать чек-лист.

## Предварительно

```bash
cd deploy/containers
docker compose up -d --build
```

Теория: [14. Безопасность](14-security.md).

---

## Задание 1. USER и процессы

```bash
docker exec mock-containers-api id
docker exec mock-containers-api ps aux 2>/dev/null || docker top mock-containers-api
```

**Что увидите:** uid=10001; процесс python не от root.

---

## Задание 2. Секреты не в образе

```bash
docker history mock-containers-api --no-trunc | grep -i env || echo "no obvious ENV secrets"
echo 'FAKE_SECRET=do-not-commit' > stack/api/.env
docker build -t lab/api:sec-test ./stack/api 2>&1 | tail -5
```

Скопируйте [`examples/.dockerignore`](examples/.dockerignore) в `stack/api/.dockerignore`, пересоберите:

```bash
docker build -t lab/api:sec-test ./stack/api
docker run --rm lab/api:sec-test ls -la .env 2>&1 || echo "expected: .env not in image"
rm -f stack/api/.env stack/api/.dockerignore
```

**Что увидите:** без ignore `.env` мог попасть в слой; с ignore — файла нет.

---

## Задание 3. Read-only root (учебный run)

```bash
docker run --rm --read-only --tmpfs /tmp \
  -e REDIS_HOST=127.0.0.1 lab/api:manual python -c "print('ro ok')" 2>/dev/null || \
docker run --rm --read-only --tmpfs /tmp lab/api:manual id
```

**Что увидите:** простая команда работает; полноценный Flask на RO потребует tmpfs для записей — обсудите в отчёте.

---

## Задание 4. Capabilities (обзор)

```bash
docker inspect mock-containers-api --format '{{.HostConfig.CapDrop}} {{.HostConfig.Privileged}}'
```

**Что увидите:** `Privileged=false`; CapDrop может быть пустым (default) — в K8s настроите drop ALL.

---

## Задание 5. Scan (опционально)

```bash
command -v trivy && trivy image --severity HIGH,CRITICAL mock-containers-api || echo "install trivy for scan"
```

Зафиксируйте **число** HIGH/CRITICAL в заметках. План remediation: обновить base image.

---

## Задание 6. Чек-лист hardening (заполните)

| Пункт | Стенд api | Ваш сервис |
|-------|-----------|------------|
| Non-root USER | ☐ | ☐ |
| Нет секретов в Dockerfile | ☐ | ☐ |
| .dockerignore | ☐ | ☐ |
| Slim / multistage base | ☐ | ☐ |
| Scan в CI | ☐ | ☐ |
| Redis не на host port | ☐ | ☐ |
| Один published port (web) | ☐ | ☐ |

---

## Задание 7. Сравнение с GitLab

Прочитайте фрагмент [gitlab-intermediate/03-docker-registry](../gitlab-intermediate/03-docker-registry.md) — где `docker login` и push. Добавьте в заметки: **scan должен быть до push в prod registry**.

---

## Критерии успеха

- [ ] api работает от UID ≠ 0
- [ ] Понимаете роль `.dockerignore` для `.env`
- [ ] Пробовали `--read-only` + tmpfs
- [ ] Чек-лист заполнен
- [ ] Знаете, куда встроить trivy в CI

## Что унести в работу

- Hardening — часть **Definition of Done** для Dockerfile
- Секреты → runtime, не слои
- Связка с GitLab Registry + Container Scanning

Следующий урок: [16. Docker vs Kubernetes](16-docker-vs-kubernetes.md).
