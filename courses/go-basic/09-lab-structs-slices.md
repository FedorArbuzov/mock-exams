# 09. Лаба: structs и slices (shop)

## Зачем эта лаба

Лаба соединяет structs и slices в одном сквозном примере — каталог товаров и корзина:

```text
[]Product (каталог)  →  filter / find  →  Cart (slice + методы)  →  total cents
```

Задания закрепляют фильтрацию slice без мутации исходных данных (задание 4) и накопление элементов через `append` (задание 3).

## Предварительно

- Прочитаны [07. Structs](07-structs.md) и [08. Slices](08-slices-arrays.md).
- Рабочая директория:

```bash
cd courses/go-basic/examples
go version
```

Модуль `github.com/mock-exams/go-basic-labs`. Эталоны — `examples/solutions/` — после попытки.

---

## Подготовка: тип Product

Создайте пакет `lab/09shop` (один каталог с несколькими файлами **или** один `main.go` — на курсе допустим один файл для простоты).

Базовые типы:

```go
package main

type Product struct {
	ID         int64
	Title      string
	PriceCents int64
	Category   string
	InStock    bool
}

func catalog() []Product {
	return []Product{
		{ID: 1, Title: "Keyboard", PriceCents: 7999, Category: "electronics", InStock: true},
		{ID: 2, Title: "Mouse", PriceCents: 2999, Category: "electronics", InStock: true},
		{ID: 3, Title: "Desk", PriceCents: 19900, Category: "furniture", InStock: false},
	}
}
```

---

## Задание 1. Обзор каталога

**Контекст:** CLI `go run ./lab/09shop` как offline snapshot каталога.

В `main`:

```go
func main() {
	products := catalog()
	fmt.Println("count:", len(products))
	fmt.Println("first:", products[0].Title)
	fmt.Println("categories:", uniqueCategories(products))
}
```

Реализуйте `uniqueCategories(products []Product) []string` — уникальные категории, порядок первого появления. Без `map` (тема будущей главы) или с `map` — по желанию.

**Критерий:** `count: 3`, `first: Keyboard`, две категории `electronics`, `furniture`.

```bash
go run ./lab/09shop
```

---

## Задание 2. Filter и поиск

**Контекст:** блок «Electronics in stock» — фильтрация каталога по категории и цене.

```go
func filterByCategory(products []Product, category string) []Product {
	// новый slice, не мутировать products
}

func titlesUnderPrice(products []Product, maxCents int64) []string {
	// title где PriceCents < maxCents
}
```

Проверка в `main`:

```go
fmt.Println(len(filterByCategory(products, "electronics"))) // 2
fmt.Println(titlesUnderPrice(products, 5000))                 // [Mouse]
```

**Критерий:** `filterByCategory` не меняет длину исходного `catalog()` при повторном вызове.

---

## Задание 3. Корзина через append

**Контекст:** корзина как `Cart` со slice элементов, наполняемый через `append`.

```go
type CartItem struct {
	Product  Product
	Quantity int
}

type Cart struct {
	Items []CartItem
}

func (c *Cart) Add(p Product, qty int) {
	// append CartItem; pointer receiver — preview methods
}

func (c Cart) TotalCents() int64 {
	var sum int64
	for _, it := range c.Items {
		sum += it.Product.PriceCents * int64(it.Quantity)
	}
	return sum
}
```

В `main`: добавьте Keyboard x2 и Mouse x1, выведите `TotalCents`.

**Критерий:** `15998 + 2999 = 18997` (проверьте арифметику). Используйте `*Cart` для `Add`.

---

## Задание 4. Скидка без мутации каталога

**Контекст:** промо -10% на electronics — исходный slice в «кэше» не должен измениться.

```go
func applyDiscountCopy(products []Product, category string, percent int) []Product {
	out := make([]Product, len(products))
	copy(out, products)
	for i := range out {
		if out[i].Category == category {
			discount := out[i].PriceCents * int64(percent) / 100
			out[i].PriceCents -= discount
		}
	}
	return out
}
```

В `main`: вызовите на `catalog()`, снова выведите `products[0].PriceCents` из **оригинала** — всё ещё `7999`.

**Критерий:** discounted keyboard `7199` (10% от 7999), оригинал без изменений.

---

## Задание 5. Ловушка shared backing (опционально, но полезно)

**Контекст:** отладка «почему каталог испортился» после subs slice.

В комментарии или отдельной функции `demoSliceTrap()`:

```go
all := catalog()
view := all[:2]
view = append(view, Product{ID: 99, Title: "Hacked", PriceCents: 1})
// что с all? объясните в комментарии
```

Запустите, посмотрите `len(all)` и содержимое. Объясните, когда `append` перестаёт влиять на `all` (cap исчерпан — новый array).

---

## Критерии успеха

- [ ] `go run ./lab/09shop` из `examples/` без ошибок
- [ ] `filterByCategory` / `titlesUnderPrice` с ожидаемым выводом
- [ ] `Cart.TotalCents()` для трёх единиц товара
- [ ] `applyDiscountCopy` не мутирует исходный каталог
- [ ] Комментарий про shared backing (задание 5 или из теории 08)

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `index out of range` | `len(products)` перед `products[0]` |
| Фильтр меняет каталог | Копируйте в новый slice, не `products = products[:0]` |
| Total неверный | `int64` для cents, порядок умножения |
| `cannot define new methods on non-local type` | Методы на `Cart` в package `main` этого файла |
| `go: cannot find main module` | `cd examples`, путь `./lab/09shop` |

Следующий урок (теория): [10. Функции](10-functions.md).
