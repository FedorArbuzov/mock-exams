# 08. Массивы и slices: length, capacity, append, copy

## Что вы узнаете

- **Массив** `[N]T` — фиксированный размер, value type.
- **Slice** `[]T` — длина, ёмкость, ссылка на массив.
- **`append`** — когда растёт cap и когда новый backing array.
- **`copy`** — явное копирование элементов.
- **Срезы** `s[i:j:k]` — три индекса (full slice expression).
- Идиомы: итерация, preallocate, не мутировать shared slice.

## Массив — фиксированная длина

```go
var a [3]int           // [0 0 0]
a[0] = 10
fmt.Println(len(a))    // 3 — всегда

b := [2]string{"go", "shop"}
// c := [2]int{1, 2, 3}  // ошибка: too many elements
```

Размер — **часть типа**: `[3]int` и `[4]int` — разные типы, нельзя присвоить друг другу.

```go
type Row [5]byte // иногда для протоколов
```

В application коде массивы реже slices — except `[...]int{1,2,3}` для компиляторного подсчёта:

```go
nums := [...]int{1, 2, 3} // len 3
```

## Slice — динамическое «окно»

```go
s := []int{10, 20, 30}
fmt.Println(len(s), cap(s)) // 3 3

s = append(s, 40)
fmt.Println(s, len(s), cap(s)) // может cap удвоиться
```

Внутренне slice — структура (упрощённо):

```text
ptr → | 10 | 20 | 30 | 40 | ... |  // backing array
len = 4
cap = 6 (например)
```

| | Array `[n]T` | Slice `[]T` |
|--|--------------|-------------|
| Размер | фиксирован | динамический |
| Присваивание | копия всего массива | копия дескриптора (ptr,len,cap) |
| В функцию | копия массива | копия дескриптора — общий backing |

## Создание slice

```go
var s1 []int              // nil slice, len 0, cap 0
s2 := []int{}             // empty, non-nil (обычно)
s3 := make([]int, 5)      // len 5, cap 5, нули
s4 := make([]int, 0, 10)  // len 0, cap 10 — preallocate

fmt.Println(s1 == nil, len(s1)) // true, 0
fmt.Println(s2 == nil)          // false
```

`nil` slice — валидный: `len` 0, `append` работает.

## append

```go
items := []string{"keyboard"}
items = append(items, "mouse")
items = append(items, "desk", "lamp")

more := []string{"cable"}
items = append(items, more...) // spread another slice
```

**Важно:** `append` может выделить **новый** массив, если `len+add > cap`. Результат нужно **присвоить** обратно:

```go
s := []int{1, 2}
append(s, 3)     // не ошибка компиляции — но результат отброшен, s не изменился
s = append(s, 3) // OK
```

Если ёмкости хватает, `append` пишет в **тот же** backing array — другие slice с тем же array увидят изменения:

```go
a := []int{1, 2, 3}
b := a[:2]        // [1 2], общий backing
b = append(b, 99) // может перезаписать a[2] если cap позволяет
fmt.Println(a, b)
```

## copy

```go
src := []int{1, 2, 3}
dst := make([]int, len(src))
n := copy(dst, src)
fmt.Println(n, dst) // 3 [1 2 3]
```

`copy` копирует **min(len(dst), len(src))** элементов. Не дублирует backing array — только значения.

Иммутабельное обновление каталога:

```go
func addItem(cart []string, sku string) []string {
	out := make([]string, len(cart), len(cart)+1)
	copy(out, cart)
	return append(out, sku)
}
```

## Срезы slicing

```go
s := []int{0, 10, 20, 30, 40}
fmt.Println(s[1:4])    // [10 20 30], len 3
fmt.Println(s[:2])     // [0 10]
fmt.Println(s[2:])     // [20 30 40]

// full slice expression (ограничивает cap)
t := s[1:3:4]          // len 2, cap 3 (до индекса 4)
```

Индексы: `[low:high]` — high **не включается**. Отрицательных индексов нет.

**Ловушка:** subs slice держит **весь** backing array в памяти:

```go
big := make([]byte, 1<<20) // 1 MB
small := big[:10]
_ = small // big backing не GC, пока small жив
```

Решение: `copy` в новый маленький slice.

## Итерация

```go
products := []Product{{ID: 1}, {ID: 2}}
for i, p := range products {
	fmt.Println(i, p.ID)
}

for _, p := range products {
	_ = p
}

// только индексы
for i := range products {
	_ = i
}
```

`range` копирует **значение** элемента — для больших struct используйте индекс или указатель:

```go
for i := range products {
	products[i].Title = "x" // OK
}
```

## []Product в shop API

```go
type Product struct {
	ID    int64
	Title string
}

func filterInStock(all []Product) []Product {
	out := make([]Product, 0)
	for _, p := range all {
		if p.InStock {
			out = append(out, p)
		}
	}
	return out
}
```

## Типичные ошибки

**Забыть присвоить результат `append`.** Старый slice не обновится.

**Мутировать slice из кэша.** Всегда копируйте перед `append`/`sort` если данные shared.

**Путать `nil` и empty slice в JSON.** `null` vs `[]` — разное; `omitempty` на поле slice.

**Использовать array вместо slice в API.** Почти всегда `[]T`.

**Subs slice большого буфера.** Утечка памяти — `copy` в новый slice.

**range по struct и мутация `p.Field`.** Меняется копия, не элемент.

## Резюме

**Массив** — value с фиксированным размером; **slice** — гибкий вид на массив с `len` и `cap`. **`append`** и **`copy`** — основные инструменты; срезы делят backing array, пока не перераспределят. Для shop-каталога и корзины slices — ежедневная структура; лаба 09 соберёт Product + Cart end-to-end.

## Чек-лист

- [ ] Объяснили разницу `[3]int` и `[]int`
- [ ] Знаете, когда `append` создаёт новый backing array
- [ ] Используете `make([]T, 0, n)` для preallocate
- [ ] Копируете slice перед мутацией shared данных
- [ ] Понимаете `s[low:high]` и что high исключён
- [ ] В `range` мутируете через индекс, не через value copy

Следующий урок: [09. Лаба: structs и slices](09-lab-structs-slices.md).
