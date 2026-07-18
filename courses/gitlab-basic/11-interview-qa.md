# 11. Interview Q&A: GitLab CI basics

## Введение

Вопросы на **Junior/Middle DevOps** и backend с CI: не «что такое Git», а pending runner, `rules`, утечка секретов, artifacts vs cache. Сначала ответьте **вслух 1–2 минуты**, затем сверьтесь с разбором. Шпаргалка без спойлеров: [interview-cheatsheet.md](interview-cheatsheet.md).

---

## Блок 1. Git и workflow

### 1. Зачем Merge Request, если разработчик один?

**Ответ.** MR — не только review чужого кода: это **точка запуска CI** на ветке, история обсуждений, связь с issue (`Closes #N`), audit trail. Protected `main` + MR снижает риск сломать trunk и улучшает **Change Failure Rate** (DORA). Даже solo — дисциплина «ветка → MR → merge» готовит к команде.

**Где в курсе:** [01-git-workflow.md](01-git-workflow.md), [02-gitlab-intro.md](02-gitlab-intro.md).

---

### 2. Что триггерит pipeline в GitLab — push, MR или оба?

**Ответ.** Зависит от **`rules`** / `only` в `.gitlab-ci.yml`. Типично: `merge_request_event` для MR pipelines и отдельные rules для push в `main`. Push в feature без matching rules — pipeline может не создаться или создаться с подмножеством jobs. Переменная `CI_PIPELINE_SOURCE` различает `push`, `merge_request_event`, `schedule`, `web` и др.

**Где в курсе:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

### 3. Чем branch отличается от tag?

**Ответ.** **Branch** движется с новыми коммитами (`main`, `feature/x`). **Tag** — неподвижный указатель на commit, обычно релиз (`v1.0.0`). CI на tag настраивают отдельными `rules` для release/deploy jobs.

**Где в курсе:** [01-git-workflow.md](01-git-workflow.md).

---

## Блок 2. Pipeline и YAML

### 4. Из чего состоит pipeline в GitLab?

**Ответ.** Файл `.gitlab-ci.yml` → **pipeline** → упорядоченные **stages** → **jobs**. Jobs одного stage выполняются **параллельно** (при наличии runners); следующий stage — после успеха предыдущего (если нет `allow_failure` / `needs`). Runner выполняет `script` в среде executor (docker image).

**Где в курсе:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

### 5. Зачем `image` в job?

**Ответ.** При **docker executor** runner запускает контейнер из `image` и выполняет script внутри. Без `image` — default образ runner (часто `alpine` без Python/Node). `image` даёт воспроизводимую среду CI, близкую к prod.

**Где в курсе:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md), [05-runners.md](05-runners.md).

---

### 6. `rules` vs `only`/`except`?

**Ответ.** **`rules`** — современный декларативный способ: job попадает в pipeline, если хотя бы одно rule true; иначе job **не создаётся**. `only`/`except` — legacy, сложнее комбинировать. Новые проекты — `rules`.

**Где в курсе:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

### 7. Почему job может отсутствовать в pipeline (не skipped)?

**Ответ.** Ни одно **`rules`** не сработало — GitLab не создаёт job. Отличие от **skipped** (manual) или **failed**. Проверяют `CI_PIPELINE_SOURCE`, branch, `changes:`.

**Где в курсе:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

## Блок 3. Runners

### 8. Чем GitLab Server отличается от Runner?

**Ответ.** **Server** (CE/EE) — Git, UI, планирование CI, хранение артефактов. **Runner** — агент, который **забирает** jobs и выполняет команды. Server без runner — pipelines в **pending**. Масштабирование выполнения — добавление runners.

**Где в курсе:** [05-runners.md](05-runners.md), [00-environment.md](00-environment.md).

---

### 9. Почему job висит в pending?

**Ответ.** Три частые причины: (1) **нет online runner**; (2) **tags** job не совпадают с runner; (3) **очередь** — `concurrent` исчерпан. Реже — runner не может связаться с GitLab (неверный URL).

**Где в курсе:** [05-runners.md](05-runners.md), [06-lab-docker-runner.md](06-lab-docker-runner.md).

---

### 10. Docker vs shell executor?

**Ответ.** **Docker** — каждый job в контейнере, чистая FS, любой `image`; нужен Docker, риски socket. **Shell** — команды на VM runner напрямую, быстрее старт, **нет изоляции**, «грязное» окружение. Prod CI чаще docker/k8s.

**Где в курсе:** [05-runners.md](05-runners.md).

---

### 11. Зачем tags у runner и job?

**Ответ.** **Маршрутизация**: job с `tags: [docker]` выполняется только runner с tag `docker`. Разделение amd64/arm, gpu, on-prem vs cloud. Опечатка в tag — вечный pending.

**Где в курсе:** [05-runners.md](05-runners.md).

---

## Блок 4. Variables и безопасность

### 12. Где хранить секреты для CI?

**Ответ.** **Settings → CI/CD → Variables** (project/group), флаги **Mask** и **Protect**. Не в `.gitlab-ci.yml`, не в Git. Для ротации и audit — Vault ([`secrets-basic`](../secrets-basic/README.md)). File type — для kubeconfig/PEM.

**Где в курсе:** [07-variables-secrets.md](07-variables-secrets.md).

---

### 13. Masked variable — гарантия, что секрет не попадёт в log?

**Ответ.** **Нет 100% гарантии.** Mask работает при длине ≥ 8, одной строке, подходящих символах. Утечки: `set -x`, echo, короткие значения, артефакты. Не печатать секреты; ротировать при утечке в Git.

