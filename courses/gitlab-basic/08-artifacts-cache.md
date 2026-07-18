# 08. Artifacts и cache

## Введение: сценарий с работы

Build job собрал `.whl`, test job в следующем stage: `FileNotFoundError: out/*.whl`. Причина: забыли `artifacts: paths`. Второй кейс: pipeline 25 минут — каждый раз `pip install` с нуля; коллега добавил **cache**, время упало до 8 минут, но после смены `requirements.txt` тесты падают на старых пакетах — **cache key** не учитывает lockfile. Третий: артефакты заняли 40 GB на disk GitLab — не было `expire_in`.

Artifacts и cache решают **разные** задачи; путаница — частая ошибка на собеседованиях и в prod.

## Что вы узнаете

- **Artifacts** — передача файлов между jobs и скачивание из UI.
- **Cache** — ускорение повторных pipeline (best-effort).
- `dependencies`, `needs`, `expire_in`, `reports`.
- Сравнительная таблица artifacts vs cache.
- Типичные антипаттерны.

---

## Artifacts: зачем

**Artifacts** — файлы, которые GitLab **сохраняет** после job и отдаёт:

- следующим jobs в pipeline;
- пользователю через UI (Download).

```yaml
build:
  stage: build
  script:
    - python -m build --wheel
    - mkdir -p out && cp dist/*.whl out/
  artifacts:
    paths:
      - out/
    expire_in: 1 week
```

```yaml
install-wheel:
  stage: test
  dependencies:
    - build
  script:
    - pip install out/*.whl
    - python -c "import app; print(app.hello())"
```

Без `artifacts` каталог `out/` **исчезает** после завершения контейнера job.

---

## Ключи `artifacts`

```yaml
artifacts:
  paths:
    - out/
    - reports/
  exclude:
    - out/temp/
  expire_in: 1 week
  when: on_success          # default; on_failure, always
  name: "$CI_JOB_NAME-$CI_COMMIT_REF_NAME"
  reports:
    junit: report.xml
    coverage_report:
      coverage_format: cobertura
      path: coverage.xml
```

| Ключ | Назначение |
|------|------------|
| `paths` | что сохранить (globs) |
| `expire_in` | TTL (`1 day`, `1 week`, `never`) |
| `when` | при каком статусе job сохранять |
| `reports` | junit, coverage — UI Tests/Coverage |
| `name` | имя zip при скачивании |

### `expire_in` и диск

На busy instance артефакты без TTL заполняют storage. Для учебных `.whl` — `1 day` достаточно. Prod binaries — policy по compliance.

---

## `dependencies` и наследование artifacts

По умолчанию job **скачивает artifacts всех** предыдущих stages (может быть тяжело).

```yaml
install-wheel:
  dependencies:
    - build    # только от job build
```

Job без `dependencies` и без `dependencies: []` — поведение по версии GitLab: уточняйте в docs; явный список — яснее.

### `needs` (DAG, preview)

Параллельные stages с зависимостью job-to-job:

```yaml
test-fast:
  needs: ["build"]
```

Ускоряет pipeline, не ждёт весь stage — [`gitlab-intermediate`](../gitlab-intermediate/README.md).

---

## Cache: ускорение повторных runs

**Cache** — best-effort восстановление каталогов между pipeline **того же project** (часто той же ветки).

```yaml
test:
  cache:
    key: "$CI_COMMIT_REF_SLUG"
    paths:
      - .cache/pip
  script:
    - pip install -r requirements.txt --cache-dir .cache/pip
    - pytest
```

| Параметр | Смысл |
|----------|-------|
| `key` | идентификатор cache; смена key = новый cache |
| `paths` | что архивировать |
| `policy` | `pull`, `push`, `pull-push` |

### Cache key strategies

| Key | Когда |
|-----|-------|
| `$CI_COMMIT_REF_SLUG` | отдельный cache per branch |
| `files: [requirements.txt]` | инвалидция при смене deps |
| фиксированный `pip-global` | общий cache (риск несовместимости) |

Рекомендация:

```yaml
cache:
  key:
    files:
      - requirements-dev.txt
  paths:
    - .cache/pip
```

---

## Artifacts vs Cache

| | **Artifacts** | **Cache** |
|---|---------------|-----------|
| Надёжность | гарантированная передача в pipeline | best-effort, может miss |
| Скачать из UI | да | нет |
| Между pipeline | через artifacts API / expire | да, тот же key |
| Размер лимиты | лимиты instance | лимиты runner/admin |
| Use case | build output, reports | `.cache/pip`, `node_modules` |

**Не кешируйте** как cache то, что нужно **точно** следующему job — используйте **artifacts**.

---

## Reports: JUnit и Coverage

```yaml
unit:
  stage: test
  script:
    - pip install pytest
    - pytest --junitxml=report.xml
  artifacts:
    reports:
      junit: report.xml
    paths:
      - report.xml
    expire_in: 1 week
```

В MR → вкладка **Tests** — failed tests без чтения полного log.

Coverage (Cobertura XML) — виджет coverage в MR (пороги — в настройках).

Связь с quality gates и **Change Failure Rate**: тесты видны reviewer до merge.

---

## Артефакты при падении

```yaml
debug:
  script:
    - ./flaky-test.sh
  artifacts:
    when: on_failure
    paths:
      - logs/
      - screenshots/
    expire_in: 3 days
```

Сохраняете контекст для отладки flaky tests — не на каждый success (экономия места).

---

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| Нет `artifacts.paths` | следующий job не видит файлы | добавить paths |
| Огромный artifact (整个 `node_modules`) | slow upload, disk | только dist/out |
| Cache без key от lockfile | старые deps | `key: files:` |
| Путать cache с artifacts | nondeterministic test | artifacts для build output |
| `expire_in: never` везде | disk full | TTL policy |
| `dependencies` не тот job | missing file | явный список job names |

---

## Резюме

- **Artifacts** — официальная передача результатов build/test между jobs.
- **Cache** — ускоритель; может устареть — проектируйте key.
- **`expire_in`** — hygiene storage.
- **`reports: junit`** — UX для review и DORA quality.
- Явные **`dependencies`** — контроль, что скачивает job.

---

## Чек-лист

- [ ] Artifacts vs cache — в чём разница?
- [ ] Зачем `expire_in`?
- [ ] Когда `reports: junit`?
- [ ] Почему cache key от ветки?
- [ ] Что делает `dependencies: [build]`?
- [ ] Когда `when: on_failure` для artifacts?

Следующий урок: [09-lab-artifacts.md](09-lab-artifacts.md).
