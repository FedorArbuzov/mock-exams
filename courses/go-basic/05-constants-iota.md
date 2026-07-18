# 05. Константы и iota: typed, untyped, перечисления

## Что вы узнаете

- Объявление **`const`** — одна и группа.
- **Untyped** и **typed** константы и правила вывода типа.
- **`iota`** для автоматической нумерации в блоке const.
- Паттерны enum: статусы заказа, битовые флаги (обзор).

## Базовый const

```go
const AppName = "shop-catalog"
const MaxCartItems = 100

const (
	Pi       = 3.141592653589793
	APIBase  = "http://localhost:8090/api/v1"
	Debug    = false
)
```

- Значение должно быть **вычислимо на этапе компиляции** (литералы, арифметика над константами).
- `const` **нельзя** присвоить заново.
- На уровне пакета const видны в пакете; с большой буквы — экспорт.

```go
// const now = time.Now()  // ошибка: time.Now() — не compile-time
```

Для «констант времени жизни» используют `var` с инициализацией при старте — редко на basic.

## Untyped vs typed константы

```go
const untyped = 42        // untyped integer constant
const typed int8 = 42     // тип int8

var a int = untyped       // OK: 42 влезает в int
var b int8 = untyped      // OK: неявное приведение const → int8
// var c int8 = 300       // ошибка: constant 300 overflows int8
```

**Untyped constant** «гибкая»: принимает тип при использовании, если значение представимо.

```go
const million = 1_000_000
var x int = million
var y float64 = million
```

Строковые и bool константы аналогично untyped.

### Typed const — отдельный тип

```go
type Status int

const (
	StatusPending Status = 1
	StatusPaid    Status = 2
)
```

Теперь нельзя случайно сравнить `Status` с `int` без приведения:

```go
var s Status = StatusPending
// if s == 1 { }  // compile error без Status(1)
if s == StatusPending {
	// OK
}
```

## iota — автонумерация

В блоке `const` **`iota`** — счётчик строк, начиная с 0:

```go
type OrderStatus int

const (
	OrderPending OrderStatus = iota // 0
	OrderPaid                         // 1
	OrderShipped                      // 2
	OrderCancelled                    // 3
)
```

Каждая следующая строка в скобках увеличивает `iota` на 1, пока блок не закончится.

### Пропуск значений

```go
const (
	_  = iota             // пропустить 0
	KB = 1 << (10 * iota) // 1024
	MB                    // 1048576
	GB
)
```

Паттерн для размеров файлов и битовых масок.

### Явное задание после iota

```go
const (
	A = iota // 0
	B        // 1
	C = 10   // 10 — сбросили выражение, но iota всё равно 2 на этой строке
	D        // iota 3, значение 10+1? Нет — D повторяет выражение предыдущей строки если пусто
)
```

Правило: **пустая строка** повторяет **предыдущее выражение** с новым `iota`. На практике для enum держите блок простым — без сюрпризов.

## Enum для shop-домена

Статусы заказа для shop-домена:

```go
type OrderStatus int

const (
	OrderStatusUnknown OrderStatus = iota
	OrderStatusPending
	OrderStatusConfirmed
	OrderStatusShipped
	OrderStatusDelivered
	OrderStatusCancelled
)

func (s OrderStatus) String() string {
	switch s {
	case OrderStatusPending:
		return "pending"
	case OrderStatusConfirmed:
		return "confirmed"
	// ...
	default:
		return "unknown"
	}
}
```

Метод `String()` — preview будущей главы про методы. В JSON часто шлют **строки** `"pending"`, не числа — для этого нужен custom `MarshalJSON`.

## const и производительность

Константы **не занимают** память как переменные — вшиваются в код при компиляции. Для путей и лимитов:

```go
const defaultPageSize = 20
```

Не путайте с **configuration** из env (`os.Getenv`) — там `var` при старте.

## Типичные ошибки

**Дублирующиеся значения iota без typed enum.** Два статуса = 2 — компилятор не предупредит.

**Использовать iota вне блока const.** Только внутри `const (...)`.

**Ждать `const` для слайсов и map.** Нужен `var` или функция.

**Смешивать `iota` с разными типами в одном блоке без явных типов.** Первое значение задаёт тип всему блоку в typed const group.

**Магические числа в HTTP handler «потом вынесу».** Вынесите сразу — правка на review дешевле инцидента.

## Резюме

**`const`** фиксирует compile-time значения; **`iota`** строит последовательные enum. **Typed constants** через `type Status int` отделяют доменные статусы от произвольных `int`. Лаба 06 закрепит предсказание значений iota и преобразований.

## Чек-лист

- [ ] Можете написать enum статусов заказа на iota
- [ ] Понимаете untyped const `42` и присваивание в `int`/`float64`
- [ ] Знаете, почему `time.Now()` нельзя в const
- [ ] Используете typed const для статусов, не голые `int`
- [ ] Прочитали блок const с `_ = iota` для пропуска нуля

Следующий урок: [06. Лаба: типы и константы](06-lab-types.md).
