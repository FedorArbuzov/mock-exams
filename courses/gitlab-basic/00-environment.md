# 00. Окружение: GitLab CE, runner, hello-ci

## Введение: сценарий с работы

Вторник, 10:00. Вас добавили в команду «Platform»: «Подними GitLab локально, зарегистрируй runner, запушь demo — pipeline должен позеленеть до обеда». Вы открываете `http://localhost:8929` — **502 Bad Gateway**. Коллега из Python-трека спрашивает: «Почему не GitHub Actions?» DevOps отвечает: «У нас on-prem CE, те же `.gitlab-ci.yml` что в корпоративном instance». Через час GitLab наконец стартует, но pipeline **висит pending** — runner не зарегистрирован. Третий разработчик пушит в `main` напрямую, ломает `main`, и team lead напоминает про **MR + protected branch**.

На курсе **gitlab-basic** вы собираете **полный цикл**: Git → GitLab project → `.gitlab-ci.yml` → runner → variables → artifacts. Без рабочего стенда на [`deploy/gitlab`](../../deploy/gitlab/README.md) лабы 04–10 превращаются в теорию «у меня дома работало». Эта глава — фундамент: Docker, RAM, первый вход, runner, demo-приложение [`examples/hello-ci/`](examples/hello-ci/).

## Что вы узнаете

- Как поднять **GitLab CE** через `docker compose` на порту **8929**.
- Где взять **пароль root** при первом входе и что делать после 24 часов.
- Чем **GitLab server** отличается от **GitLab Runner** и почему job без runner — pending.
- Минимальные **требования RAM** и как проверить статус `gitlab-ctl`.
- Как скопировать **hello-ci** и проверить Git локально.
- Чек-лист готовности к главе 01.

---

## GitLab CE в mock-exams

В репозитории mock-exams GitLab упакован для **локального обучения** — один instance, один runner в compose, без облачной подписки.

| Компонент | Контейнер / сервис | Назначение |
|-----------|-------------------|------------|
| GitLab CE | `mock-gitlab` | UI, Git, CI planner, registry (базово) |
| Runner | `mock-gitlab-runner` | выполняет jobs (docker executor) |
| URL с хоста | `http://localhost:8929` | браузер, `git remote` |
| URL из runner | `http://gitlab` | регистрация runner внутри сети compose |

Полная документация стенда: [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md).

### Запуск

Из **корня** репозитория mock-exams:

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
```

**Первый старт — 5–15 минут.** GitLab инициализирует БД, конфиги, внутренние сервисы. Не паникуйте при 502 — подождите и проверьте статус:

```bash
docker exec mock-gitlab gitlab-ctl status
```

Все сервисы должны быть `run`. Затем откройте: [http://localhost:8929](http://localhost:8929).

### Остановка и данные

```bash
docker compose -f deploy/gitlab/docker-compose.yml down
```

Volumes **сохраняют** проекты и пароли между перезапусками. Полная очистка (осторожно — потеряете проекты курса):

```bash
docker compose -f deploy/gitlab/docker-compose.yml down -v
```

---

## RAM и Docker

GitLab CE **тяжёлый**. На ноутбуке с 8 GB RAM закройте лишние IDE и браузерные вкладки.

| RAM | Ожидаемое поведение |
|-----|---------------------|
| < 4 GB | GitLab может не стартовать или OOM-kill |
| 4–6 GB | OK для одного пользователя, первый старт долгий |
| 8+ GB | Комфортно для курса + параллельных jobs |

В Docker Desktop (Windows/macOS) выделите **минимум 6 GB** памяти контейнерам: Settings → Resources.

Проверка, что Docker жив:

```bash
docker version
docker compose version
```

---

## Первый вход: пользователь root

1. Откройте [http://localhost:8929](http://localhost:8929).
2. Логин: **`root`**.
3. Пароль — одноразовый, из контейнера:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

**Сохраните пароль** в менеджере паролей. Файл `/etc/gitlab/initial_root_password` **удаляется через 24 часа** после первого старта. Если забыли — сброс через `gitlab-rake` (см. официальную доку GitLab) или пересоздание volume `down -v` (потеря данных).

После входа смените пароль: **Avatar → Edit profile → Password**. Для курса достаточно сильного локального пароля.

---

## Git: версия и настройка

Pipeline триггерится от **событий Git** (push, MR). Без Git на хосте вы не сделаете лабы.

```bash
git --version    # целевой минимум 2.30+
git config --global user.name "Your Name"
git config --global user.email "you@example.local"
```

На Windows используйте **Git Bash** или PowerShell с Git for Windows. URL remote для локального GitLab:

```text
http://localhost:8929/root/<project-name>.git
```

При запросе credentials: логин `root`, пароль — ваш GitLab password. Для удобства настройте [credential helper](https://git-scm.com/docs/gitcredentials) или Personal Access Token (Settings → Access Tokens, scope `write_repository`).

---

## GitLab Runner: обзор

**GitLab** (сервер) **планирует** pipeline: читает `.gitlab-ci.yml`, создаёт jobs, ставит в очередь.

**Runner** (агент) **забирает** job и выполняет `script` в shell, Docker или Kubernetes.

```text
push / MR → GitLab создаёт pipeline → jobs в очереди
    → Runner с подходящими tags → docker run image → script → success/fail
