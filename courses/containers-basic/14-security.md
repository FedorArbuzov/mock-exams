# 14. Безопасность образа: USER, read-only, секреты, scan

## Введение: CVE в базовом образе и root в контейнере

Security сканирует pipeline: в `python:3.12` — **критические CVE**, контейнер api работает от **root**, в Dockerfile случайно `COPY .env`. Задача DevOps — **уменьшить поверхность**: non-root, минимальный base, секреты вне образа, scan в CI. Эта глава — практики **до Kubernetes** (Pod security — в [`kuber-basic`](../kuber-basic/README.md)). Теория атак и supply chain: [appsec-fundamentals](../appsec-fundamentals/README.md).

## Что вы узнаете

- **`USER`** и файловые права.
- **Read-only root filesystem** (концепт).
- Почему **секреты не в image** и не в git.
- Обзор **сканирования** (Trivy, GitLab Container Scanning).
- Связь с [`linux-security`](../linux-security/README.md).

## Non-root пользователь

В [`stack/api/Dockerfile`](../../deploy/containers/stack/api/Dockerfile):

```dockerfile
RUN useradd -m -u 10001 appuser
USER appuser
```

| Root в контейнере | Non-root |
|-------------------|----------|
| при escape — UID 0 на хосте* | ограниченный ущерб |
| проще «chmod 777» | явные права на volume |

\* Зависит от seccomp, user namespaces, rootless Docker.

Проверка:

```bash
docker exec mock-containers-api id
```

## Read-only rootfs

Запуск (концепт, не на всём стенде):

```bash
docker run --read-only --tmpfs /tmp myimage:tag
```

В compose:

```yaml
read_only: true
tmpfs:
  - /tmp
```

Приложение должно писать только в **разрешённые** пути (`/tmp`, volume). Nginx и Flask — настроить логи в stdout (уже так на стенде).

## Секреты

| Антипаттерн | Правильно |
|-------------|-----------|
| `ENV API_KEY=secret` в Dockerfile | runtime: env / secret file |
| `COPY .env` | `.dockerignore` + Vault / K8s Secret |
| секреты в layer history | mount secret at run; BuildKit secrets |

`.dockerignore` курса: [`examples/.dockerignore`](examples/.dockerignore).

В GitLab — **masked variables** ([`gitlab-basic/07-variables-secrets`](../gitlab-basic/07-variables-secrets.md)).

## Минимальный образ

| Подход | Эффект |
|--------|--------|
| `-slim` / `-alpine` base | меньше пакетов |
| **multistage** | без compiler в runtime |
| **distroless** | нет shell — сложнее взлом |

Пример multistage: [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage).

## Сканирование (overview)

```bash
# при установленном trivy
trivy image lab/api:manual
```

GitLab ([`gitlab-advanced/03-container-scanning`](../gitlab-advanced/03-container-scanning.md)):

```yaml
include:
  - template: Security/Container-Scanning.gitlab-ci.yml
```

Pipeline **fail** на Critical — политика команды. Scan **до** push в prod registry.

## Дополнительные меры (кратко)

| Мера | Назначение |
|------|------------|
| `--cap-drop=ALL` | убрать Linux capabilities |
| `no-new-privileges` | запрет escalation |
| Pin base by digest | воспроизводимость патчей |
| Подпись cosign | supply chain |
| Не монтировать docker.sock | RCE на хост |

## На стенде

```bash
docker inspect mock-containers-api --format 'User={{.Config.User}}'
grep -E 'USER|useradd' deploy/containers/stack/api/Dockerfile
```

Ожидаете `User=appuser` или UID `10001`.

## Типичные ошибки

| Ошибка | Риск | Исправление |
|--------|------|-------------|
| `latest` base без обновлений | CVE | регулярный rebuild |
| Root + privileged | полный хост | USER + drop caps |
| Секрет в ARG | виден в history | BuildKit `--secret` |
| Игнорировать scan в CI | prod с CVE | gate в pipeline |
| chmod 777 на volume | tampering | UID/GID mapping |

## В продакшене

- **Policy**: только образы из approved registry.
- **Admission** (Kyverno): runAsNonRoot, readOnlyRootFilesystem.
- **SBOM** (Syft) для аудита.
- Ротация секретов без пересборки образа.
- Rootless Kubernetes nodes ([`linux-advanced`](../linux-advanced/README.md)).

## Заметки для собеседования

- Слои образа **не шифруют** секреты — любой с pull видит history.
- Read-only rootfs ≠ read-only volume.
- Scan находит **известные** CVE; zero-day — defense in depth.

## Резюме

Безопасный контейнер — **минимальный образ**, **non-root**, **секреты снаружи**, **scan в CI**. Стенд api уже с `USER appuser`; лаба усилит read-only и проверит `.dockerignore`.

## Чек-лист

- Какой USER у api на стенде?
- Почему `ENV PASSWORD` в Dockerfile плохо?
- Что даёт multistage?
- Где в GitLab включить container scanning?

Следующий урок: [15. Лаба: security](15-lab-security.md).
