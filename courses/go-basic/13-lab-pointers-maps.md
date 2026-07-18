# 13. Лаба: указатели и maps

## Цель лабораторной

Закрепить указатели и maps на практике: мутация struct через указатель, безопасная работа с `nil` map, индекс SKU → количество. После лабы вы объясните, **почему** `addStock(p Product)` не меняет оригинал и **почему** `var m map[string]int` паникует при записи.

**Время:** ~45–55 минут.  
**Окружение:** Go 1.22+, модуль [`examples/`](examples/go.mod).

## Подготовка

```bash
cd courses/go-basic/examples
go version   # go1.22+
mkdir -p lab/13pointersmaps
```

Создайте пакеты `main` в подкаталогах или один файл `lab/13pointersmaps/main.go` с функциями из заданий. Запуск:

```bash
go run ./lab/13pointersmaps
```

---

## Задание 1. Инвентарь: указатель на Product

### Сценарий

Мини-склад shop хранит `Product`. Нужна функция `restock`, увеличивающая `Quantity` **у caller'а**.

### Типы

```go
type Product struct {
	SKU      string
	Quantity int
}

// TODO: restock(p *Product, delta int)
```

### Пошагово

1. Реализуйте `restock` с receiver-логикой через указатель (функция, не method — methods разбираются позже).
2. В `main`: `p := Product{SKU: "TEA-01", Quantity: 10}` → `restock(&p, 5)` → печать `20` не должна быть; ожидается `15`.
3. Добавьте вызов с `delta < 0` при `Quantity+delta < 0` — **не** уходить в минус, вернуть `error`.

### Критерии

- [ ] После `restock(&p, n)` меняется `p.Quantity` снаружи.
- [ ] `restock(p, n)` **без** `&` в тесте руками — количество не меняется (закомментируйте демонстрацию).
- [ ] Отрицательный остаток блокируется с `error`.

### Типичные ошибки

| Симптом | Причина |
|---------|---------|
| Quantity не меняется | параметр `Product`, не `*Product` |
| panic | разыменование nil `*Product` |

---

## Задание 2. Price cache: map и comma ok

### Сценарий

Кэш цен `map[string]int` — ключ SKU. Функция `getPrice(cache map[string]int, sku string) (int, bool)` возвращает цену и флаг наличия.

### Требования

1. `getPrice` не паникует на `nil` cache — чтение из nil map допустимо.
2. Функция `setPrice(cache map[string]int, sku string, price int) error` — если `cache == nil`, вернуть ошибку `"cache not initialized"`, иначе записать.
3. В `main` покажите: неинициализированный cache + `setPrice` → ошибка; `make(map[string]int)` + `setPrice` → ok.

### Проверка

```go
var cache map[string]int
err := setPrice(cache, "A1", 100) // err != nil

cache = make(map[string]int)
setPrice(cache, "A1", 100)
price, ok := getPrice(cache, "A1") // 100, true
_, ok = getPrice(cache, "MISSING")  // 0, false
```

### Критерии

- [ ] comma ok отличает отсутствие ключа от цены `0`.
- [ ] Запись в nil map не выполняется — ошибка до присваивания.

---

## Задание 3. Merge inventory

### Сценарий

Два склада отдали `map[string]int` (SKU → qty). Нужна `mergeStock(a, b map[string]int) map[string]int` — **новая** map с суммой по ключам (ключ только в `b` — тоже в результате).

### Подсказка

```go
out := make(map[string]int, len(a)+len(b))
for sku, q := range a {
	out[sku] = q
}
for sku, q := range b {
	out[sku] += q
}
return out
```

### Критерии

- [ ] Исходные `a` и `b` не мутируются.
- [ ] Ключи только из `b` присутствуют.
- [ ] Дубликаты суммируются.

---

## Задание 4. In-memory index (бонус)

Реализуйте `type StockIndex struct { items map[string]*Product }` с методами:

- `NewStockIndex() *StockIndex` — map инициализирован через `make`.
- `Get(sku string) (*Product, bool)` — comma ok.
- `Upsert(p *Product) error` — если `p == nil`, error; иначе сохранить указатель в map.

**Вопрос для самопроверки:** если caller потом меняет `p.Quantity` снаружи, изменится ли то, что вернёт `Get`? Почему?

Ответ связывает указатели и maps.

---

## Сводный чек-лист лабы

- [ ] `restock` работает только с `*Product`
- [ ] `setPrice` защищает от nil map
- [ ] `getPrice` использует comma ok
- [ ] `mergeStock` возвращает новую map
- [ ] Можете устно объяснить nil map vs `make`

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| `go: cannot find module` | `cd examples`, проверьте `go.mod` |
| panic nil map | `make` перед записью |
| merge «съел» ключи | второй цикл по `b` с `+=` |

Следующий урок: [14. Methods и receivers](14-methods.md).
