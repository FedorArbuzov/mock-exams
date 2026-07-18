# 04. Лаба: первый pipeline

## Введение: сценарий с работы

Четверг, дедлайн «зелёный CI к 15:00». Вы скопировали `hello-ci`, добавили `.gitlab-ci.yml`, сделали push — в UI **нет pipeline**. Оказывается, файл назвали `gitlab-ci.yaml` (не `.yml`). Исправили — pipeline есть, но оба job **pending** 40 минут: runner offline. После регистрации runner — `lint` green, `unit` red: `ModuleNotFoundError: app`. Путь импорта и `pip install -e .` — тема лабы. Team lead: «Сломай тест намеренно — убедись, что MR блокирует merge».

Практика на [http://localhost:8929](http://localhost:8929) закрепляет главы 01–03.

## Что вы сделаете

- Скопируете [`examples/hello-ci/`](examples/hello-ci/) в GitLab project.
- Напишете `.gitlab-ci.yml` с jobs `lint` и `unit`.
- Откроете **MR** и добьётесь green pipeline.
- Намеренно сломаете тест и почините — увидите failed → passed.

**Время:** ~60–90 минут с учётом ожидания GitLab/runner.

---

## Подготовка

Чек-лист из [00-environment.md](00-environment.md):

| # | Условие |
|---|---------|
| 1 | GitLab на `:8929` healthy |
| 2 | Project `hello-ci` создан (или создадите сейчас) |
| 3 | Runner online, tag `docker` |
| 4 | Git настроен |

Если runner ещё нет — зарегистрируйте по [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md) или отложите до [06-lab-docker-runner.md](06-lab-docker-runner.md), но pipeline не выполнится без runner.

---

## Задание 1. Скопировать demo-приложение

### Вариант A: из mock-exams

```bash
# Windows PowerShell — скопируйте каталог вручную или:
cp -r courses/gitlab-basic/examples/hello-ci/* /path/to/your/hello-ci/
cd /path/to/your/hello-ci
```

### Вариант B: git init + remote

```bash
cd /path/to/your/hello-ci
git init
git remote add origin http://localhost:8929/root/hello-ci.git
```

Структура должна совпадать с [examples/hello-ci/](examples/hello-ci/):

```text
hello-ci/
├── app/__init__.py
├── tests/test_app.py
├── pyproject.toml
└── requirements-dev.txt
```

Локальная проверка (опционально):

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
ruff check app/ tests/
```

---

## Задание 2. Создать `.gitlab-ci.yml`

Создайте файл в **корне** репозитория:

```yaml
stages:
  - test

default:
  image: python:3.12-slim
  tags:
    - docker

lint:
  stage: test
  script:
    - pip install ruff
    - ruff check app/ tests/

unit:
  stage: test
  script:
    - pip install pytest
    - pip install -e .
    - pytest tests/ -v
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

**Заметки:**

- `default.tags: [docker]` — runner курса.
- `pip install -e .` — пакет `app` доступен для pytest (из `pyproject.toml`).
- `rules` на `unit` — тот же паттерн, что в проде: MR + main.

Проверка YAML: **CI/CD → Editor → Validate** (вставьте содержимое до push).

---

## Задание 3. Push и Merge Request

```bash
git checkout -b feature/ci
git add .
git commit -m "feat(ci): add lint and unit test jobs"
git push -u origin feature/ci
```

В GitLab:

1. Появится баннер **Create merge request** — нажмите.
2. Target: `main`, title: как commit.
3. Description: `Closes #1` (если завели issue).

**CI/CD → Pipelines** — pipeline на source branch / MR.

Ожидаемый вид:

```text
Stage: test
  ├── lint   (running → passed)
  └── unit   (running → passed)
```

Jobs в одном stage — **параллельно** (два слота runner или очередь).

---

## Задание 4. Сломать и починить тест

В `tests/test_app.py` временно:

```python
def test_hello():
    assert False, "intentional break for CI demo"
```

```bash
git add tests/test_app.py
git commit -m "test(ci): demonstrate failed pipeline"
git push
```

В MR pipeline станет **failed** (job `unit` red). Откройте **job log** — увидите assertion error.

Исправьте тест обратно, push — pipeline **passed**. Это цикл, который снижает **Change Failure Rate** при обязательном CI перед merge ([`devops-culture`](../devops-culture/03-dora-metrics.md)).

---

## Задание 5 (бонус). Protected branch

**Settings → Repository → Protected branches** — защитите `main`, требуйте success pipeline. Попробуйте `git push origin main` с feature — должно отклониться (если push запрещён).

---

## Критерии успеха

- [ ] Pipeline на MR **зелёный** после финального fix
- [ ] `lint` и `unit` в stage `test` (параллельно на UI)
- [ ] Видели **failed** pipeline после `assert False`
- [ ] Умеете открыть **trace** job и найти ошибку
- [ ] Файл называется именно `.gitlab-ci.yml`

---

## Если что-то пошло не так

| Симптом | Вероятная причина | Действие |
|---------|-------------------|----------|
| Нет pipeline | нет файла / CI off | проверить имя файла, Settings |
| Pending forever | нет runner | [05-runners.md](05-runners.md), register |
| `unsupported tag docker` | runner без tag | добавить tag при регистрации |
| `ruff: not found` | нет pip install | см. YAML выше |
| `No module named 'app'` | нет editable install | `pip install -e .` |
| 403 on push | auth | PAT, пароль root |
| YAML invalid | табы | пробелы, Validate в Editor |

---

## Резюме

Вы прошли полный цикл: **код → YAML → push → MR → pipeline → log**. Это основа ежедневной работы platform/infrastructure engineer.

---

## Чек-лист

- [ ] Где в UI список pipelines для MR?
- [ ] Сколько jobs в stage `test` и как они выполняются?
- [ ] Что изменилось в pipeline после intentional fail?

Следующий урок: [05-runners.md](05-runners.md).
