# 02. Образ и Dockerfile: слои, COPY, CMD, build

## Введение: «works on my machine» в CI

Разработчик присылает zip с `pip install` на Windows, а pipeline на Linux падает на `gcc`. DevOps добавляет **Dockerfile**: фиксированный `python:3.12-slim`, `requirements.txt`, `USER` без root — и сборка в GitLab повторяет локальный результат. Эта глава — **как устроен образ**, **слои** и инструкции, которые вы увидите в [`deploy/containers/stack`](../../deploy/containers/stack).

## Что вы узнаете

- Модель **слоёв** и **кэша** при `docker build`.
- Инструкции `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `USER`, `CMD`.
- **Build context** и `.dockerignore`.
- **Multistage** — зачем и где смотреть пример.

## Слои образа

Каждая инструкция Dockerfile (кроме `ARG`, `ENV` в части случаев) создаёт **новый слой** — read-only diff. Контейнер при запуске добавляет **thin writable layer** сверху.

```text
[base FROM python:3.12-slim]
  → RUN pip install …
  → COPY app.py
  → USER appuser
  → CMD ["python", "app.py"]
```

| Принцип | Зачем |
|---------|--------|
| Редко меняющееся **выше** (раньше в файле) | кэш `RUN pip install` при правке только `app.py` |
| Один `RUN` для apt | меньше слоёв и размер |
| `.dockerignore` | не копировать `.git`, venv, секреты |

Пример ignore: [`examples/.dockerignore`](examples/.dockerignore).

## Dockerfile API (основное)

| Инструкция | Назначение |
|------------|------------|
| `FROM` | базовый образ (обязателен) |
| `WORKDIR` | каталог по умолчанию |
| `COPY` / `ADD` | файлы из **context** в образ (`COPY` предпочтительнее) |
| `RUN` | команда **на этапе build** (устанавливает пакеты) |
| `ENV` | переменные в образе и для последующих инструкций |
| `EXPOSE` | **документация** порта (не публикует на хост автоматически) |
| `USER` | от какого UID запускать процесс |
| `CMD` | команда **по умолчанию** при `docker run` |
| `ENTRYPOINT` | фиксированная точка входа; `CMD` — аргументы |

**CMD vs ENTRYPOINT:** для API-стека курса достаточно `CMD ["python", "app.py"]` — как в [`stack/api/Dockerfile`](../../deploy/containers/stack/api/Dockerfile).

## Разбор образа API на стенде

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN useradd -m -u 10001 appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
USER appuser
EXPOSE 8080
CMD ["python", "app.py"]
```

| Строка | Смысл |
|--------|--------|
| `useradd` + `USER` | процесс не root (глава [14](14-security.md)) |
| `COPY requirements` до `app.py` | кэш pip при изменении только кода |
| `EXPOSE 8080` | порт Flask внутри сети compose |
| exec-form `CMD ["…"]` | PID 1 без shell — корректные сигналы |

Web-образ — `nginx:1.27-alpine` + `COPY nginx.conf` — минимальный **reverse proxy** к `api:8080`.

## Build context

```bash
docker build -t myapi:lab ./stack/api
```

В context попадает **только** каталог `./stack/api` (и то, что не в `.dockerignore`). Секреты из родительского репозитория **не должны** попадать в context.

```bash
docker build --no-cache -t myapi:lab ./stack/api
docker image history myapi:lab
```

**`docker image history`** — список слоёв и размеров; полезно при «раздулся образ».

## Multistage build

Тяжёлые зависимости сборки (compiler, dev-пакеты) остаются в stage **builder**, в runtime копируется только артефакт:

```dockerfile
COPY --from=builder /install /usr/local
```

Полный пример: [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage). На стенде api — **одностадийный** slim-образ для простоты лаб.

## Теги и идентификация

| Тег | Когда |
|-----|--------|
| `:latest` | удобно локально; **опасно** в проде без pin |
| `:1.2.3` / git SHA | воспроизводимый deploy |
| `registry/host/app:tag` | полное имя для push |

Compose по умолчанию тегирует `project_service:latest` при `build:`.

## Типичные ошибки

| Ошибка | Симптом | Исправление |
|--------|---------|-------------|
| `COPY ..` огромного репо | build минуты, секреты в слое | узкий context + `.dockerignore` |
| `RUN apt` каждый раз без порядка | cache miss | объединить apt в один `RUN` |
| `CMD` shell-form `CMD python app.py` | сигналы не доходят до app | exec-form `["python","app.py"]` |
| Root в production image | компромисс контейнера = root на хосте* | `USER` (* при ослабленном seccomp) |
| `ADD` с URL без нужды | непредсказуемость | `COPY` |

## В продакшене

- **Pin** базового образа по digest: `python:3.12-slim@sha256:…`.
- **Distroless** / minimal base после multistage.
- CI: `docker build` с `--pull` периодически для security patches.
- Сканирование образа (глава [14](14-security.md)): Trivy, Grype, GitLab Container Scanning.
- Не хранить **токены** в `ARG`/`ENV` слоях — они остаются в history.

## Заметки для собеседования

- Слой immutable; изменение = новый слой + новый image id.
- `.dockerignore` аналог `.gitignore` для **build**, не для runtime.
- `EXPOSE` не открывает порт на хосте — нужен `-p` или `ports:` в compose.
- Multistage уменьшает **attack surface** и размер.

## Резюме

Dockerfile описывает **слои** приложения: база, зависимости, код, пользователь, команда запуска. Порядок инструкций и `.dockerignore` определяют **скорость CI** и **безопасность**. Стенд курса собирает api и web из `deploy/containers/stack` — в лабе вы соберёте свой тег вручную.

## Чек-лист

- Что попадает в build context?
- Зачем копировать `requirements.txt` раньше `app.py`?
- Чем `CMD` отличается от `RUN`?
- Где посмотреть multistage пример в курсе?

Следующий урок: [03. Лаба: Dockerfile](03-lab-dockerfile.md).
