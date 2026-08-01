# 09. Лаба: мини-CLI

## Цель

Собрать **один модуль** с пакетом `store` и `cmd/tasks`: добавление задачи, список, сохранение в JSON. Это мост к `go-intermediate`, где тот же домен «tasks» уйдёт в HTTP и Postgres.

**Время:** ~1.5 часа.

## Предварительно

```bash
cd courses/go-basic/examples
```

Пройдены уроки 00–08.

## Структура

```text
examples/
├── go.mod
├── cmd/tasks/main.go
├── internal/store/
│   ├── store.go
│   └── store_test.go
└── data/tasks.json      # создаётся при первом save
```

## Модель

```go
type Task struct {
    ID        string    `json:"id"`
    Title     string    `json:"title"`
    Done      bool      `json:"done"`
    CreatedAt time.Time `json:"created_at"`
}
```

## Store (интерфейс поведения)

Методы (минимум):

- `Add(title string) (Task, error)` — валидация: title не пустой, ≤ 200 символов
- `List() []Task`
- `MarkDone(id string) error`
- `Load() error` / `Save() error` — JSON-файл `data/tasks.json`

ID — `fmt.Sprintf("%d", time.Now().UnixNano())` или счётчик — не важно, главное уникальность в рамках файла.

## CLI (flag)

Без cobra — стандартный `flag`:

```bash
go run ./cmd/tasks -add "Buy milk"
go run ./cmd/tasks -list
go run ./cmd/tasks -done <id>
```

Флаги: `-add`, `-list`, `-done`. При ошибке — сообщение в stderr, `os.Exit(1)`.

## Тесты

В `store_test.go` — table-driven:

- добавление валидной задачи;
- пустой title → error;
- `MarkDone` на несуществующий id → error.

```bash
go test ./...
go vet ./...
```

## Критерии успеха

- [ ] `go run ./cmd/tasks -add "test"` и `-list` показывают задачу
- [ ] После перезапуска данные читаются из `data/tasks.json`
- [ ] Тесты и `go vet` проходят
- [ ] `main` тонкий: логика в `internal/store`

## Если застряли

| Симптом | Проверка |
|---------|----------|
| `cannot find package` | `go mod` в `examples/`, импорт с полным путём модуля |
| Пустой JSON после save | `json.Marshal` среза, права на `data/` |
| Тесты пишут в прод-файл | В тесте используйте `t.TempDir()` и путь к temp-файлу |

Эталон — `examples/solutions/` (если есть) — **после** своей попытки.

Дальше: [10. Что дальше](10-next-steps.md).
