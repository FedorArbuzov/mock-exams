# 26. Пакеты: main, lib, exported names

## package — единица компиляции

Каждый файл `.go` начинается с `package <имя>`. Все файлы одной директории — **один** package (кроме `_test.go` с `package xxx_test`).

```go
// file: greeter.go
package greet

import "fmt"

func Hello(name string) string {
    return fmt.Sprintf("Hello, %s", name)
}
```

Импорт:

```go
import "github.com/mock-exams/go-basic-labs/greet"

greet.Hello("World")
```

| Правило | Деталь |
|---------|--------|
| Имя package | Обычно последний сегмент пути импорта |
| `main` | Точка входа с `func main()` |
| Циклы импорта | Запрещены компилятором |

## package main vs библиотека

```go
// cmd/hello/main.go
package main

import (
    "fmt"
    "github.com/mock-exams/go-basic-labs/greet"
)

func main() {
    fmt.Println(greet.Hello("shop"))
}
```

| `package main` | Библиотека (`package store`) |
|----------------|------------------------------|
| Собирается в бинарник | Собирается как зависимость |
| Нельзя импортировать | `import` из других пакетов |
| `func main()` обязателен | `main` не нужен |

**cmd/** layout (стандарт индустрии):

```text
project/
├── cmd/
│   └── shop/
│       └── main.go      # package main — тонкий слой
├── internal/
│   └── catalog/
│       └── product.go   # package catalog
└── go.mod
```

`main` только **склеивает** зависимости: флаги, конфиг, запуск сервера. Бизнес-логика — в importable пакетах.

## Exported names — видимость по регистру

Идентификатор **экспортирован**, если начинается с **заглавной** буквы:

```go
package catalog

type Product struct {   // экспорт
    ID    int          // экспорт
    name  string        // приватно внутри пакета
}

func List() []Product { ... }   // экспорт
func normalize(s string) string { ... } // приватно
```

Из другого пакета:

```go
p := catalog.Product{ID: 1} // OK
// p.name — ошибка компиляции
```

**Нет** `public`/`private` ключевых слов — только первая буква.

## Именование пакетов

- **Короткое**, строчное, **без** `underscore` (`catalog`, не `catalog_utils`).
- Имя пакета **не повторяет** типы без нужды: `catalog.Product`, не `catalog.CatalogProduct`.
- Избегайте `util`, `common`, `helpers` — мусорные свалки.

```go
import (
    "fmt"
    myfmt "example.com/lib/fmt" // alias при конфликте со std
)
```

## Структура каталогов (basic → intermediate)

**Плохо для роста:**

```text
shop/
└── main.go   // всё в одном файле
```

**Хорошо:**

```text
shop/
├── cmd/shop/main.go
├── internal/
│   ├── api/
│   ├── domain/
│   └── store/
└── pkg/          // опционально: публичная lib для других модулей
    └── client/
```

- **`internal/`** — код, который **нельзя** импортировать извне дерева родительского `internal` (enforced компилятором).
- **`pkg/`** — исторически «публичные» библиотеки; в новых проектах часто без `pkg`, просто корневые пакеты.

## internal/ — жёсткая инкапсуляция

```text
github.com/acme/shop/
├── internal/
│   └── auth/
│       └── jwt.go
└── cmd/shop/main.go
```

Внешний модуль **не может**:

```go
import "github.com/acme/shop/internal/auth" // compile error
```

Только код **внутри** `github.com/acme/shop/...` может импортировать `internal/auth`.

Зачем: защита от coupling к деталям реализации; свобода рефакторинга.

## init() — осторожно

```go
func init() {
    // регистрация драйвера, флаги, глобальные таблицы
}
```

`init` вызывается при импорте пакета, **до** `main`. Порядок — по зависимостям импорта.

| Допустимо | Избегать |
|-----------|----------|
| `database/sql` register driver | тяжёлая работа, I/O |
| template glob | скрытые side effects |

Предпочитайте **явный** `New()` / `Setup()` в `main`.

## Документация пакета

```go
// Package catalog provides product types for the shop domain.
package catalog
```

Комментарий **перед** `package` — для `go doc` и pkg.go.dev. Экспортированные символы — комментарий сразу над объявлением:

```go
// Product represents an item in the catalog.
type Product struct { ... }
```

## Тесты и package name

Файл `catalog_test.go`:

```go
package catalog_test  // external test — только публичный API

import "github.com/acme/shop/catalog"

func TestList(t *testing.T) {
    _ = catalog.List()
}
```

Или `package catalog` — **white-box** тесты приватных функций.

## Циклические зависимости

```text
api → store → api   // ОШИБКА компиляции
```

Лечение: вынести **interfaces** и типы в `domain`, зависимости направить в одну сторону:

```text
api → domain ← store
```

## Типичные ошибки

- **Всё в `main`** — нет переиспользования и нормальных тестов.
- **Экспорт всего подряд** — «публичный» API раздувается.
- **Пакет `utils`** — непонятные границы.
- **Имя пакета `models` на 200 типов** — разбить по домену.
- **Импорт internal из другого модуля** — ожидание «обойти» через alias (не сработает).
- **Цикл пакетов** — лечить выносом domain, не `interface{}`.

## Чек-лист

- Чем `package main` отличается от `package catalog`?
- Как сделать поле struct приватным для других пакетов?
- Зачем каталог `internal/`?
- Где должна жить `func main()` в production layout?
- Почему `package catalog_test` полезен для black-box тестов?
- Что запрещает компилятор при циклическом import?

Следующий урок: [27. Модули и go mod](27-modules.md).
