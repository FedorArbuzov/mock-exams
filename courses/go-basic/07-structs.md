# 07. Structs: поля, вложенность, теги (preview)

## Что вы узнаете

- Синтаксис **`type Name struct`** и литералы.
- **Полевые имена**, exported vs unexported.
- **Вложенные** structs и **anonymous embedding**.
- **Struct tags** — preview для `encoding/json`.
- Zero value struct — все поля zero.

## Определение и использование

```go
type Product struct {
	ID       int64
	Title    string
	PriceCents int64
	InStock  bool
}

func main() {
	var p Product // zero: 0, "", 0, false
	p = Product{
		ID:         1,
		Title:      "Keyboard",
		PriceCents: 7999,
		InStock:    true,
	}

	_ = p.Title
}
```

Литерал с именами полей — **рекомендуется** (устойчив к перестановке полей). Позиционный литерал — только если знаете порядок и полей мало:

```go
p2 := Product{2, "Mouse", 2999, true}
```

## Exported и unexported поля

```go
type Item struct {
	ID    int64  // экспорт — JSON, другие пакеты
	sku   string // только этот пакет
}
```

`encoding/json` заполняет только **exported** поля.

## Доступ и указатели (preview)

```go
p := Product{Title: "Desk"}
p.Title = "Standing Desk" // копия? нет — p это value, но поля меняются in-place

ptr := &Product{Title: "Lamp"}
ptr.PriceCents = 19900
```

Передача struct в функцию — **копия** всей структуры (может быть дорого для больших struct).

## Вложенные structs

Явное поле:

```go
type Address struct {
	City   string
	Street string
}

type Customer struct {
	Name    string
	Address Address
}

c := Customer{
	Name: "Ann",
	Address: Address{City: "Berlin", Street: "Main 1"},
}
fmt.Println(c.Address.City)
```

## Embedding (композиция)

```go
type Address struct {
	City   string
	Street string
}

type Customer struct {
	Name string
	Address // anonymous field — embedding
}

c := Customer{
	Name: "Ann",
	Address: Address{City: "Berlin", Street: "Main 1"},
}
fmt.Println(c.City) // promoted field — c.Address.City тоже OK
```

**Promotion** — поля и методы вложенного типа поднимаются на внешний уровень. Это **не наследование** OOP: нет иерархии переопределений, только композиция. Конфликт имён двух embedded типов — ошибка компиляции при неоднозначности.

```go
type Timestamps struct {
	CreatedAt string
}

type Product struct {
	Timestamps
	ID    int64
	Title string
}
```

## Struct tags (preview)

Теги — строки метаданных у полей для reflection (JSON, SQL, validation):

```go
type Product struct {
	ID       int64   `json:"id"`
	Title    string  `json:"title"`
	Price    float64 `json:"price"`
	Category string  `json:"category,omitempty"`
}
```

- `json:"id"` — имя ключа в JSON.
- `omitempty` — не сериализовать zero value (осторожно с `false` и `0` — может скрыть валидные данные).

```go
import "encoding/json"

data := []byte(`{"id":1,"title":"Keyboard","price":79.99}`)
var p Product
err := json.Unmarshal(data, &p)
_ = err
```

## Сравнение struct

Structs **сравнимы**, если все поля сравнимы:

```go
a := Product{ID: 1, Title: "A"}
b := Product{ID: 1, Title: "A"}
fmt.Println(a == b) // true
```

Слайсы, map, func внутри struct — **нельзя** сравнивать `==`.

## Struct как value type

```go
func bumpPrice(p Product) {
	p.PriceCents += 100 // копия — оригинал не меняется
}
```

Для мутации — указатель `*Product` или возврат нового значения (иммутабельный стиль).

## Типичные ошибки

**Unexported поля ждут JSON.** `title` вместо `Title` — поле останется zero.

**Тег не совпадает с API.** `json:"item_id"` vs `"itemId"` — silent bug.

**Копировать большой struct в цикле.** Используйте slice of pointers или индексы.

**Путать embedding с наследованием.** Нет `super`, нет override — композиция.

**omitempty скрывает `0` price.** Документируйте контракт для бесплатных товаров.

## Резюме

**Struct** группирует поля одной сущности; exported имена — для API и пакетов. **Embedding** переиспользует поля без дублирования. **Tags** связывают поля с JSON — критично для shop API. Следующая глава — **slices** для списков товаров и корзины.

## Чек-лист

- [ ] Объявили `type Product struct` с exported полями
- [ ] Понимаете zero value struct
- [ ] Написали литерал с именами полей
- [ ] Объяснили embedding vs отдельное поле `Address`
- [ ] Видели struct tag `json:"..."`
- [ ] Знаете, что unexported поля не уходят в JSON

Следующий урок: [08. Массивы и slices](08-slices-arrays.md).
