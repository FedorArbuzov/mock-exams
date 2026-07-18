# 22. Лаба: interfaces и io-паттерны

Цель — реализовать **мини-пайплайн обработки данных** на interfaces: свой `Reader`/`Writer`-стиль без копирования всей `io`, compile-time проверки, type assertion. Паттерны те же, что в `io.Copy`.

**Время:** ~30–40 минут после [20-interfaces.md](20-interfaces.md) (~50–70 мин на пару 20+22).

## Стенд

```bash
cd courses/go-basic/examples
go version   # 1.22+
```

Создайте пакет `lab/interfaces/` (или `lab/22/`). Модуль: `github.com/mock-exams/go-basic-labs` ([`examples/go.mod`](examples/go.mod)).

Эталон — `solutions/lab/interfaces/` (после своей попытки).

---

## Архитектура

```text
lab/interfaces/
├── doc.go          # package comment (опционально)
├── source.go       # StringSource — «читатель» строк
├── transform.go    # Uppercase — трансформация
├── sink.go         # ConsoleSink — «писатель»
├── pipeline.go     # Run(Source, ...Transform, Sink)
└── main.go         # демо в cmd или отдельный lab/22main
```

Запуск: `go run ./lab/interfaces` (или путь к вашему `main`).

---

## Задание 1. Контракт `Source`

```go
// lab/interfaces/source.go
package interfaces

type Source interface {
    Next() (string, bool) // строка, false = конец
}
```

Реализуйте `StringSource` из слайса строк:

```go
type StringSource struct {
    lines []string
    idx   int
}

func NewStringSource(lines ...string) *StringSource { /* TODO */ }
func (s *StringSource) Next() (string, bool) { /* TODO */ }
```

**Проверка** в `main`:

```go
src := NewStringSource("go", "basic", "lab")
for {
    line, ok := src.Next()
    if !ok {
        break
    }
    fmt.Println(line)
}
```

Добавьте compile-time assert:

```go
var _ Source = (*StringSource)(nil)
```

---

## Задание 2. `Sink` и `ConsoleSink`

```go
type Sink interface {
    Write(line string) error
}

type ConsoleSink struct {
    prefix string
}

func (c *ConsoleSink) Write(line string) error {
    fmt.Printf("%s%s\n", c.prefix, line)
    return nil
}
```

---

## Задание 3. `Transform` — цепочка

```go
type Transform interface {
    Process(string) string
}

type Uppercase struct{}

func (Uppercase) Process(s string) string {
    return strings.ToUpper(s)
}

type Trim struct{}

func (Trim) Process(s string) string {
    return strings.TrimSpace(s)
}
```

---

## Задание 4. `Run` — пайплайн

```go
func Run(src Source, transforms []Transform, sink Sink) error {
    for {
        line, ok := src.Next()
        if !ok {
            return nil
        }
        for _, t := range transforms {
            line = t.Process(line)
        }
        if err := sink.Write(line); err != nil {
            return fmt.Errorf("sink: %w", err)
        }
    }
}
```

**Демо:**

```go
err := Run(
    NewStringSource("  hello ", "  world  "),
    []Transform{Trim{}, Uppercase{}},
    &ConsoleSink{prefix: "> "},
)
```

Ожидание:

```text
> HELLO
> WORLD
```

---

## Задание 5. Type assertion — `PrefixSink`

Реализуйте `FlexibleSink`, принимающий `any` и использующий type switch:

```go
func DescribeSink(s any) string {
    switch v := s.(type) {
    case *ConsoleSink:
        return "console prefix=" + v.prefix
    case Sink:
        return "generic sink"
    default:
        return fmt.Sprintf("unknown %T", v)
    }
}
```

---

## Критерии успеха

| Проверка | Ожидание |
|----------|----------|
| `go build ./lab/interfaces/...` | без ошибок |
| Пайплайн Trim+Upper | две строки в верхнем регистре |
| `var _ Source = (*StringSource)(nil)` | компилируется |
| `DescribeSink(&ConsoleSink{})` | строка с `console` |

---

## Troubleshooting

| Симптом | Причина | Решение |
|---------|---------|---------|
| `*StringSource does not implement Source` | value vs pointer receiver | метод на `*StringSource` |
| Пустой вывод | `Next` сразу `false` | проверьте `idx` |
| import cycle | `main` в том же package | вынесите `main` в `cmd/22` |
| panic в type switch | неверная ветка default | используйте `, ok` где нужно |

Следующий урок (теория): [23. defer, panic, recover](23-defer-panic-recover.md).
