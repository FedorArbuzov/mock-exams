# 01. Git: ветки, MR, коммиты

## Введение: сценарий с работы

Пятница, 17:45. Разработчик пушит «быстрый фикс» прямо в `main` — без MR, без review. В понедельник pipeline на `main` красный, прод недоступен два часа. Postmortem: «Кто последний мержил?» — в истории коммит `fix` без тела. Team lead вводит правило: **все изменения через Merge Request**, **Conventional Commits**, protected `main`. Вы открываете GitLab и видите: pipeline на MR #47 зелёный, на `main` после merge — тоже. Вопрос коллеги: «Зачем ветка, если я один в проекте?» — ответ в **истории**, **review** и **триггерах CI**.

На курсе Git — не абстракция, а **источник событий** для GitLab CI: push в feature-ветку, открытие MR, merge в `main`. Без дисциплины веток и коммитов pipeline и DORA-метрики ([`devops-culture`](../devops-culture/03-dora-metrics.md)) не имеют смысла.

## Что вы узнаете

- Зачем Git в DevOps: код, IaC, `.gitlab-ci.yml` в одном репозитории.
- Базовый цикл: clone → branch → commit → push → MR.
- Модели ветвления: Git Flow vs **trunk-based** (рекомендация курса).
- **Merge Request** как gate: review, pipeline, protected branch.
- **Conventional Commits** и осмысленные сообщения.
- `.gitignore`: что нельзя коммитить (секреты, артефакты).

---

## Зачем Git в DevOps

Всё, что описывает инфраструктуру и доставку, живёт в Git:

| Артефакт | Пример пути |
|----------|-------------|
| Приложение | `app/`, `src/` |
| CI/CD | `.gitlab-ci.yml` |
| IaC | `terraform/`, `helm/` |
| Документация | `README.md`, `docs/` |

GitLab CI читает `.gitlab-ci.yml` **из коммита**, для которого создан pipeline. Изменили YAML в ветке — pipeline на MR использует **новую** версию файла. Это **GitOps-мышление** в миниатюре: источник правды — репозиторий, не ручные клики в UI.

Связь с **Lead Time for Changes** (DORA): время от commit до prod сокращается, когда ветки короткие, MR маленькие, pipeline быстрый.

---

## Базовые команды

Типичный рабочий день — feature для issue «добавить lint в CI»:

```bash
git clone http://localhost:8929/root/hello-ci.git
cd hello-ci
git checkout -b feature/add-ci

# правки: .gitlab-ci.yml, app/, tests/
git status
git add .gitlab-ci.yml app/ tests/
git commit -m "feat(ci): add lint and unit test jobs"
git push -u origin feature/add-ci
```

После push в GitLab: **Create merge request** → target `main`.

| Команда | Назначение |
|---------|------------|
| `git status` | что изменено, что в stage |
| `git diff` | diff незакинутых изменений |
| `git log --oneline -10` | последние коммиты |
| `git pull --rebase origin main` | подтянуть `main` перед push (привычка) |

**Rebase vs merge:** для учебного курса достаточно merge через GitLab UI. В командах часто `rebase` на `main` перед merge — линейная история.

---

## Ветки: модели и практика

| Ветка | Назначение |
|-------|------------|
| `main` / `master` | production-ready, защищённая |
| `develop` | интеграция (опционально, Git Flow) |
| `feature/*` | одна задача — одна ветка |
| `fix/*`, `hotfix/*` | исправления |

### Trunk-based development

Короткоживущие feature-ветки (часы–1–2 дня), частый merge в `main` за флагом или после зелёного CI. Длинные ветки «живут месяц» — конфликты, страх merge, падает **Deployment Frequency**.

```text
main ──●──●──●──●──●──►
        \    /
feature   ●──●
```

Для **gitlab-basic** на локальном `:8929` достаточно: `main` + `feature/...`.

### Branch vs tag

| | Branch | Tag |
|---|--------|-----|
| Движется | да (новые коммиты) | нет (указатель на commit) |
| CI на push | да | при push tag (rules) |
| Релиз | обычно tag `v1.2.0` | semver на commit |

