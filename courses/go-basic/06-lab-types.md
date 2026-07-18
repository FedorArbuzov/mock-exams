# 06. Лаба: типы и константы

Эта лаба закрепляет типы, преобразования, `const` и `iota` из уроков 04–05 через предсказание вывода до запуска `go run` — многие ошибки типов и границ компилятор ловит сам, если научиться их читать.

## Предварительно

- Прочитаны [04. Базовые типы](04-basic-types.md) и [05. Константы и iota](05-constants-iota.md).
- Рабочая директория:

```bash
cd courses/go-basic/examples
go version
```

Эталоны — `examples/solutions/` — после своей попытки.

---

## Задание 1. Предсказание вывода

**Контекст:** code review «что напечатает?» без запуска — быстрее CI.

Создайте `lab/06types/predict.go` **или** один `main.go` с функцией `predict` в комментариях сверху:

```go
package main

import "fmt"

func main() {
	var i int = 42
	var f float64 = float64(i) / 10
	fmt.Println(f)

	s := "shop"
	fmt.Println(len(s), len("магазин"))

	b := true
	fmt.Println(b)
}
```

**До запуска** запишите в комментарии ожидаемый вывод каждой строки. Затем:

```bash
go run ./lab/06types
```

Исправьте комментарии, если ошиблись. Объясните `len("магазин")` — байты UTF-8.

---

## Задание 2. Деньги в копейках

**Контекст:** line item в заказе — цена не должна плыть на float.

`lab/06money/main.go`:

```go
package main

import "fmt"

type Cents int64

const (
	UnitKeyboard Cents = 7999  // 79.99
	UnitMouse    Cents = 2999
)

func lineTotal(unit Cents, qty int) Cents {
	return unit * Cents(qty)
}

func main() {
	fmt.Println("keyboard x2:", lineTotal(UnitKeyboard, 2))
	fmt.Println("as euros:", float64(lineTotal(UnitMouse, 3))/100)
}
```

**Критерий:** `15998` и `89.97` без артефактов `0.00000004`. В комментарии: почему не `float64` для `UnitKeyboard`.

---

## Задание 3. iota — статусы заказа

**Контекст:** статусы заказа — числа в БД, имена в логах.

`lab/06status/main.go`:

```go
package main

import "fmt"

type OrderStatus int

const (
	StatusUnknown OrderStatus = iota
	StatusPending
	StatusPaid
	StatusShipped
	StatusCancelled
)

func main() {
	fmt.Println(StatusPending, StatusPaid, StatusShipped)
	fmt.Printf("%T\n", StatusPending)
}
```

**Критерий:** `1 2 3` (если Unknown = 0). Добавьте функцию `statusName(s OrderStatus) string` со `switch` — минимум 4 case. Не используйте `if s == 1` без приведения типа.

---

## Задание 4. strconv и ошибки (preview)

**Контекст:** query param `?qty=2` приходит строкой — как в HTTP до парсинга.

`lab/06parse/main.go`:

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	qtyStr := "3"
	qty, err := strconv.Atoi(qtyStr)
	if err != nil {
		fmt.Println("parse error:", err)
		return
	}
	fmt.Println("qty:", qty, "double:", qty*2)

	bad := "3.5"
	_, err = strconv.Atoi(bad)
	fmt.Println("bad parse err != nil:", err != nil)
}
```

**Критерий:** `qty: 3 double: 6`, `bad parse err != nil: true`. Одной фразой в комментарии: связь с `if err != nil`.

---

## Задание 5. Typed const vs магическое число

**Контекст:** лимит корзины в BFF и Go-сервисе должен совпадать.

```go
package main

import "fmt"

type Limit int

const MaxCartItems Limit = 100

func canAdd(current int, add int) bool {
	return current+add <= int(MaxCartItems)
}

func main() {
	fmt.Println(canAdd(98, 2))
	fmt.Println(canAdd(98, 3))
}
```

Сохраните как `lab/06limit/main.go`. **Критерий:** `true`, `false`. Замените `MaxCartItems` на голую `100` в сигнатуре — убедитесь, что код всё ещё работает, и объясните в комментарии, зачем typed `Limit`.

---

## Критерии успеха

- [ ] Пакеты `06types`, `06money`, `06status`, `06parse`, `06limit` (или один объединённый — по вашему выбору, но все задания выполнены) запускаются из `examples/`
- [ ] В задании 1 комментарии с предсказанием совпали с выводом
- [ ] Enum на iota с `switch` по статусам
- [ ] `strconv.Atoi` с проверкой `err`
- [ ] Понимаете разницу байтовой длины и «символов»

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `overflows int8` | Константа не влезает — смените тип |
| `cannot use i (variable of type int) as OrderStatus` | Нужен cast `OrderStatus(i)` или сравнение с const |
| `invalid operation: Cents * int` | Приведите `Cents(qty)` |
| Неожиданный iota | Пересчитайте строки в блоке const с 0 |
| `package main is not in GOROOT` | Запуск из `examples/`, путь `./lab/06money` |

Следующий урок (теория): [07. Structs](07-structs.md).
