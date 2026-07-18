# 04. Базовые типы: числа, строки, bool, rune, byte

## Что вы узнаете

- Целые **`int`**, **`int64`**, **`uint`** и когда явно выбирать размер.
- **`float64`** и ловушки денег (связь с лабой 05).
- **`string`** как неизменяемая последовательность байт UTF-8.
- **`bool`** — только `true`/`false`, без truthy.
- **`byte`** (`uint8`) и **`rune`** (`int32`, code point).
- **`uintptr`** — обзор для unsafe/advanced, не для daily code.
- Явные **преобразования типов**.

## Числовые типы

### Целые

```go
var count int = 3          // int — 32 или 64 бита, зависит от платформы
var productID int64 = 9007199254740993
var flags uint8 = 0b1010   // битовые маски, редко в basic

fmt.Printf("%T %T\n", count, productID)
```

| Тип | Размер | Типичное использование |
|-----|--------|------------------------|
| `int`, `uint` | платформа | индексы, len, счётчики |
| `int8`…`int64` | фиксированный | протоколы, БД, ID из API |
| `uint8` (`byte`) | 8 бит | сырые байты, binary |
| `uintptr` | указатель как число | unsafe, cgo — не в business logic |

**Правило shop:** идентификаторы товаров и заказов — **`int64`** или `string` (UUID), не `int` «на глаз», если значения могут превысить 32-bit.

### Вещественные

```go
price := 79.99    // float64 по умолчанию
tax := float32(0.2) // float32 редко — накапливает ошибку быстрее
```

Go **не** имеет отдельного типа `decimal`. Деньги в production:

```go
type MoneyCents int64

func lineTotalCents(unitCents MoneyCents, qty int) MoneyCents {
	return unitCents * MoneyCents(qty)
}
```

### Литералы

```go
decimal := 42
hex := 0xFF
binary := 0b1010
octal := 0o755  // Go 1.13+
million := 1_000_000
```

## bool

Только два значения. В условиях **обязательно** bool:

```go
var active bool
if active { // OK
	// ...
}
// if count { }  // compile error: non-bool condition

stock := 5
if stock > 0 {
	fmt.Println("in stock")
}
```

В Go нет truthy/falsy: `0`, `""`, `nil` — **не** false в `if`.

## string

Строка — **неизменяемая** последовательность байт (обычно UTF-8):

```go
title := "Клавиатура"
fmt.Println(len(title)) // байты, не «буквы»
```

Операции:

```go
s := "shop"
fmt.Println(s + "-api")     // конкатенация
fmt.Println(s[0])           // byte: 115 ('s')
// s[0] = 'x'               // compile error: immutable

for i := 0; i < len(s); i++ {
	fmt.Printf("%c ", s[i])
}
```

Сравнение лексикографическое, case-sensitive. Для регистронезависимого — `strings.EqualFold`.

### raw string

```go
query := `SELECT * FROM items WHERE title = "Mouse"`
// обратные кавычки — без escape \n
```

## rune и byte

```go
var b byte = 'A'    // alias uint8
var r rune = 'Я'    // alias int32, Unicode code point

s := "Go"
fmt.Println(rune(s[0])) // 71 — первый байт, не вся строка
```

Итерация **по рунам** (символам Unicode):

```go
for i, r := range "Кот" {
	fmt.Printf("%d: %c (%U)\n", i, r, r)
}
```

`i` — индекс **байта** в строке, не номер символа. Для кириллицы один символ = 2 байта UTF-8 — отсюда путаница `len` vs «количество букв».

## uintptr (обзор)

`uintptr` — целое, достаточное для хранения **битового паттерна указателя**. Используется в `unsafe.Pointer`, cgo, низкоуровневых оптимизациях. В коде shop catalog **не нужен**. Знайте, что на собеседовании спрашивают «чем rune от byte» чаще, чем uintptr.

```go
// Только для ориентира — не копируйте в лабы
import "unsafe"
var x int = 42
p := uintptr(unsafe.Pointer(&x))
_ = p
```

## Преобразование типов — явное

Go **не** приводит типы в арифметике молча:

```go
var a int = 10
var b float64 = 3.14
// c := a + b        // error
c := float64(a) + b // OK

var id int64 = 42
// var small int32 = id // error
small := int32(id)     // OK, может обрезать — осознанно
```

Строка ↔ число — через `strconv`:

```go
import "strconv"
n, err := strconv.Atoi("42")
_ = n
_ = err
```

## Zero values (повторение)

```go
var i int
var f float64
var b bool
var s string
fmt.Println(i, f, b, s) // 0 0 false
```

## Типичные ошибки

**Хранить деньги в `float64`.** Округление на checkout; используйте `int64` копейки или decimal library.

**Путать `len(string)` с количеством символов.** Для Unicode — `utf8.RuneCountInString` или `range`.

**Использовать `int` для ID из внешней системы.** Может не влезть в 32 bit на некоторых платформах — `int64`.

**Сравнивать float через `==`.** Допуск или целые копейки.

**Ждать `bool` из строки `"false"`.** В Go это непустая строка → нельзя в `if`; парсите `strconv.ParseBool`.

## Резюме

Базовые типы Go **фиксированы и строги**: целые, `float64`, `string`, `bool`, `byte`, `rune`. Преобразования **явные**; zero values предсказуемы. Строки — UTF-8 байты; для shop API и кириллицы в каталоге помните разницу байтов и рун. Следующий урок — константы и `iota` для статусов и enum без магических чисел.

## Чек-лист

- [ ] Можете назвать zero value для `float64` и `string`
- [ ] Понимаете, почему `0.1+0.2 == 0.3` — false
- [ ] Знаете разницу `byte` и `rune`
- [ ] Пишете `if n > 0`, не `if n` (ошибка компиляции)
- [ ] Выбираете `int64` для больших ID
- [ ] Прочитали ошибку «invalid operation» при смешении int и float64

Следующий урок: [05. Константы и iota](05-constants-iota.md).
