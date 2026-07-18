# 12. Maps: `make`, `delete`, итерация, nil map

## Что вы узнаете

- Объявление, литерал и **`make(map[K]V)`**.
- Операции: запись, чтение, **comma ok**, **`delete`**.
- **Итерация** `for k, v := range m` и порядок ключей.
- Zero value **`nil` map** vs пустая инициализированная map.
- Типичные ошибки в production.

## Объявление и создание

```go
// 1. var — nil map
var m1 map[string]int

// 2. литерал — готов к записи
m2 := map[string]int{
	"apple":  50,
	"banana": 30,
}

// 3. make — пустая инициализированная map
m3 := make(map[string]int)
m3["cherry"] = 40
```

| Способ | `== nil` | Можно `m[k]=v` |
|--------|----------|----------------|
| `var m map[K]V` | да | **нет** — panic |
| `m := map[K]V{}` | нет | да |
| `m := make(map[K]V)` | нет | да |
| `m := make(map[K]V, n)` | нет | да, с hint ёмкости |

**Почему `make`:** map — reference type (descriptor на runtime hmap). `make` выделяет внутреннюю структуру; `var` только создаёт nil descriptor.

### Hint ёмкости

```go
// ожидаем ~1000 SKU — меньше реаллокаций
inventory := make(map[string]int, 1000)
```

Как `make([]T, 0, cap)` для slice — оптимизация, не обязательна.

## Ключи: что допустимо

Ключ map должен быть **сравниваемым** (comparable) типом:

| Можно | Нельзя |
|-------|--------|
| `int`, `string`, `bool` | `slice` |
| указатель `*T` | `map` |
| `array` (фикс. размер) | `func` |
| struct (если все поля comparable) | struct с slice внутри |

```go
type Key struct {
	SKU string
	WH  int
}
stock := make(map[Key]int)
stock[Key{"A1", 1}] = 100
```

**Почему slice не ключ:** сравнение slice не определено в Go — `==` только для nil.

## Чтение, запись, comma ok

```go
prices := map[string]int{"tea": 120}

prices["coffee"] = 200          // insert / update
v := prices["tea"]              // 120
missing := prices["unknown"]    // 0 — zero value int, ключ мог отсутствовать!

price, ok := prices["unknown"]
if !ok {
	fmt.Println("нет такого SKU")
} else {
	fmt.Println(price)
}
```

**Почему comma ok обязателен в бизнес-логике:** `0` может быть **валидной ценой** или **отсутствием ключа** — без `ok` не различить.

### Проверка наличия без значения

```go
if _, ok := prices["sku-9"]; ok {
	// ключ есть
}
```

## Удаление: `delete`

```go
delete(prices, "tea")
```

- Удаляет пару ключ-значение, если ключ есть.
- Если ключа нет — **no-op**, не panic.
- `delete(m, k)` для `nil` map — безопасно (ничего не делает).

Нет отдельного метода `clear` до Go 1.21; с Go 1.21+:

```go
clear(prices) // удалить все ключи, map остаётся usable
```

## Итерация: `range`

```go
for sku, qty := range inventory {
	fmt.Println(sku, qty)
}

for sku := range inventory {
	fmt.Println(sku)
}
```

**Порядок случайный** (намеренно randomized с Go 1.0) — не полагайтесь на сортировку при range. Для стабильного порядка — соберите ключи, отсортируйте `slices.Sort`, итерируйте ключи.

**Почему random:** защита от зависимости кода от деталей реализации хеш-таблицы.

### Изменение map во время range

```go
for k, v := range m {
	if v == 0 {
		delete(m, k) // допустимо в Go
	}
}
```

Добавление ключей во время итерации — определённое поведение (новые ключи могут появиться или нет в текущем проходе). Для сложной логики — копия ключей:

```go
keys := make([]string, 0, len(m))
for k := range m {
	keys = append(keys, k)
}
for _, k := range keys {
	// безопасная мутация m
}
```

## Nil map vs пустая map

```go
var nilMap map[string]int
emptyMap := make(map[string]int)

fmt.Println(len(nilMap), len(emptyMap)) // 0, 0
fmt.Println(nilMap == nil)              // true
fmt.Println(emptyMap == nil)            // false
```

| Операция | nil map | empty map |
|----------|---------|-----------|
| `len` | 0 | 0 |
| `m[k]` read | zero value | zero value |
| `m[k] = v` | **panic** | ok |
| `delete(m,k)` | ok | ok |
| `range` | 0 итераций | 0+ |

**Идиома инициализации в struct:**

```go
type Cache struct {
	data map[string]string
}

func NewCache() *Cache {
	return &Cache{
		data: make(map[string]string), // не оставлять nil
	}
}
```

## Map vs slice vs struct

| Задача | Инструмент |
|--------|------------|
| Список по порядку | `slice` |
| Фиксированная запись полей | `struct` |
| Поиск по ключу O(1) средний | `map` |
| Множество уникальных строк | `map[string]struct{}` |
| Сортированный индекс | map + sorted keys или другой тип |

### Set через `map[T]struct{}`

```go
seen := make(map[string]struct{})
if _, ok := seen[id]; ok {
	return // дубликат
}
seen[id] = struct{}{}
```

`struct{}` не занимает память для значения — только ключ.

## Передача map в функцию

Map передаётся **по значению** descriptor'а, но descriptor указывает на **общие** данные — функция видит те же insert/delete, что caller:

```go
func addItem(m map[string]int, k string, v int) {
	m[k] = v
}

func main() {
	inv := make(map[string]int)
	addItem(inv, "x", 1)
	fmt.Println(inv["x"]) // 1
}
```

Не нужен `*map` — почти никогда. Указатель на map — code smell.

## JSON и map (preview)

```go
// encoding/json — глава 32
var raw map[string]any
json.Unmarshal(data, &raw)
```

`map[string]any` — гибко, но теряется типобезопасность; для API предпочтительны structs.

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| panic assignment nil map | `var m map` без make | `make` или литерал |
| Считать `m[k]==0` отсутствием | zero value | comma ok |
| Ожидать порядок ключей | random iteration | sort keys |
| `map[slice]int` | slice не comparable | ключ-string или struct ID |
| Копировать map через `=` | общий backing | глубокая копия вручную при необходимости |
| Хранить `*T` в map и мутировать без sync | data race | mutex или sync.Map (concurrency) |

## В продакшене

- Инициализируйте map в конструкторах сервисов — не полагайтесь на `nil` + lazy init без `sync.Once`.
- Для счётчиков и метрик в горутинах — не голый map.
- Размер map в долгоживущих процессах — следите за утечками «забытых» ключей; `delete` или TTL-кэш с Redis.

## Резюме

**Map** — `map[Key]Value` с comparable ключами. Создание: **литерал** или **`make`**; `var` даёт **nil** — чтение ok, **запись panic**. Чтение с проверкой — **comma ok**. **`delete`** и **`clear`** (1.21+) удаляют записи. **`range`** — случайный порядок. Map передаётся в функции с **общей** мутабельной backing store. Для множеств — `map[T]struct{}`.

## Чек-лист

- Что случится при `var m map[string]int; m["a"]=1`?
- Как отличить «ключ отсутствует» от «значение 0»?
- Почему порядок `range` по map нестабилен?
- Какие типы нельзя использовать как ключ?
- Нужен ли `*map` для мутации внутри функции?
- Чем `make(map[string]int)` отличается от `map[string]int{}`?

Следующий урок: [13. Лаба: указатели и maps](13-lab-pointers-maps.md).