**Где в курсе:** [07-variables-secrets.md](07-variables-secrets.md).

---

### 14. Зачем `CI_JOB_TOKEN`?

**Ответ.** Короткоживущий токен job для доступа к GitLab API/registry от имени pipeline: clone другого project (с permissions), `docker login` в project registry. Ограничивать scope в **Job token permissions**.

**Где в курсе:** [07-variables-secrets.md](07-variables-secrets.md).

---

## Блок 5. Artifacts и cache

### 15. Artifacts vs cache?

**Ответ.** **Artifacts** — надёжная передача файлов **между jobs** и скачивание из UI; `paths`, `expire_in`, `reports`. **Cache** — best-effort ускорение **повторных** pipeline (pip, node_modules); может miss или устареть. Build output → artifacts; зависимости → cache.

**Где в курсе:** [08-artifacts-cache.md](08-artifacts-cache.md).

---

### 16. Зачем `dependencies` в job?

**Ответ.** Указывает, **artifacts каких jobs** скачивать. По умолчанию job может тянуть artifacts всех предыдущих stages — тяжело. `dependencies: [build]` — только от `build`.

**Где в курсе:** [08-artifacts-cache.md](08-artifacts-cache.md), [09-lab-artifacts.md](09-lab-artifacts.md).

---

### 17. Зачем `expire_in` у artifacts?

**Ответ.** TTL на storage GitLab — wheel, логи, отчёты не копятся вечно. Compliance и стоимость диска. `never` — только когда нужно по policy.

**Где в курсе:** [08-artifacts-cache.md](08-artifacts-cache.md).

---

## Блок 6. Практика и DORA

### 18. Pipeline failed на MR — merge разрешён. Это норма?

**Ответ.** Зависит от **protected branch** настроек: «Pipelines must succeed». Без этого — merge возможен (плохая практика). Цель — **quality gate**: красный CI блокирует merge в `main`, снижая **Change Failure Rate**.

**Где в курсе:** [02-gitlab-intro.md](02-gitlab-intro.md), [`devops-culture`](../devops-culture/03-dora-metrics.md).

---

### 19. Как CI связан с DORA metrics?

**Ответ.** Автоматические тесты в MR → меньше дефектов в prod (**CFR**). Быстрый green pipeline → короче **Lead Time**. Частые маленькие MR + deploy → **Deployment Frequency**. Хорошие логи/артефакты → **MTTR**. CI — технический enabler capabilities из Accelerate.

**Где в курсе:** [README.md](README.md), [`devops-culture/03-dora-metrics`](../devops-culture/03-dora-metrics.md).

---

### 20. Опишите минимальный pipeline для Python-сервиса.

**Ответ.** Stages `test` → `build`. Jobs: `lint` (ruff), `unit` (pytest) параллельно в `test`; `package` (wheel) в `build` с artifacts. `image: python:3.12-slim`, `tags: [docker]`, `rules` для MR и `main`, pip **cache**, секреты в variables, runner online.

**Где в курсе:** [04-lab-first-pipeline.md](04-lab-first-pipeline.md), [10-final-project.md](10-final-project.md).

---

### 21. Секрет попал в `.gitlab-ci.yml` в Git. Ваши шаги?

**Ответ.** (1) **Ротировать** секрет немедленно — считать скомпрометированным. (2) Удалить из файла, хранить в CI variables. (3) Очистить историю Git (`git filter-repo`) или процесс security — не «просто новый commit». (4) Postmortem без blame ([`devops-culture`](../devops-culture/11-trust-and-incidents.md)). (5) Pre-commit/gitleaks в CI позже.

**Где в курсе:** [07-variables-secrets.md](07-variables-secrets.md).

---

### 22. Что такое `services` в job?

**Ответ.** Sidecar контейнеры рядом с job (docker executor): Postgres, Redis. DNS имя — **`alias`** (например `db`). Job подключается к `host: db`. Для integration tests без внешней БД.

**Где в курсе:** [06-lab-docker-runner.md](06-lab-docker-runner.md).

---

### 23. Локальный GitLab CE на :8929 — зачем в обучении?

**Ответ.** Полный цикл Git + CI + runner + registry **без облака**; те же концепты, что EE/SaaS. Стенд mock-exams: [`deploy/gitlab`](../../deploy/gitlab/README.md). Переносимость навыков на корпоративный instance.

**Где в курсе:** [00-environment.md](00-environment.md).

---

### 24. Что дальше после gitlab-basic?

**Ответ.** [`gitlab-intermediate`](../gitlab-intermediate/README.md) — docker build/push в registry `:8929`, environments, deploy. [`kuber-basic`](../kuber-basic/README.md) — кластер. [`gitlab-advanced`](../gitlab-advanced/README.md) — K8s executor, GitOps.

**Где в курсе:** [10-final-project.md](10-final-project.md), [README.md](README.md).

---

### 25. `before_script` vs `script` vs `after_script`?

**Ответ.** **`before_script`** — подготовка (install deps), наследуется из `default`. **`script`** — основные команды; exit ≠ 0 → job failed. **`after_script`** — выполняется **всегда** (даже при fail), cleanup, уведомления; отдельный shell context.

**Где в курсе:** [03-gitlab-ci-yaml.md](03-gitlab-ci-yaml.md).

---

## Как готовиться

1. Пройдите [interview-cheatsheet.md](interview-cheatsheet.md) закрытыми карточками.
2. На каждый вопрос — **мини-история с работы** (pending runner, secret in git).
3. Нарисуйте на доске: push → pipeline → runner → artifacts.
4. Свяжите ответ с **одной DORA-метрикой**.

**gitlab-basic interview block завершён.**
