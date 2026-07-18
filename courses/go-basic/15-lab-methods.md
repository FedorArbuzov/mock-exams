# 15. Лаба: methods для shop service

## Цель лабораторной

Собрать мини-сервис инвентаря shop: struct, **pointer receivers**, methods поверх `map[string]*Product`. Закрепляет methods, maps и structs.

**Время:** ~50–60 минут.  
**Окружение:** `courses/go-basic/examples`, Go 1.22+.

## Подготовка

```bash
cd courses/go-basic/examples
mkdir -p lab/15shop
```

Файл `lab/15shop/main.go` (пакет `main`) или разбейте на `shop/shop.go` + `main.go` в том же модуле.

---

## Задание 1. Типы и конструктор

### Модель

```go
type Product struct {
	SKU      string
	Name     string
	Price    int // копейки, целое
	Quantity int
}

type Shop struct {
	stock map[string]*Product // ключ — SKU
}
```

Реализуйте:

```go
func NewShop() *Shop
```

- Внутри: `stock: make(map[string]*Product)`.
- Возвращает `*Shop`, не value — дальше только pointer receivers.

### Критерии

- [ ] `NewShop().stock` не nil.
- [ ] Нельзя записать в map до `NewShop`.

---

## Задание 2. Methods каталога

На `*Shop` реализуйте:

| Method | Поведение |
|--------|-----------|
| `AddProduct(p Product) error` | Если SKU уже есть — `error`. Иначе сохранить **копию** или указатель на новый `Product` в map (обоснуйте в комментарии). |
| `Get(sku string) (*Product, bool)` | comma ok; не паниковать на пустом SKU. |
| `ListSKUs() []string` | Срез всех ключей; порядок **не** важен. |

### Подсказка ListSKUs

```go
out := make([]string, 0, len(s.stock))
for sku := range s.stock {
	out = append(out, sku)
}
return out
```

### Критерии

- [ ] Дубликат SKU возвращает ошибку, map не меняется.
- [ ] `Get` на отсутствующий SKU → `nil, false`.

---

## Задание 3. Операции склада (мутация)

| Method | Поведение |
|--------|-----------|
| `Restock(sku string, delta int) error` | Нет SKU → error. `delta < 0` и итог `< 0` → error. Иначе `Quantity += delta`. |
| `SetPrice(sku string, price int) error` | `price < 0` → error. Нет SKU → error. |
| `TotalValue() int` | Сумма `Price * Quantity` по всем товарам. |

Все methods — **pointer receiver** `func (s *Shop)`.

### Демонстрация в main

```go
shop := NewShop()
shop.AddProduct(Product{SKU: "TEA", Name: "Tea", Price: 12000, Quantity: 10})
shop.Restock("TEA", 5)
shop.SetPrice("TEA", 13000)
fmt.Println(shop.TotalValue()) // 13000 * 15 = 195000
```

### Критерии

- [ ] `Restock` меняет quantity в map (видно через повторный `Get`).
- [ ] `TotalValue` на пустом shop → `0`.

---

## Задание 4. String для отладки (value receiver)

Добавьте на `Product`:

```go
func (p Product) String() string
```

Формат: `TEA: Tea (13000 kop x 15)` — используйте поля struct. **Value receiver** достаточен (только чтение).

На `*Shop` (опционально):

```go
func (s *Shop) String() string // "Shop: N products"
```

### Вопрос

Почему `String()` на `Product` можно value, а `Restock` — только pointer?

---

## Задание 5 (бонус). Table-driven smoke test

В `shop_test.go` (пакет `shop` или `main` с `_test`):

```go
func TestRestock(t *testing.T) {
	tests := []struct {
		name    string
		delta   int
		wantErr bool
	}{
		{"ok", 5, false},
		{"negative stock", -100, true},
	}
	// ...
}
```

Полный table-driven тест сложнее; здесь достаточно одного case.

---

## Сводный чек-лист

- [ ] `NewShop` инициализирует map
- [ ] `AddProduct` / `Get` / `Restock` с корректными errors
- [ ] Pointer receivers на мутирующих methods
- [ ] `Product.String()` для логов
- [ ] Понимаете method set для `*Shop` vs `Shop`

## Troubleshooting

| Симптом | Причина |
|---------|---------|
| Restock не виден снаружи | value receiver на Shop |
| panic nil map | забыли `NewShop` |
| duplicate не ловится | не проверили `_, ok := s.stock[sku]` |

Следующий урок: [16. Control flow](16-control-flow.md).