---

## Merge Request (MR)

В GitLab **MR** = Pull Request в GitHub. Workflow:

```text
1. Push feature-ветки
2. Open MR → main
3. Pipeline на MR (если rules настроены)
4. Code review → Approve
5. Merge (squash или merge commit — настройка проекта)
6. Pipeline на main (опционально post-merge)
```

**Зачем MR, если можно push в main?**

- **Review** — вторые глаза на код и YAML.
- **CI до merge** — не ломать `main`.
- **Аудит** — кто approved, какие обсуждения.
- **Protected branches** — push в `main` запрещён (глава 02).

Связь с issue:

```text
Issue #12 "Add CI pipeline"
    → branch issue-12-ci
    → commits
    → MR !3 с текстом "Closes #12"
    → merge → issue закрыта автоматически
```

---

## Хороший коммит

Плохо:

```text
fix
wip
asdfasdf
```

Хорошо (**Conventional Commits**):

```text
feat(ci): add ruff lint job for Python app

- stage test, image python:3.12-slim
- rules: merge_request and main
```

Формат: `<type>(<scope>): <subject>`

| type | Когда |
|------|-------|
| `feat` | новая возможность |
| `fix` | исправление бага |
| `ci` | только CI/CD |
| `docs` | документация |
| `chore` | рутина без изменения логики |

Тело коммита — **что** и **зачем**, не пересказ diff. Changelog и автоматизация (semantic release) читают `type` и `scope`.

---

## `.gitignore`

**Никогда** в Git:

```gitignore
.env
.env.*
*.pem
*.key
id_rsa
__pycache__/
.venv/
dist/
*.tfstate
.terraform/
```

Инцидент «секрет в Git» — rotation ключей, история коммитов, возможный утечка в fork. На курсе секреты — в **CI variables** ([07-variables-secrets.md](07-variables-secrets.md)). Если случайно закоммитили — не «удалить файл и забыть»: нужен `git filter-repo` / support процесс; проще **ротировать** секрет.

---

## Что триггерит CI

Зависит от `rules` / `only` в `.gitlab-ci.yml` (глава 03). Типично:

| Событие | `CI_PIPELINE_SOURCE` |
|---------|------------------------|
| Push в ветку | `push` |
| Открытие/обновление MR | `merge_request_event` |
| Push tag | `push` + tag rules |
| Schedule | `schedule` |

Push в `feature/*` **может** не запускать тяжёлые jobs — только lint. Push в `main` после merge — полный pipeline. Это экономит runner и ускоряет feedback.

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Push в `main` напрямую | нет review, ломается trunk | MR + protected branch |
| Огромный MR (500 файлов) | review невозможен | дробить задачи |
| Коммит без сообщения смысла | непонятный `git bisect` | Conventional Commits |
| `.env` в репозитории | утечка секретов | `.gitignore` + variables |
| Забыли `git pull` перед работой | конфликты при merge | rebase на актуальный `main` |
| `git add .` без проверки | случайные файлы в commit | `git status`, `git diff --staged` |

---

## Резюме

- Git — источник правды для кода и `.gitlab-ci.yml`; CI привязан к коммитам и событиям.
- **Feature branch → MR → merge** — стандарт безопасной доставки.
- **Trunk-based**: короткие ветки, частый merge, зелёный CI.
- **Conventional Commits** помогают команде и автоматизации.
- Секреты и локальные артефакты — в `.gitignore`, не в истории.

---

## Чек-лист

Ответьте своими словами:

- [ ] Чем branch отличается от tag?
- [ ] Зачем MR, если можно push в `main`?
- [ ] Что обычно триггерит CI — push, MR или оба?
- [ ] Зачем Conventional Commits?
- [ ] Что три файла/паттерна обязательно в `.gitignore` для Python + DevOps?
- [ ] Как короткие ветки связаны с DORA Lead Time?

Следующий урок: [02-gitlab-intro.md](02-gitlab-intro.md).
