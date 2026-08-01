# Go Basic — Interview cheatsheet

Справка **после** прохождения курса. Не заменяет уроки 00–10.

## Синтаксис

```go
var x int = 0
y := 42                    // только в функции
const Max = 3
```

Zero values: `0`, `""`, `false`, `nil`.

## Коллекции

```go
s := []int{1, 2}
s = append(s, 3)
m := make(map[string]int)
v, ok := m["k"]
```

## Ошибки

```go
if err != nil { return fmt.Errorf("ctx: %w", err) }
errors.Is(err, ErrNotFound)
errors.As(err, &target)
```

## Interface

Реализация неявная. Маленькие interfaces (1–2 methods).

## Указатели

`&x`, `*p`. Pointer receiver для мутации struct.

## defer / panic

`defer f.Close()` — LIFO. `panic` — редко; в API возвращайте `error`.

## Модули

```bash
go mod init module/path
go test ./...
go vet ./...
```

## JSON

```go
`json:"field_name,omitempty"`
json.Unmarshal(data, &v)  // pointer
```

## Частые вопросы

1. **Slice vs array?** — array фиксирован; slice — длина + capacity + pointer.
2. **Когда pointer receiver?** — мутация, большой struct, единообразие methods.
3. **Nil map vs empty map?** — запись в nil map паникует.
4. **Чем Go отличается от OOP?** — композиция, interfaces, нет наследования классов.
5. **Где concurrency?** — не в basic; goroutines + channels в `go-concurrency`.

## Дальше

[`10-next-steps.md`](10-next-steps.md) → `go-intermediate` по [`golang-path.md`](../golang-path.md).
