# 24. Лаба: обёртка ошибок

Цель — написать **маленький слой работы с ошибками**: sentinel, `%w`, проверка `errors.Is`, кастомный тип для валидации.

**Время:** ~30–40 минут после [21-errors.md](21-errors.md) и [25-errors-is-as.md](25-errors-is-as.md) (можно после 21, Is/As — по ходу лабы).

## Стенд

```bash
cd courses/go-basic/examples
go test ./lab/errors/... -v   # после реализации
```

Каталог: `lab/errors/`. Эталон: `solutions/lab/errors/`.

---

## Задание 1. Sentinel `ErrNotFound`

```go
package errorslab

import "errors"

var ErrNotFound = errors.New("not found")

type User struct {
    ID   int
    Name string
}

var users = map[int]User{
    1: {ID: 1, Name: "Ann"},
    2: {ID: 2, Name: "Bob"},
}

func FindUser(id int) (User, error) {
    u, ok := users[id]
    if !ok {
        return User{}, ErrNotFound
    }
    return u, nil
}
```

**Проверка** (`find_test.go` или `main`):

```go
_, err := FindUser(99)
fmt.Println(errors.Is(err, ErrNotFound)) // true
```

---

## Задание 2. Обёртка `LoadUser`

```go
func LoadUser(id int) (User, error) {
    u, err := FindUser(id)
    if err != nil {
        return User{}, fmt.Errorf("load user %d: %w", id, err)
    }
    return u, nil
}
```

`errors.Is(LoadUser(99))` должен находить `ErrNotFound` **через** обёртку.

---

## Задание 3. `ValidationError` и `ParseUserID`

```go
type ValidationError struct {
    Field string
    Value string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("invalid %s: %q", e.Field, e.Value)
}

func ParseUserID(s string) (int, error) {
    if s == "" {
        return 0, &ValidationError{Field: "id", Value: s}
    }
    id, err := strconv.Atoi(s)
    if err != nil {
        return 0, fmt.Errorf("parse id %q: %w", s, err)
    }
    if id <= 0 {
        return 0, &ValidationError{Field: "id", Value: s}
    }
    return id, nil
}
```

**Проверка `errors.As`:**

```go
var ve *ValidationError
err := ParseUserID("-1")
if errors.As(err, &ve) {
    fmt.Println(ve.Field) // id
}
```

---

## Задание 4. `GetUserByStringID` — композиция

```go
func GetUserByStringID(s string) (User, error) {
    id, err := ParseUserID(s)
    if err != nil {
        return User{}, fmt.Errorf("get user by string id: %w", err)
    }
    u, err := LoadUser(id)
    if err != nil {
        return User{}, fmt.Errorf("get user by string id %q: %w", s, err)
    }
    return u, nil
}
```

Таблица сценариев:

| Вызов | `errors.Is` / `As` |
|-------|-------------------|
| `GetUserByStringID("1")` | OK, Ann |
| `GetUserByStringID("99")` | `Is(ErrNotFound)` |
| `GetUserByStringID("x")` | `As(*ValidationError)` или wrap Atoi |
| `GetUserByStringID("")` | `As(*ValidationError)` |

---

## Задание 5. `FailingSink` (связь с лабой 22)

```go
type FailingSink struct {
    FailOn string
}

func (f *FailingSink) Write(line string) error {
    if strings.Contains(line, f.FailOn) {
        return fmt.Errorf("sink reject %q: %w", line, ErrRejected)
    }
    return nil
}

var ErrRejected = errors.New("rejected")
```

Интеграция с `Run` из лабы 22 — при ошибке sink пайплайн возвращает обёрнутый `ErrRejected`.

---

## Критерии успеха

| Команда | Ожидание |
|---------|----------|
| `go test ./lab/errors/...` | PASS (напишите table-driven тесты в задании 6*) |
| `errors.Is` на `LoadUser(99)` | true для `ErrNotFound` |
| `errors.As` на `ParseUserID("")` | true для `*ValidationError` |

\*Опционально: один table-driven тест на `ParseUserID`.

---

## Troubleshooting

| Симптом | Решение |
|---------|---------|
| `Is` false после wrap | используйте `%w`, не `%v` |
| `As` false | передавайте `&ve`, где `ve *ValidationError` |
| typed nil в тесте | `return nil`, не `return (*ValidationError)(nil)` |

Следующий урок: [25. errors.Is и errors.As](25-errors-is-as.md) (если ещё не читали) или [26. Пакеты](26-packages.md).
