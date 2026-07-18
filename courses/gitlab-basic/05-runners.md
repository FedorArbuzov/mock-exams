# 05. Runners: типы и executors

## Введение: сценарий с работы

Понедельник, 09:15. В Slack: «Все pipelines pending с пятницы». Оказывается, VM с runner ушла в reboot, а **gitlab-runner** не в autostart. Второй кейс: job с `tags: [gpu]` висит вечно — в проекте только runners с `docker`. Третий: security audit — docker executor с `/var/run/docker.sock` на общей VM: «любой job может смонтировать хост». На курсе вы учитесь **диагностировать pending** и понимать trade-offs; в production — изоляция, отдельные runner fleet ([`gitlab-advanced`](../gitlab-advanced/README.md)).

**GitLab Server** (ваш CE на `:8929`) **не выполняет** `script` jobs — только планирует. Выполняет **Runner**.

## Что вы узнаете

- Архитектура: GitLab → очередь → Runner → executor.
- Типы runners: shared, group, project.
- Executors: **docker**, shell, kubernetes (обзор).
- **Tags** и почему job pending.
- Concurrency и очередь.
- Безопасность docker+socket (кратко).

---

## Архитектура

```text
┌─────────────────┐     job request      ┌──────────────────┐
│  GitLab CE      │ ──────────────────► │  GitLab Runner   │
│  :8929          │ ◄────────────────── │  (agent)         │
│  UI, Git, CI    │     job result       │  docker/shell/k8s│
└─────────────────┘                      └──────────────────┘
```

1. Push/MR → GitLab создаёт **pipeline** и **jobs**.
2. Jobs со статусом **pending** ждут runner.
3. Runner с подходящими **tags** и **executor** забирает job.
4. Выполняется `before_script` + `script` в среде executor.
5. Лог стримится в GitLab; статус success/failed.

Если runner offline — все jobs **застревают**. Это не баг YAML.

---

## Типы runners

| Тип | Область | Когда |
|-----|---------|-------|
| **Instance** (shared) | весь GitLab | общий пул в компании |
| **Group** | проекты группы | команда platform |
| **Project** | один project | изоляция, свои tags |

На курсе mock-exams: **project runner** в `hello-ci` с tags `docker`, `local` — см. [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md).

Регистрация привязывает runner к project/group/instance token. **Unregister** — runner пропадает из UI, jobs pending.

---

## Executors

| Executor | Где выполняется job | Плюсы | Минусы |
|----------|---------------------|-------|--------|
| **docker** | контейнер на хосте runner | изоляция, любой `image` | нужен Docker, socket риски |
| **shell** | напрямую на VM runner | просто, быстрый старт | нет изоляции, «грязная» VM |
| **kubernetes** | pod в кластере | масштаб, [`kuber-basic`](../kuber-basic/README.md) | сложнее setup |
| **custom** | редко | спец. среды | — |

Курс **basic/intermediate** — **docker executor** + образы `python:3.12-slim`, `docker:24-cli`.

### Docker executor (как это выглядит)

```text
Runner → docker pull python:3.12-slim
      → docker run ... gitlab-runner-helper + ваш repo checkout
      → script внутри контейнера
      → container destroy
```

Каждый job — **чистая** файловая система (кроме cache/artifacts volumes).

---

## Tags: маршрутизация jobs

В `.gitlab-ci.yml`:

```yaml
build:
  tags:
    - docker
  script:
    - echo "Runs only on runners with tag docker"
```

Runner при регистрации получает `--tag-list "docker,local"`.

| Ситуация | Результат |
|----------|-----------|
| Job `tags: [docker]`, runner `docker` | match |
| Job `tags: [docker, amd64]`, runner только `docker` | **нет match** — pending |
| Job без `tags` | любой **untagged** runner (настройка «run untagged») |
| Несколько runners | первый свободный с match |

На курсе **всегда** указывайте `tags: [docker]` в jobs — иначе job может уйти не на тот runner.

---

## Состояния job (диагностика)

| Статус | Значение |
|--------|----------|
| **pending** | нет runner / нет tags / очередь |
| **running** | runner выполняет |
| **success** | exit 0 |
| **failed** | ненулевой exit / script error |
| **canceled** | пользователь / auto-cancel |

**CI/CD → Pipelines → job →** иконка runner показывает, какой agent взял job.

---

## Concurrency

В `/etc/gitlab-runner/config.toml` на хосте runner:

```toml
concurrent = 4
```

Максимум **4 jobs одновременно** на этом runner process. Пятый job ждёт в pending.

Для класса из 20 студентов на одном ноутбуке — узкое место. Решения: больше `concurrent`, несколько runner VMs, лёгкие jobs, cache.

---

## Конфиг runner (обзор)

После регистрации в контейнере `mock-gitlab-runner`:

```bash
docker exec mock-gitlab-runner cat /etc/gitlab-runner/config.toml
```

Фрагмент:

```toml
[[runners]]
  name = "local-docker"
  url = "http://gitlab"
  executor = "docker"
  [runners.docker]
    image = "alpine:latest"
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
```

| Поле | Смысл |
|------|-------|
| `url` | GitLab API (в compose — `http://gitlab`) |
| `executor` | docker / shell / kubernetes |
| `image` | default, если job без `image` |
| `volumes` | socket для docker-in-docker build (intermediate) |

---

## Безопасность (кратко)

**Docker socket на хосте** = root на хосте из malicious job. В production:

- отдельные runner VM per trust zone;
- **Kaniko**, **buildah** без socket;
- **kubernetes executor** с pod security;
- не давать Developer доступ к shared runner с production secrets.

На учебном `:8929` риск приемлем; **привычка** не хранить prod secrets на том же runner.

---

## Runner vs GitLab server

| | GitLab CE | Runner |
|---|-----------|--------|
| Роль | Git, UI, CI planner | выполнение jobs |
| Масштаб | тяжёлый (RAM) | легче, можно много |
| Где в compose | `mock-gitlab` | `mock-gitlab-runner` |
| Без него | push работает | jobs pending |

Можно иметь **один GitLab** и **десятки runners** в разных сетях (on-prem, cloud).

---

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| Runner stopped | все pending | `docker start mock-gitlab-runner` |
| Неверный registration token | register fail | новый token в UI |
| Tag mismatch | один job pending | выровнять tags job/runner |
| `url` http vs https | register/run fail | как в compose |
| Забыли `--tag-list` | job с docker tag pending | перерегистрация |
| Один concurrent, 10 jobs | долгая очередь | подождать или увеличить |

---

## Резюме

- Runner — **единственный** исполнитель jobs; offline runner = **pending pipeline**.
- **Project runner** с tag `docker` — стандарт курса.
- **Docker executor** запускает `image` per job.
- **Tags** — явная маршрутизация; job и runner должны совпасть.
- Socket и shared runners — зона security внимания в prod.

---

## Чек-лист

- [ ] Runner vs GitLab server — кто что делает?
- [ ] Зачем tags в job и runner?
- [ ] Почему job висит pending (3 причины)?
- [ ] Shell vs docker executor — trade-off?
- [ ] Где в UI статус runner?
- [ ] Что такое `concurrent`?

Следующий урок: [06-lab-docker-runner.md](06-lab-docker-runner.md).
