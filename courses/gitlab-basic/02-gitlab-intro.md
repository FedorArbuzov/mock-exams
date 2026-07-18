# 02. GitLab: проект, issues, Merge Request

## Введение: сценарий с работы

Понедельник, онбординг. Вам выдали доступ к group `platform` на корпоративном GitLab — а на курсе вы поднимаете **свой** instance на [http://localhost:8929](http://localhost:8929). Team lead: «Создай project `hello-ci`, заведи issue на pipeline, сделай MR с `Closes #1`». Вы создаёте проект в **public** visibility — коллега напоминает: учебный код тоже **Private**. Второй инцидент: merge в `main` без зелёного pipeline — оказывается, **protected branch** не настроен. Третий: ищете CI variables в Repository settings — они в **CI/CD**.

Эта глава — навигация по **GitLab UI** и настройкам, без которых лабы 04+ превращаются в «где кнопка Runners?».

## Что вы узнаете

- Иерархия: **Instance → Group → Project**.
- Создание проекта и привязка к [`hello-ci`](examples/hello-ci/).
- Цикл **Issue → Branch → MR** и автозакрытие issue.
- Настройки CI/CD: variables, runners, general pipelines.
- **Protected branches** и merge только при green pipeline.
- Отличия локального CE от GitLab.com (кратко).

---

## Локальный GitLab CE

Если ещё не подняли стенд — [00-environment.md](00-environment.md) и [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md):

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
```

| Параметр | Значение курса |
|----------|----------------|
| URL | http://localhost:8929 |
| Admin | `root` |
| Compose | `deploy/gitlab/docker-compose.yml` |

Первый вход — пароль из `initial_root_password`. Для курса один пользователь `root` достаточен; в команде — роли Developer/Maintainer/Owner.

---

## Иерархия GitLab

```text
Instance (ваш GitLab CE на :8929)
└── Group (опционально: "courses", "team-platform")
      └── Project (репозиторий + CI + Issues + Wiki)
            ├── Repository (Git)
            ├── CI/CD → Pipelines
            ├── Issues / MR
            └── Settings
```

| Уровень | Пример | Зачем |
|---------|--------|-------|
| Instance | localhost:8929 | общие runners, admin |
| Group | `mock-exams-students` | общие variables, permissions |
| Project | `hello-ci` | один сервис / один курс-проект |

На basic часто: **Project под root** (`root/hello-ci`) без group — проще для лаб.

---

## Создание проекта hello-ci

1. **Projects → New project → Create blank project**.
2. **Project name:** `hello-ci`.
3. **Visibility:** **Private** (даже локально — привычка).
4. **Initialize repository with a README** — опционально; на лабе 04 можно `git init` локально и push.

После создания GitLab покажет **clone URL**:

```text
http://localhost:8929/root/hello-ci.git
```

SSH (`git@...`) на локальном CE без настройки ключей в compose может не работать — курс использует **HTTP** + пароль/PAT.

### Первый push

```bash
cd /path/to/hello-ci
git init
git remote add origin http://localhost:8929/root/hello-ci.git
git add .
git commit -m "chore: initial hello-ci from course examples"
git branch -M main
git push -u origin main
```

---

## Issues: трекинг работы

**Issues** — тикеты внутри проекта (как Jira-lite).

Создание:

1. **Issues → New issue**.
2. Title: `Add CI pipeline with lint and unit tests`.
3. Description: критерии приёмки, ссылка на главу курса.
4. Assignee: вы; Label: `ci`, `good first issue` (если создали labels).

**Связь с веткой:** в MR или commit message:

```text
Closes #1
Fixes #1
Resolves #1
```

При merge MR issue **#1** закроется автоматически.

```text
Issue #1 "Add CI pipeline"
    → git checkout -b issue-1-ci
    → commits + .gitlab-ci.yml
    → MR !1 "Closes #1"
    → merge → issue closed
```

Это видимость для менеджера и связь с **Lead Time** — от issue до merge.

---

## Merge Request в UI

**Merge requests → New merge request:**

| Поле | Рекомендация |
|------|--------------|
| Source | `issue-1-ci` |
| Target | `main` |
| Title | как commit: `feat(ci): add pipeline` |
| Description | что сделано, как проверить, `Closes #1` |
| Assignee / Reviewer | себе или коллеге |

Вкладки MR:

| Вкладка | Содержимое |
|---------|------------|
| Changes | diff |
| Pipelines | CI статус на этом MR |
| Commits | список коммитов ветки |

**Merge** только когда pipeline green (если включено в protected branch).

---

## Settings: CI/CD

**Settings → CI/CD** (развернуть секции):

### General pipelines

| Опция | Зачем |
|-------|-------|
| Auto-cancel redundant pipelines | новый push отменяет старый pipeline той же ветки — экономия runner |
| CI/CD configuration file | альтернативный путь к YAML (редко) |

### Variables

Секреты и конфиг для jobs — глава [07-variables-secrets.md](07-variables-secrets.md). Путь: **Settings → CI/CD → Variables → Add variable**.

### Runners

Список project / group / instance runners. Статус **green** = online. Глава [05-runners.md](05-runners.md).

### Pipeline triggers / Schedules

На basic — обзорно; в intermediate — scheduled pipelines, triggers.

---

## Protected branches

**Settings → Repository → Protected branches** → защитить `main`:

| Настройка | Рекомендация курса |
|-----------|-------------------|
| Allowed to merge | Maintainers (или Developers + approval) |
| Allowed to push | **No one** (только через MR) |
| Require approval | 1 approval (опционально на CE) |
| **Require status checks** | pipeline must succeed |

Эффект: прямой `git push origin main` → **rejected** для Developer. Только merge MR после green CI.

Связь с **Change Failure Rate** (DORA): меньше «сломанного main» → меньше hotfix и откатов ([`devops-culture`](../devops-culture/03-dora-metrics.md)).

---

## Repository settings

| Раздел | Зачем |
|--------|-------|
| Default branch | обычно `main` |
| Merge method | merge commit / squash / fast-forward |
| Push rules | запрет secrets в commit (EE feature; на CE — review + gitleaks в CI позже) |

**Squash merge** — один коммит в `main` из всей ветки; чистая история trunk.

---

## GitLab CE vs GitLab.com

| | Локальный CE (`:8929`) | GitLab.com |
|---|------------------------|------------|
| Хостинг | ваш Docker | SaaS |
| Runners | регистрируете сами | shared runners (лимиты) |
| Registry | localhost paths | `registry.gitlab.com` |
| Курс | все лабы | тот же YAML, другой URL |

Навыки **переносимы**: `.gitlab-ci.yml` одинаков по сути; меняются URL, runners, variables.

---

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| Variables в Repository → не там | не находите секреты | **CI/CD → Variables** |
| Public project | лишняя видимость | Private |
| Нет protected `main` | push ломает trunk | Protected branches |
| MR без `Closes #N` | issue висит open | дописать в description |
| Clone по SSH без ключей | Permission denied | HTTP remote |
| Искать pipeline в Builds | устаревшее имя | **CI/CD → Pipelines** |

---

## Резюме

- **Project** — центр: Git, Issues, MR, CI.
- Workflow **Issue → branch → MR → merge** даёт прослеживаемость.
- **Settings → CI/CD** — variables, runners, auto-cancel.
- **Protected `main`** + green pipeline — минимальный quality gate.
- Локальный CE на `:8929` повторяет логику корпоративного GitLab.

---

## Чек-лист

- [ ] Group vs Project — в чём разница?
- [ ] Как закрыть issue #5 из MR одной фразой?
- [ ] Где в UI задать masked CI variable?
- [ ] Зачем protected branch на `main`?
- [ ] Где смотреть статус runner?
- [ ] Какой clone URL у project `root/hello-ci`?

Следующий урок: [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).
