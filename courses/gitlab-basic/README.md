# GitLab DevOps — Basic

Мега-подробный курс по **Git** и **GitLab CI/CD** для инженеров, которые впервые собирают pipeline «от коммита до зелёного job». **12 уроков** (00–11) + interview cheatsheet. Цель — уверенно работать с MR, `.gitlab-ci.yml`, runners, variables, artifacts и не класть секреты в Git.

> Старт DevOps-маршрута: [`devops-path.md`](../devops-path.md). **Предварительно** — базовый Git (clone, commit, push) и Docker. Дальше — [`gitlab-intermediate`](../gitlab-intermediate/README.md) (registry, build/push, deploy), [`gitlab-advanced`](../gitlab-advanced/README.md) (K8s runner, GitOps). Культура и DORA: [`devops-culture`](../devops-culture/README.md).

**Локальная среда:** GitLab CE в Docker — [`deploy/gitlab`](../../deploy/gitlab/README.md), URL **[http://localhost:8929](http://localhost:8929)**. Пример приложения: [`examples/hello-ci/`](examples/hello-ci/).

```bash
# из корня mock-exams
docker compose -f deploy/gitlab/docker-compose.yml up -d
docker exec mock-gitlab gitlab-ctl status   # дождаться healthy
# пароль root — см. deploy/gitlab/README.md
```

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка. Автор ведёт от **рабочего сценария** (pipeline завис в pending, runner offline, секрет попал в лог, MR без review) к концепциям, YAML, командам и типичным ошибкам — как в [`javascript-basic`](../javascript-basic/README.md) и [`nodejs-basic`](../nodejs-basic/README.md).

1. **Теория** — «Сценарий с работы» → «Что вы узнаете» → подробное содержание → примеры кода → «Типичные ошибки» → «Резюме» → «Чек-лист». Закрепляйте чек-лист **своими словами** до лабы.
2. **Лаба** (главы 04, 06, 09, 10) — hands-on на локальном GitLab `:8929`: push, MR, pipeline, runner. Таблица «если что-то пошло не так» — в конце лабы.
3. После главы 10 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [11-interview-qa.md](11-interview-qa.md) — разбор 20+ вопросов с отсылками к урокам.

**Время:** **~45–60 минут** на пару «теория + лаба» (где есть лаба). Весь курс — **~10–14 часов**; финальный проект (глава 10) — **2–3 часа** отдельно.

## Требования

| Инструмент | Версия / заметка |
|---|---|
| Git | 2.30+ (`git --version`) |
| Docker | Compose v2, **4+ GB RAM** для GitLab CE |
| Текстовый редактор | YAML с подсветкой (ошибка отступа = failed pipeline) |
| ОС | Windows / macOS / Linux — курс проверен на `localhost:8929` |

Kubernetes **не обязателен** на basic. Deploy в кластер — [`kuber-basic`](../kuber-basic/README.md) и [`gitlab-intermediate`](../gitlab-intermediate/README.md).

## Программа (12 уроков, 00–11)

### Фаза 0. Окружение (00)

| # | Урок |
|---|------|
| 00 | [Окружение: GitLab CE, runner, hello-ci](00-environment.md) |

### Фаза 1. Git и GitLab UI (01–02)

| 01 | [Git: ветки, MR, хорошие коммиты](01-git-workflow.md) |
| 02 | [GitLab: проект, issues, Merge Request](02-gitlab-intro.md) |

### Фаза 2. CI/CD основы (03–04)

| 03 | [`.gitlab-ci.yml`: stages, jobs, image](03-gitlab-ci-yaml.md) |
| 04 | [Лаба: первый pipeline](04-lab-first-pipeline.md) |

### Фаза 3. Runners (05–06)

| 05 | [Runners: типы и executors](05-runners.md) |
| 06 | [Лаба: Docker runner](06-lab-docker-runner.md) |

### Фаза 4. Variables, artifacts (07–09)

| 07 | [Variables и masked secrets](07-variables-secrets.md) |
| 08 | [Artifacts и cache](08-artifacts-cache.md) |
| 09 | [Лаба: artifacts между jobs](09-lab-artifacts.md) |

### Фаза 5. Финал и собеседование (10–11)

| 10 | [Финальный проект: CI для demo-приложения](10-final-project.md) |
| 11 | [Interview Q&A: GitLab CI basics](11-interview-qa.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Поднимаете **GitLab CE** на `:8929`, входите как `root`, регистрируете **project runner** с тегом `docker`.
- Создаёте **MR** с осмысленным описанием и **Conventional Commits**; понимаете, что триггерит pipeline.
- Пишете `.gitlab-ci.yml` со stages `test` → `build`, `rules`, `image`, `tags`.
- Диагностируете **pending job** (нет runner / неверный tag) и **failed job** (лог, YAML).
- Храните секреты в **CI variables** (masked/protected), не в Git; знаете про `CI_JOB_TOKEN`.
- Передаёте **artifacts** между jobs, ускоряете pipeline **cache**; отличаете artifacts от cache.
- Связываете CI с **DORA** (deployment frequency, lead time) из [`devops-culture`](../devops-culture/03-dora-metrics.md).

## Связь с другими курсами

| Курс | Связь |
|---|---|
| [`devops-culture`](../devops-culture/README.md) | DORA, культура, зачем CI/CD организации |
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | Docker build, registry, `mockctl` deploy |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | K8s executor, Helm runner |
| [`kuber-basic`](../kuber-basic/README.md) | кластер для deploy (позже) |
| [`secrets-basic`](../secrets-basic/README.md) | Vault в CI вместо только variables |
| [`aws-terraform`](../aws-terraform/README.md) | `terraform plan` в pipeline (intermediate) |

Карта DevOps-треков: [`courses/README.md`](../README.md).
