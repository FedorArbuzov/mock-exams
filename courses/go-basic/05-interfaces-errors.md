# 05. Interfaces и ошибки

## Interface — контракт поведения

```go
type Pricer interface {
    Price() float64
}

type Product struct {
    Name  string
    Cents int
}

func (p Product) Price() float64 {
    return float64(p.Cents) / 100
}

func PrintPrice(p Pricer) {
    fmt.Println(p.Price())
}
```

**Нет ключевого слова `implements`.** Тип удовлетворяет interface, если реализует все methods. Компилятор проверяет в месте использования.

Пустой interface `any` — «любой тип»; в новом коде сужайте типы, не разбрасывайте `any` без нужды.

### Type assertion

```go
var v any = "hello"
s, ok := v.(string)
if !ok {
    // не string
}
```

## Ошибки — значения, не исключения

```go
if err != nil {
    return fmt.Errorf("load config: %w", err)
}
```

`error` — interface с одним method `Error() string`.

**Sentinel errors:**

```go
var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) { }
```

**Обёртки и типы:**

```go
var e *ValidationError
if errors.As(err, &e) { }
```

Паттерн: возвращайте ошибку **наверх**, логируйте на границе (main, HTTP handler).

## panic / recover

**panic** — для программных багов и невосстановимых ситуаций, не для «файл не найден».

**recover** — только внутри `defer` в той же goroutine; в HTTP-серверах фреймворк ловит panic за вас.

На `go-basic`: пишите `return err`, не `panic`.

## defer

```go
defer mu.Unlock()
defer cancel()
```

Порядок выполнения — обратный порядку `defer`. Часто: открыли ресурс → `defer Close()`.

## Типичные ошибки

| Ошибка | Что делать |
|--------|------------|
| `if err != nil` с `nil` interface | См. nil interface gotcha — присваивайте typed `nil` осторожно |
| `panic` вместо `error` | Верните `error`, panic — редко |
| Interface на всём подряд | Маленькие interfaces (1–2 methods), как `io.Reader` |

## Чек-лист

- [ ] Описали interface и реализовали его struct'ом
- [ ] Оборачиваете ошибку через `%w`
- [ ] Знаете `errors.Is` / `errors.As`

Дальше: [06. Пакеты и go mod](06-packages-modules.md).
