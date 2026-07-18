# Локальный GitLab для курсов

## Запуск

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
```

Первый старт GitLab — **5–15 минут**. Статус:

```bash
docker exec mock-gitlab gitlab-ctl status
```

Откройте: [http://localhost:8929](http://localhost:8929)

## Первый вход

Пароль root:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

(файл удаляется через 24 ч — сохраните пароль)

## Регистрация Runner

1. Admin → CI/CD → Runners → New project runner (или в проекте Settings → CI/CD → Runners).
2. Tags: `docker`, `local`
3. На хосте:

```bash
docker exec -it mock-gitlab-runner gitlab-runner register \
  --url http://gitlab \
  --token YOUR_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "local-docker" \
  --non-interactive \
  --docker-network-mode host
```

URL `http://gitlab` — имя сервиса в compose-сети. Для отладки с хоста используйте `http://host.docker.internal:8929` (Windows/macOS).

## Остановка

```bash
docker compose -f deploy/gitlab/docker-compose.yml down
```

Данные в volumes сохраняются. Полная очистка: `down -v`.

## RAM

| RAM | Результат |
|-----|-----------|
| < 4 GB | GitLab может не стартовать |
| 4–6 GB | OK для одного пользователя |
| 8+ GB | Комфортно |