```

Без **online runner** с нужными **tags** jobs остаются **pending** (оранжевый кружок) — самый частый «инцидент» на курсе.

### Регистрация runner (кратко)

Подробно — в [05-runners.md](05-runners.md) и [06-lab-docker-runner.md](06-lab-docker-runner.md). Схема из [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md):

1. В GitLab: **Settings → CI/CD → Runners → New project runner**.
2. Tags: `docker`, `local` (как в README стенда).
3. Скопируйте registration token.
4. На хосте:

```bash
docker exec -it mock-gitlab-runner gitlab-runner register \
  --url http://gitlab \
  --token YOUR_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "local-docker" \
  --tag-list "docker,local" \
  --non-interactive \
  --docker-network-mode host
```

URL `http://gitlab` — имя сервиса **внутри** docker-сети compose. С хоста для отладки API используйте `http://host.docker.internal:8929` (Windows/macOS).

Проверка: **Settings → CI/CD → Runners** — зелёный статус **online**, tags `docker`.

---

## Demo-приложение hello-ci

Каталог [`examples/hello-ci/`](examples/hello-ci/) — минимальный **Python-пакет** для лаб CI: `app/`, `tests/`, `pyproject.toml`, ruff + pytest.

Локальная проверка **до** push (опционально, нужен Python 3.12+):

```bash
cd courses/gitlab-basic/examples/hello-ci
pip install -r requirements-dev.txt
pytest tests/ -v
ruff check app/ tests/
```

На лабе 04 вы скопируете эти файлы в **свой GitLab project** `hello-ci` (не обязательно форкать весь mock-exams). Структура:

```text
hello-ci/
├── app/
│   └── __init__.py
├── tests/
│   └── test_app.py
├── pyproject.toml
├── requirements-dev.txt
└── .gitlab-ci.yml    # добавите на лабе
```

---

## Связь с DORA и культурой DevOps

CI — не «красивые галочки», а способность **часто и безопасно** доставлять изменения. В [`devops-culture`](../devops-culture/03-dora-metrics.md) метрики **Deployment Frequency** и **Lead Time for Changes** напрямую зависят от того, насколько быстро **зелёный pipeline** после MR попадает в `main`. На basic вы закладываете технический минимум: MR, тесты в CI, секреты не в Git.

---

## Типичные ошибки

| Симптом | Частая причина | Что сделать |
|---------|----------------|-------------|
| 502 на `:8929` | GitLab ещё стартует | `gitlab-ctl status`, подождать 10–15 мин |
| `Cannot connect to Docker` | Docker Desktop выключен | Запустить Docker, повторить `compose up` |
| Pipeline pending forever | Нет runner / неверный `tags` | Зарегистрировать runner, см. 05–06 |
| `git push` 403 | Неверный пароль / нет прав | PAT или сменить пароль root |
| OOM / контейнер падает | < 4 GB RAM | Увеличить RAM Docker, закрыть лишнее |
| Пароль root не найден | Прошло > 24 ч | Сброс rake или `down -v` для учебного стенда |

---

## Резюме

- Стенд: `docker compose -f deploy/gitlab/docker-compose.yml up -d` → **http://localhost:8929**.
- Логин **root**, пароль из `initial_root_password`, сохранить сразу.
- **Runner** обязателен для выполнения jobs; тег `docker` — стандарт курса.
- **hello-ci** — эталонное приложение для лаб 04–10.
- Git **2.30+**, настроенные `user.name` / `user.email`.

---

## Чек-лист готовности

Отметьте перед главой 01:

- [ ] GitLab открывается в браузере без 502
- [ ] Вход под `root` успешен
- [ ] `gitlab-ctl status` — сервисы `run`
- [ ] Runner **online** с tag `docker` (или зарегистрируете на лабе 06)
- [ ] `git --version` ≥ 2.30
- [ ] Прочитали [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md)
- [ ] Знаете путь к `examples/hello-ci/`

Следующий урок: [01-git-workflow.md](01-git-workflow.md).
