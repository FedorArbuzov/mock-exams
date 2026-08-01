# 03. Функции, указатели, methods

## Функции

```go
func Add(a, b int) int {
    return a + b
}

func Div(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("divide by zero")
    }
    return a / b, nil
}
```

**Несколько возвратов** — норма в Go; второе значение часто `error`.

**Variadic:** `func Sum(nums ...int) int`.

## Указатели

```go
x := 10
p := &x   // адрес
*p = 20   // x теперь 20
```

Зачем: изменить struct внутри функции, избежать копирования больших структур, явно обозначить «может быть nil».

```go
func ResetCounter(c *int) {
    *c = 0
}
```

`nil` pointer — разыменование **паникует**. Проверяйте перед использованием.

## Methods

```go
type Cart struct {
    Items []string
}

func (c *Cart) Add(item string) {
    c.Items = append(c.Items, item)
}
```

| Receiver | Когда |
|----------|-------|
| `(c Cart)` value | маленький immutable тип, копия OK |
| `(c *Cart)` pointer | мутация, большой struct, согласованность с остальными methods |

Правило команды: **если один method с pointer receiver — делайте pointer для всех** methods этого типа.

## Функции как значения

```go
ops := map[string]func(int, int) int{
    "add": func(a, b int) int { return a + b },
}
```

Используется в middleware и тестах; в basic достаточно узнать, что это возможно.

## Типичные ошибки

- Передача большого struct по значению в hot path — лишние копии (профилируйте позже).
- Pointer receiver на `nil` receiver — иногда допустимо (проверка внутри method), но легко ошибиться.
- Забыть `return` при named returns — компилятор предупредит, но логика может быть неверной.

## Чек-лист

- [ ] Функция возвращает `(T, error)`
- [ ] Method с pointer receiver мутирует struct
- [ ] Понимаете разницу `&x` и `*p`

Дальше: [04. Управление потоком](04-control-flow.md).
