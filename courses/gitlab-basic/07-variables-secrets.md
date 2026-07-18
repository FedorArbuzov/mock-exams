# 07. Variables и masked secrets

## Введение: сценарий с работы

Пятница, security review. В MR в `.gitlab-ci.yml` появилось:

```yaml
variables:
  AWS_SECRET_ACCESS_KEY: AKIAIOSFODNN7EXAMPLE
```

Pipeline green, но **комплаенс** эскалирует: ключ в Git навсегда. Второй кейс: разработчик добавил masked variable `TOKEN=abc` — в логе всё равно видно значение: длина < 8 символов, masking не сработал. Третий: `set -x` в script печатает `export DB_PASS=...`. Team lead: «Секреты — CI/CD Variables, masked + protected; для ротации позже Vault» ([`secrets-basic`](../secrets-basic/README.md)).

Эта глава — **где** хранить конфиг и **как не утекать** в trace.

## Что вы узнаете

- Уровни variables: project, group, instance.
- Флаги: **mask**, **protect**, **expand**, type **File**.
- Использование в `.gitlab-ci.yml` и predefined vars.
- Почему mask **не 100%** гарантия.
- `CI_JOB_TOKEN` — встроенный короткоживущий доступ.
- Антипаттерн: секреты в Git.

---

## Где задавать variables

| Уровень | Путь в UI | Когда |
|---------|-----------|-------|
| **Project** | Settings → CI/CD → Variables | секреты одного сервиса |
| **Group** | Group → Settings → CI/CD → Variables | общие для команды |
| **Instance** | Admin Area (CE ограничено) | глобальные |

Приоритет при конфликте имён: **project** перекрывает group (см. актуальную доку GitLab — порядок может уточняться по scope).

### Добавление variable

1. **Add variable**
2. Key: `APP_VERSION` (или `DATABASE_URL`)
3. Value: секрет или конфиг
4. Flags: Mask, Protect, Expand

---

## Флаги variables

| Флаг | Эффект |
|------|--------|
| **Mask variable** | значение заменяется `[masked]` в job log, если GitLab может распознать |
| **Protect variable** | доступна только в pipelines на **protected branches/tags** |
| **Expand variable reference** | `$OTHER` внутри value раскрывается |

### Ограничения masking

Masking работает, если:

- значение **≥ 8 символов**;
- одна строка;
- символы из ограниченного набора (base64-подобное).

**Не маскируется:** короткие пароли, значения в base64 с переводами строк, вывод через `set -x`, `echo $VAR` в некоторых shell debug режимах, артефакты и crash dumps.

**Правило:** не печатать секреты в script; не включать `set -x` с секретами в env.

### Protect + unprotected branch

Variable `Protect` + pipeline на feature branch **без** protected flag → variable **недоступна** (пустая или job skip). Это фича: prod secrets только на `main` deploy.

---

## Variables в YAML

### Job-level

```yaml
deploy-staging:
  variables:
    APP_ENV: staging
    LOG_LEVEL: debug
  script:
    - echo "Deploy to $APP_ENV with level $LOG_LEVEL"
```

### Global (все jobs)

```yaml
variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

test:
  script:
    - pip install -r requirements.txt
```

### Переопределение

Job variable **перекрывает** global с тем же ключом.

---

## Predefined variables (выборка)

| Variable | Назначение |
|----------|------------|
| `CI_JOB_TOKEN` | JWT для API/registry от имени job |
| `CI_REGISTRY` | адрес registry |
| `CI_REGISTRY_USER` | `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | часто = job token |
| `CI_COMMIT_REF_NAME` | branch или tag name |
| `CI_ENVIRONMENT_NAME` | environment (intermediate) |

### `CI_JOB_TOKEN`

Короткоживущий токен для:

- clone другого **разрешённого** project;
- push в registry project;
- API calls с ограниченным scope.

Настройка: **Settings → CI/CD → Job token permissions** (ограничивайте в prod).

Пример login в registry (intermediate):

```yaml
before_script:
  - echo "$CI_JOB_TOKEN" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
```

---

## File variables

Type **File** — значение пишется во **временный файл**, путь в переменной:

```yaml
deploy:
  script:
    - kubectl apply --kubeconfig "$KUBECONFIG"
```

В UI variable `KUBECONFIG` (type File) — multiline kubeconfig. В job `$KUBECONFIG=/tmp/CI_BUILD_...`.

Удобно для PEM, kubeconfig, JSON service account — не экранировать в shell.

---

## Секреты: правильно и неправильно

### Неправильно — в Git

```yaml
# ПЛОХО — навсегда в истории
variables:
  AWS_SECRET_ACCESS_KEY: AKIA...
```

Даже после удаления в новом commit — **история** и forks.

### Правильно — CI/CD Variables

| Key | Mask | Protect |
|-----|------|---------|
| `AWS_ACCESS_KEY_ID` | optional | yes |
| `AWS_SECRET_ACCESS_KEY` | yes | yes |
| `APP_VERSION` | no | no |

В YAML только **имя**:

```yaml
build:
  script:
    - echo "Version $APP_VERSION"   # значение из UI, не из repo
```

### Vault (следующий уровень)

Централизованная ротация и audit: [`secrets-basic/08-ci-gitlab-vault`](../secrets-basic/08-ci-gitlab-vault.md), стенд [`deploy/vault`](../../deploy/vault/README.md). Паттерн: job получает секрет в runtime, не хранит в GitLab UI годами.

---

## Environment scope (preview)

Variable только для environment `production`:

```text
Key: DEPLOY_KEY
Environment scope: production
```

Используется с `environment:` в job — [`gitlab-intermediate`](../gitlab-intermediate/README.md).

---

## Связь с DORA и культурой

Утечка секретов → инцидент → **MTTR** растёт, доверие падает ([`devops-culture/11-trust-and-incidents`](../devops-culture/11-trust-and-incidents.md)). **Generative culture** включает blameless postmortem и **процесс** secrets, не «герой вручную ротирует в 3 ночи».

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Секрет в commit | утечка | rotate + variables |
| Короткий masked password | виден в log | длина ≥ 8, не echo |
| `set -x` + export SECRET | leak в trace | убрать -x |
| Protect на prod var, MR pipeline | пустой deploy | отдельные vars per env |
| Commit `.env.example` с real value | утечка | только placeholders |
| Fork public + CI variables | риск на SaaS | private forks policies |

---

## Резюме

- Секреты — **Settings → CI/CD → Variables**, не Git.
- **Mask** + **Protect** — минимум; не замена security review.
- **File** variables — для многострочных creds.
- **`CI_JOB_TOKEN`** — встроенный доступ job к API/registry с ограничениями.
- Для enterprise rotation — Vault и policies.

---

## Чек-лист

- [ ] Masked гарантирует 100% отсутствие в логах? (нет — когда?)
- [ ] Protect variable на unprotected branch — что будет?
- [ ] Зачем `CI_JOB_TOKEN`?
- [ ] Когда type File лучше string?
- [ ] Где НЕ хранить `DATABASE_PASSWORD`?

Следующий урок: [08-artifacts-cache.md](08-artifacts-cache.md).
