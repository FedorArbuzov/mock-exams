# 09. Лаба: artifacts между jobs

## Введение: сценарий с работы

Release engineer: «Build job публикует wheel, QA job ставит его pip install — без ручного копирования». Вы добавляете `package` в stage `build` и `install-wheel` в `test`, но забыли `stages:` порядок — `test` выполнился **до** `build` (если перепутали порядок в списке stages). Второй раз: `install-wheel` скачал artifacts **всех** jobs включая огромный log — указали `dependencies: [package]`. Третий: второй pipeline на той же ветке — **cache pip** сократил время с 4 мин до 90 сек.

Лаба реализует паттерн **build once, test consume** — основа release pipeline.

## Что вы сделаете

- Job `package` с wheel **artifacts**.
- Job `install-wheel` с `dependencies`.
- Общий **pip cache** на два job.
- (Бонус) JUnit report в MR Tests tab.

**Время:** ~60–90 минут.

---

## Подготовка

- Project `hello-ci` на `:8929`, runner online.
- Базовый pipeline из [04-lab-first-pipeline.md](04-lab-first-pipeline.md).
- Файл `pyproject.toml` с поддержкой build (в `examples/hello-ci` уже есть).

---

## Задание 1. Stages build → test

Обновите начало `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test

default:
  image: python:3.12-slim
  tags:
    - docker
  cache:
    key:
      files:
        - requirements-dev.txt
    paths:
      - .cache/pip
```

Порядок в `stages` **определяет** последовательность: сначала все jobs `build`, потом `test`.

---

## Задание 2. Build job с artifacts

```yaml
package:
  stage: build
  script:
    - pip install build --cache-dir .cache/pip
    - python -m build --wheel
    - mkdir -p out && cp dist/*.whl out/
    - ls -la out/
  artifacts:
    paths:
      - out/
    expire_in: 1 day
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Проверка локально (опционально):

```bash
pip install build
python -m build --wheel
ls dist/
```

---

## Задание 3. Consume job

```yaml
install-wheel:
  stage: test
  dependencies:
    - package
  script:
    - pip install out/*.whl --cache-dir .cache/pip
    - python -c "from app import hello; print(hello())"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Сохраните существующие `lint` и `unit` в stage `test` — они пойдут **параллельно** с `install-wheel` после успешного `package`.

Ожидаемый граф:

```text
build:  [package]
           ↓
test:   [lint] [unit] [install-wheel]
```

---

## Задание 4. Проверка в UI

```bash
git checkout -b lab/artifacts
git add .gitlab-ci.yml
git commit -m "ci(artifacts): package wheel and install in downstream job"
git push -u origin lab/artifacts
```

MR → pipeline:

1. Job `package` — **passed**, в job sidebar **Job artifacts** → Browse/Download `out/*.whl`.
2. Job `install-wheel` — вывод `hello()` из приложения.
3. **Pipeline → Download artifacts** — zip всех artifacts pipeline.

Если `install-wheel` failed `No matching distribution`:

- `package` не создал whl (смотрите log `package`);
- неверный `dependencies`;
- `out/` не в artifacts paths.

---

## Задание 5. Cache pip

Запустите pipeline **дважды** на одной ветке (пустой commit или Retry):

```bash
git commit --allow-empty -m "ci: retry for cache demo"
git push
```

Сравните время job `package` / `unit` — этап `pip install` должен быть быстрее при cache hit (в log: `Checking cache for ... successfully extracted`).

Если cache miss каждый раз:

- разные runners без shared cache;
- сменился `requirements-dev.txt` (key изменился);
- на учебном single runner обычно работает.

---

## Задание 6 (бонус). JUnit report

В job `unit`:

```yaml
unit:
  stage: test
  script:
    - pip install pytest --cache-dir .cache/pip
    - pip install -e . --cache-dir .cache/pip
    - pytest tests/ -v --junitxml=report.xml
  artifacts:
    reports:
      junit: report.xml
    paths:
      - report.xml
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

MR → **Tests** — список test cases. Сломайте тест — увидите failed test в UI без grep log.

---

## Критерии успеха

- [ ] `install-wheel` видит `.whl` из `package`
- [ ] Artifacts скачиваются из UI pipeline
- [ ] Cache ускоряет повторный run (субъективно или по log)
- [ ] Stages: `build` перед `test`
- [ ] (Бонус) Tests tab в MR

---

## Если что-то пошло не так

| Симптом | Причина | Действие |
|---------|---------|----------|
| `test` before `build` | порядок `stages` | `build` первым |
| Empty `out/` | build failed | log `python -m build` |
| install can't find whl | нет artifacts | paths, job name |
| Скачались лишние файлы | default dependencies | `dependencies: [package]` |
| Tests tab пустой | нет `reports: junit` | бонус задание |
| Cache always miss | key/files | проверить requirements path |

---

## Резюме

Вы собрали **мини-release pipeline**: артефакт сборки → потребление в test. Так же передают docker images (intermediate), terraform plans, coverage reports.

---

## Чек-лист

- [ ] Почему `package` в отдельном stage?
- [ ] Что было бы без `dependencies`?
- [ ] Artifacts vs cache в этой лабе — что куда?

Следующий урок: [10-final-project.md](10-final-project.md).
