# 02. Structs, slices, maps

## Struct — модель данных

```go
type Product struct {
    ID    string
    Name  string
    Price float64
}

p := Product{ID: "kb-1", Name: "Keyboard", Price: 79.99}
p.Price = 69.99
```

**Вложенность** (композиция вместо наследования):

```go
type LineItem struct {
    Product Product
    Qty     int
}
```

Теги struct (`json:"name"`) — в [08-json-files-time.md](08-json-files-time.md).

## Array vs slice

**Array** — фиксированная длина: `[3]int`. В API почти не используется.

**Slice** — динамический вид на массив:

```go
items := []string{"a", "b"}
items = append(items, "c")

sub := items[1:3] // срез, разделяет backing array — осторожно при мутациях
```

| Операция | Пример |
|----------|--------|
| длина | `len(s)` |
| ёмкость | `cap(s)` |
| копия | `copy(dst, src)` |
| append | `s = append(s, x)` |

Нулевой slice — `nil`; `append` на `nil` работает. Пустой slice: `[]int{}` или `make([]int, 0)`.

## Map

```go
prices := map[string]float64{
    "kb-1": 79.99,
}
prices["ms-2"] = 29.99

v, ok := prices["kb-1"] // ok == true
delete(prices, "ms-2")

for id, price := range prices {
    _ = id
    _ = price
}
```

**Нулевой map — `nil`:** запись в `nil` map **паникует**. Создавайте через `make` или литерал:

```go
m := make(map[string]int)
```

## Когда что использовать

| Структура | Когда |
|-----------|-------|
| struct | фиксированный набор полей с разными типами |
| slice | упорядоченный список |
| map | быстрый lookup по ключу |

В `go-intermediate` те же типы лягут в слой repository и DTO.

## Типичные ошибки

- Мутация среза, который ещё кто-то держит — неожиданные побочные эффекты.
- `append` без присваивания: `append(s, x)` без `s =` — результат потерян.
- Итерация по `nil` slice/map — безопасна (0 итераций), запись в `nil` map — нет.

## Чек-лист

- [ ] Объявили struct и slice, сделали `append`
- [ ] Создали map через `make`, проверили `ok` при чтении

Дальше: [03. Функции, указатели, methods](03-functions-pointers-methods.md).
