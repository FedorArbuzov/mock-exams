# 25. errors.Is, errors.As и sentinel-ошибки

## Проблема: == на обёрнутых ошибках

```go
var ErrNotFound = errors.New("not found")

func repoFind(id int) error {
    return fmt.Errorf("postgres query: %w", ErrNotFound)
}

func handler() {
    err := repoFind(42)
    fmt.Println(err == ErrNotFound)        // false
    fmt.Println(errors.Is(err, ErrNotFound)) // true
}
```

`==` сравнивает **верхний** уровень interface value. `Is` обходит цепочку через `Unwrap()`.

## errors.Is

```go
func Is(err, target error) bool
```

Возвращает `true`, если `err == target` **или** любой уровень unwrap совпадает с `target`.

```go
if errors.Is(err, os.ErrNotExist) {
    // файл не найден — дефолтный конфиг
}
if errors.Is(err, context.Canceled) {
    // клиент отменил запрос
}
if errors.Is(err, ErrNotFound) {
    // 404 в HTTP handler
}
```

### Sentinel errors

**Sentinel** — пакетная переменная `var ErrX = errors.New(...)`:

```go
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrConflict     = errors.New("conflict")
)
```

| Плюсы sentinel | Минусы |
|----------------|--------|
| Стабильная идентичность для `Is` | Нельзя добавить поля |
| Документированный контракт | Путаница при export из many packages |
| Нулевая аллокация | Плохо для «1000 видов» ошибок |

**Не** сравнивайте sentinel со строками сообщений.

### Когда sentinel, когда тип

| Sentinel `ErrNotFound` | Тип `*ValidationError` |
|------------------------|-------------------------|
| Один фиксированный смысл | Нужны поля (field, code) |
| 404, EOF, canceled | 400 с деталями валидации |
| `errors.Is` | `errors.As` |

## errors.As

```go
func As(err error, target any) bool
```

Находит в цепочке ошибку, **присваиваемую** в `target` (указатель на переменную нужного типа):

```go
type ValidationError struct {
    Field string
}

func (e *ValidationError) Error() string {
    return "validation: " + e.Field
}

func handle(err error) {
    var ve *ValidationError
    if errors.As(err, &ve) {
        fmt.Printf("bad field %s\n", ve.Field)
        return
    }
    // общая обработка
}
```

**Важно:** второй аргумент — **указатель на указатель** для pointer types:

```go
var ve *ValidationError
errors.As(err, &ve) // OK
```

Для value type (редко):

```go
var pe os.PathError
if errors.As(err, &pe) { ... }
```

## Unwrap и цепочка

```go
err := fmt.Errorf("layer2: %w", fmt.Errorf("layer1: %w", ErrNotFound))
errors.Unwrap(err)           // layer1: ...
errors.Is(err, ErrNotFound)  // true
```

Кастомный тип может реализовать `Unwrap() error`:

```go
type OpError struct {
    Op  string
    Err error
}

func (e *OpError) Error() string {
    return e.Op + ": " + e.Err.Error()
}

func (e *OpError) Unwrap() error {
    return e.Err
}
```

Паттерн из стандартной библиотеки (`fmt.wrapError`, `os.PathError`).

## errors.Join (Go 1.20+)

Несколько ошибок в одной:

```go
err := errors.Join(err1, err2)
errors.Is(err, err1) // true
```

Полезно при закрытии нескольких ресурсов; на basic — знать, что существует.

## HTTP-маппинг (задел)

Таблица для будущего API:

| Проверка | HTTP |
|----------|------|
| `errors.Is(err, ErrNotFound)` | 404 |
| `errors.As(err, &ve)` | 400 |
| иначе | 500 |

```go
func writeError(w http.ResponseWriter, err error) {
    var ve *ValidationError
    switch {
    case errors.Is(err, ErrNotFound):
        http.Error(w, "not found", http.StatusNotFound)
    case errors.As(err, &ve):
        http.Error(w, ve.Error(), http.StatusBadRequest)
    default:
        slog.Error("request failed", "err", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
    }
}
```

## Антипаттерны

```go
// плохо — хрупко
if strings.Contains(err.Error(), "not found") { ... }

// плохо — ломается при i18n сообщений
if err.Error() == "not found" { ... }

// плохо — == на обёртке
if err == ErrNotFound { ... }

// хорошо
if errors.Is(err, ErrNotFound) { ... }
```

## Тестирование ошибок

```go
func TestFindUser_NotFound(t *testing.T) {
    _, err := FindUser(999)
    if !errors.Is(err, ErrNotFound) {
        t.Fatalf("want ErrNotFound, got %v", err)
    }
}

func TestParseID_Validation(t *testing.T) {
    _, err := ParseUserID("")
    var ve *ValidationError
    if !errors.As(err, &ve) {
        t.Fatalf("want ValidationError, got %T", err)
    }
}
```

## Пакетная граница sentinel

Экспортируйте sentinel из **одного** доменного пакета:

```go
// domain/errors.go
package domain

var ErrNotFound = errors.New("not found")
```

Потребители: `errors.Is(err, domain.ErrNotFound)`. Не дублируйте `ErrNotFound` в `http` и `repo` с разными `errors.New` — `Is` не сработает между ними.

## Типичные ошибки

- **`==` вместо `Is`** после `%w`.
- **`As` без указателя** — `errors.As(err, ve)` вместо `&ve`.
- **Новый sentinel на каждый вызов** — `errors.New` внутри функции вместо пакетной переменной.
- **Сравнение текста** `err.Error()`.
- **Возврат typed nil** `*ValidationError` как `error`.
- **Два разных `ErrNotFound`** в разных пакетах без re-export.

## Чек-лист

- Почему `err == ErrNotFound` false после `fmt.Errorf("%w")`?
- Чем `errors.Is` отличается от `errors.As`?
- Что такое sentinel error?
- Какой тип передавать вторым аргументом в `As`?
- Как `Unwrap` связан с `%w`?
- Как замапить `ErrNotFound` на HTTP 404 в handler?

Следующий урок: [26. Пакеты и видимость](26-packages.md). Лаба: [24-lab-errors.md](24-lab-errors.md).
