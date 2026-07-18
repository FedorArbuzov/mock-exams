# 28. Тестирование: testing, table-driven, t.Run

## Пакет testing

Тесты в файлах `*_test.go`, функции `func TestXxx(t *testing.T)`.

```go
// catalog/product_test.go
package catalog

import "testing"

func TestProductLineTotal(t *testing.T) {
    p := Product{Price: 10, Qty: 3}
    got := p.LineTotal()
    want := 30.0
    if got != want {
        t.Fatalf("LineTotal() = %v, want %v", got, want)
    }
}
```

Запуск:

```bash
go test ./...
go test -v ./internal/catalog/   # verbose
go test -run TestProduct ./...  # фильтр по имени
go test -count=1 ./...          # без кэша
```

| Флаг | Назначение |
|------|------------|
| `-v` | логи проходящих тестов |
| `-run Regexp` | подмножество тестов |
| `-race` | race detector |
| `-cover` | покрытие |
| `-short` | пропуск долгих тестов |

## Структура теста: arrange / act / assert

```go
func TestParseUserID_Valid(t *testing.T) {
    // arrange
    input := "42"
    // act
    id, err := ParseUserID(input)
    // assert
    if err != nil {
        t.Fatalf("unexpected err: %v", err)
    }
    if id != 42 {
        t.Errorf("id = %d, want 42", id)
    }
}
```

| Метод | Когда |
|-------|-------|
| `t.Error` / `t.Errorf` | тест продолжается, помечен failed |
| `t.Fatal` / `t.Fatalf` | **немедленный** stop теста |

После `Fatal` не пишите код, который полагается на успех — он не выполнится.

## Table-driven tests — идиома Go

Один тест — **таблица** кейсов:

```go
func TestParseUserID(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantID  int
        wantErr bool
    }{
        {"valid", "42", 42, false},
        {"empty", "", 0, true},
        {"negative", "-1", 0, true},
        {"letters", "abc", 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            id, err := ParseUserID(tt.input)
            if (err != nil) != tt.wantErr {
                t.Fatalf("err = %v, wantErr %v", err, tt.wantErr)
            }
            if !tt.wantErr && id != tt.wantID {
                t.Errorf("id = %d, want %d", id, tt.wantID)
            }
        })
    }
}
```

Плюсы:

- новый кейс — **одна строка** в слайсе;
- имя подтеста в выводе CI;
- параллельность: `t.Parallel()` внутри `t.Run`.

**Обязательно** поле `name` — при падении видно `TestParseUserID/negative`, не строку 47.

## t.Run и подтесты

```go
func TestCart(t *testing.T) {
    t.Run("add single", func(t *testing.T) { ... })
    t.Run("add duplicate merges qty", func(t *testing.T) { ... })
}
```

Вложенные `t.Run` — группировка. `go test -run TestCart/add` — только подтест.

### t.Parallel

```go
for _, tt := range tests {
    tt := tt // Go < 1.22: захват копии
    t.Run(tt.name, func(t *testing.T) {
        t.Parallel()
        // ...
    })
}
```

Go 1.22+ в цикле `for _, tt := range` создаёт новую `tt` на итерацию — shadowing не нужен.

Не параллельте тесты с **общим** mutable global без sync.

## Тестирование ошибок

```go
func TestLoadUser_NotFound(t *testing.T) {
    _, err := LoadUser(999)
    if !errors.Is(err, ErrNotFound) {
        t.Fatalf("got %v, want ErrNotFound", err)
    }
}
```

Не сравнивайте `err.Error()` со строкой, если есть sentinel.

## package xxx vs package xxx_test

```go
// white-box — доступ к приватным
package catalog

func Test_normalize(t *testing.T) {
    if normalize("  A ") != "a" { ... }
}
```

```go
// black-box — только публичный API
package catalog_test

import "github.com/acme/shop/catalog"

func TestList(t *testing.T) {
    _, err := catalog.List()
    ...
}
```

На ревью чаще хвалят **black-box** — тесты как у потребителя пакета.

## Benchmarks (обзор)

```go
func BenchmarkLineTotal(b *testing.B) {
    p := Product{Price: 1, Qty: 1}
    for i := 0; i < b.N; i++ {
        p.LineTotal()
    }
}
```

```bash
go test -bench=. -benchmem ./...
```

## testify — кратко

```bash
go get github.com/stretchr/testify@v1.9.0
```

```go
import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestHello(t *testing.T) {
    require.NoError(t, err)           // как t.Fatal
    assert.Equal(t, 42, id)           // как t.Errorf
    assert.True(t, errors.Is(err, ErrNotFound))
}
```

| | std `testing` | testify |
|---|---------------|---------|
| Зависимость | нет | внешняя |
| Стиль | явные if | assert/require |
| На собесах | обязательно | «знаем, используем в проекте» |

**На basic** уметь **без** testify; в команде — часто testify для читаемости.

## httptest (задел)

```go
req := httptest.NewRequest("GET", "/items/1", nil)
rec := httptest.NewRecorder()
handler.ServeHTTP(rec, req)
```

## Покрытие

```bash
go test -cover ./...
go test -coverprofile=cover.out ./...
go tool cover -html=cover.out
```

100% cover ≠ 100% качество; цель — **критичные** ветки и ошибки.

## -race в CI

```bash
go test -race ./...
```

Обязательно для кода с goroutines. На basic — привычка с первого MR.

## Типичные ошибки

- **Один гигантский тест** без таблицы — нечитаемый diff в CI.
- **Нет `name` в table** — неясно, что упало.
- **Забыли `tt := tt`** на старых Go в parallel loop.
- **Тест приватной логики** вместо поведения API пакета.
- **Зависимость от порядка** тестов и глобального state.
- **Нет `-race`** при shared memory.

## Чек-лист

- Как назвать файл и функцию теста?
- Зачем table-driven в Go?
- Чем `t.Fatal` отличается от `t.Error`?
- Зачем `t.Run("name", ...)`?
- Как проверить `ErrNotFound` в тесте?
- Что даёт `go test -race`?

Следующий урок: [29. Лаба: тестирование](29-lab-testing.md).
