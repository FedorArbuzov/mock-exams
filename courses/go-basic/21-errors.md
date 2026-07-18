# 21. Ошибки: error, fmt.Errorf, %w

## Интерфейс error

```go
type error interface {
    Error() string
}
```

Любой тип с методом `Error() string` — ошибка. Чаще всего:

```go
import "errors"

var ErrNotFound = errors.New("not found")

func loadUser(id int) (User, error) {
    if id <= 0 {
        return User{}, fmt.Errorf("invalid id: %d", id)
    }
    // ...
    return User{}, ErrNotFound
}
```

| Способ создать error | Когда |
|----------------------|-------|
| `errors.New("msg")` | Статическое сообщение, sentinel |
| `fmt.Errorf("ctx: %w", err)` | Обёртка с контекстом + цепочка |
| `fmt.Errorf("bad %d", id)` | Новая ошибка без wrap |
| Custom type `func (e *MyErr) Error() string` | Поля: код, HTTP status |

**Sentinel** — заранее объявленная переменная (`ErrNotFound`) для сравнения через `errors.Is` — подробнее в главе 25.

## Идиома if err != nil

Стандартный поток в Go — **проверять ошибку сразу** после вызова, не откладывать:

```go
f, err := os.Open(path)
if err != nil {
    return fmt.Errorf("open config %q: %w", path, err)
}
defer f.Close()

data, err := io.ReadAll(f)
if err != nil {
    return fmt.Errorf("read config %q: %w", path, err)
}
```

### Антипаттерны

```go
// плохо — глотание
data, _ := io.ReadAll(f)

// плохо — бессмысленный return без контекста
if err != nil {
    return err
}
// лучше добавить контекст на границе слоя:
if err != nil {
    return fmt.Errorf("load users: %w", err)
}

// плохо — panic вместо error в библиотечном коде
if err != nil {
    panic(err)
}
```

**Правило слоёв:** низкий уровень (DB driver) возвращает «сырую» ошибку; сервис **оборачивает**; HTTP handler **маппит** в статус (404/500).

### Множественный возврат

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 0)
if err != nil {
    log.Println(err)
    return
}
fmt.Println(result)
```

Ошибка — **последнее** значение в списке возврата (конвенция, не синтаксическое требование).

## fmt.Errorf и форматирование

```go
return fmt.Errorf("user %d: %s", id, "inactive")
```

Verb'ы как в `fmt.Printf`: `%d`, `%s`, `%q`, `%v`, `%w`.

### %w — wrap для цепочки

Go 1.13+ — `%w` **оборачивает** ошибку, сохраняя unwrap для `errors.Is` / `errors.As`:

```go
func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read config %q: %w", path, err)
    }
    return data, nil
}

func main() {
    _, err := readConfig("/etc/app.yaml")
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("файла нет — дефолтный конфиг")
    }
}
```

| Verb | Эффект |
|------|--------|
| `%v` | Текст ошибки, **без** unwrap |
| `%w` | Wrap — можно `errors.Unwrap` |
| `%s` | Как строка |

**Один `%w` на вызов** `fmt.Errorf` — второй `%w` не компилируется.

```go
// нельзя
fmt.Errorf("%w and %w", e1, e2)

// можно цепочкой
fmt.Errorf("step1: %w", fmt.Errorf("step0: %w", root))
```

## Создание ошибок: errors.New vs fmt.Errorf

```go
var ErrEmptyName = errors.New("name is empty")

func validateName(name string) error {
    if name == "" {
        return ErrEmptyName
    }
    return nil
}
```

Для **динамического** текста без wrap:

```go
return fmt.Errorf("price %.2f out of range [0, %d]", price, maxPrice)
```

## Кастомные типы ошибок

Когда нужны **поля** (HTTP code, field name):

```go
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s — %s", e.Field, e.Message)
}

func parseAge(s string) (int, error) {
    n, err := strconv.Atoi(s)
    if err != nil {
        return 0, fmt.Errorf("parse age %q: %w", s, err)
    }
    if n < 0 || n > 150 {
        return 0, &ValidationError{Field: "age", Message: "out of range"}
    }
    return n, nil
}
```

Извлечение типа — `errors.As` (глава 25).

## error и nil (связь с interfaces)

`error` — interface. **Typed nil** ломает проверку:

```go
func fail() error {
    var ve *ValidationError = nil
    return ve // != nil как error
}
```

Возвращайте `return nil` или `return &ValidationError{...}`, не typed nil pointer.

## Ошибки vs panic

| Ситуация | error | panic |
|----------|-------|-------|
| Файл не найден | `return err` | — |
| Битый ввод пользователя | `return err` | — |
| Программистский баг (инвариант) | иногда `error` | `panic` + recover на границе |
| init() при старте | `log.Fatal` / `panic` | допустимо |

`panic` — для **невосстановимых** сбоев или прототипа; в библиотеках и HTTP handlers — **errors**.

## Паттерн «обогати и верни»

```go
func (s *Service) GetOrder(ctx context.Context, id string) (Order, error) {
    order, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return Order{}, fmt.Errorf("service get order %s: %w", id, err)
    }
    if order.Status == "" {
        return Order{}, fmt.Errorf("order %s: %w", id, ErrCorruptData)
    }
    return order, nil
}
```

Handler:

```go
order, err := svc.GetOrder(r.Context(), id)
if err != nil {
    if errors.Is(err, ErrNotFound) {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    http.Error(w, "internal error", http.StatusInternalServerError)
    return
}
```

## Логирование ошибок

```go
if err != nil {
    slog.Error("save failed", "user_id", id, "err", err)
    return fmt.Errorf("save user %d: %w", id, err)
}
```

Логируйте **один раз** на границе (handler, main), не в каждой внутренней функции — иначе дубли в Loki/ELK.

Go **не заставляет** обрабатывать каждую ошибку компилятором — дисциплина `if err != nil` держится на культуре команды и линтерах, а не на синтаксисе языка.

## Типичные ошибки

- **`_` вместо `err`** — потеря сбоя без следа.
- **`return err` без контекста** на границе слоя — непонятные логи.
- **`%v` вместо `%w`** — `errors.Is` перестаёт работать.
- **panic на I/O** — роняет весь процесс вместо 500.
- **Typed nil** в `return` как `error`.
- **Двойное логирование** одной ошибки на каждом уровне стека вызовов.

## Чек-лист

- Какой метод должен быть у типа, чтобы он был `error`?
- Чем `errors.New` отличается от `fmt.Errorf` без `%w`?
- Зачем `%w` в `fmt.Errorf`?
- Почему `if err != nil` обязателен после почти каждого syscall?
- Когда sentinel (`ErrNotFound`) лучше, чем строка в `fmt.Errorf`?
- Чем модель `error` в Go принципиально отличается от исключений (exceptions)?

Следующий урок: [23. defer, panic, recover](23-defer-panic-recover.md). Лаба по ошибкам: [24. Лаба: errors](24-lab-errors.md). Углубление: [25. errors.Is и errors.As](25-errors-is-as.md).
