# 17. Строки, runes и пакет `strings`

## Что вы узнаете

- Строка как **immutable UTF-8** byte sequence.
- **`len`**, индексация, **срезы строк** и риски по границам rune.
- **`rune`** и итерация `for i, r := range s`.
- Пакеты **`strings`** и кратко **`unicode/utf8`**.
- Типичные баги интернационализации и обрезки.

## Строка: тип `string`

```go
s := "Привет"
fmt.Println(len(s)) // 12 байт, не 6 «букв»
```

**Immutable:** нельзя `s[0] = 'X'` — ошибка компиляции. «Изменение» — создание новой строки:

```go
s = "П" + s[1:] // осторожно: режет по байтам!
```

**Zero value** — `""`, не `nil`. Сравнение `==`, `<` — лексикографически по **байтам** (для UTF-8 текста на одном языке часто ок, для полной Unicode-сортировки — `golang.org/x/text/collate`).

### Строковые литералы

```go
plain := "line\n"
raw := `C:\path\to\file` // raw string — без escape кроме `
```

## Байты vs runes

| Концепция | Go тип | Пример |
|-----------|--------|--------|
| Байт | `byte` (`uint8`) | `s[0]` |
| Rune (code point) | `rune` (`int32`) | `'A'`, `'Ж'`, `'🙂'` |
| Строка | `string` | UTF-8 bytes |

```go
import "unicode/utf8"

s := "Go🙂"
fmt.Println(len(s))                    // 6 байт
fmt.Println(utf8.RuneCountInString(s)) // 3 runes: G, o, 🙂
```

**Почему UTF-8:** совместимость с ASCII, экономия памяти для латиницы; цена — переменная длина символа в байтах.

## `range` по строке

```go
for i, r := range "Año" {
	fmt.Printf("index=%d rune=%q\n", i, r)
}
```

`i` — **байтовый** индекс начала rune в строке, не «номер символа». После `ñ` (2 байта) индекс прыгает.

**Идиома:** обход по runes без индекса байтов:

```go
for _, r := range s {
	if r == '€' {
		// ...
	}
}
```

### Преобразование string ↔ []rune ↔ []byte

```go
runes := []rune("Привет")
s2 := string(runes)

bytes := []byte("ASCII")
s3 := string(bytes)
```

`[]rune(s)` декодирует UTF-8 в слайс code points. `string(runes)` кодирует обратно.

## Срезы строк

```go
s := "hello"
fmt.Println(s[1:4]) // "ell"
```

Срез строки — **новая строка**, разделяющая backing array (как slice).

**ОПАСНО для Unicode:**

```go
name := "Василий"
bad := name[:3] // режет середину UTF-8 руны — invalid UTF-8 в подстроке
```

Безопасная обрезка по **числу runes**:

```go
func truncateRunes(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}
```

Для production UI — также `unicode/utf8.ValidString` и нормализация NFC.

## Пакет `strings`

Импорт: `import "strings"`.

### Поиск и проверка

```go
strings.Contains("hello", "ell")   // true
strings.HasPrefix("hello", "he")   // true
strings.HasSuffix("hello", "lo")   // true
strings.Index("hello", "l")        // 2 (байтовый индекс)
strings.Count("banana", "a")       // 3
```

### Изменение (возвращают новую строку)

```go
strings.ToUpper("Привет")
strings.ToLower("Привет")
strings.TrimSpace("  x  ")
strings.Trim("///path///", "/")
strings.Replace("foo foo", "foo", "bar", 1) // одна замена
strings.ReplaceAll("foo foo", "foo", "bar")
```

### Разбиение и склейка

```go
parts := strings.Split("a,b,c", ",")     // []string{"a","b","c"}
strings.SplitN("a:b:c", ":", 2)          // ["a", "b:c"]
joined := strings.Join(parts, "-")       // "a-b-c"
```

`strings.Split` возвращает slice.

### Builder для конкатенации в цикле

```go
var b strings.Builder
for _, w := range words {
	b.WriteString(w)
	b.WriteByte(' ')
}
result := b.String()
```

**Почему не `s += w` в цикле:** каждая конкатенация аллоцирует новую строку O(n²). `Builder` — амортизированно линейно.

```go
b.Grow(estimatedSize) // опционально
```

## `strings` vs `fmt`

| Задача | Инструмент |
|--------|------------|
| Склейка известных полей | `fmt.Sprintf("%s: %d", sku, price)` |
| Много частей в цикле | `strings.Builder` |
| Простая конкатенация 2–3 | `a + b` |

## `byte` и `strings` в IO (preview)

Чтение файлов и HTTP body часто `[]byte` → `string(data)` копирует или использует unsafe в оптимизациях. Для JSON полей — struct tags.

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| `s[i]` как «символ» | байт | `range` или `[]rune` |
| `name[:30]` для лимита UI | режет UTF-8 | truncate по runes |
| `len` для лимита символов | байты | `utf8.RuneCountInString` |
| `+=` в цикле | квадратичная аллокация | `strings.Builder` |
| Сравнить string с `[]byte` без конверсии | разные типы | `string(b)` или `bytes.Equal` |
| `strings.Index` как rune index | байты | `utf8.DecodeRuneInString` |

## В продакшене

- Лимиты длины в API — в **runes** или графемах (библиотеки), не в байтах.
- Логи и метрики: не полагайтесь на `len` для «видимой длины».
- Нормализация Unicode перед сравнением паролей/никнеймов — security checklist.

## Резюме

**String** — immutable UTF-8 bytes; **`len`** и **`s[i]`** — байты. **`rune`** — code point; **`for range`** по строке даёт `(byteIndex, rune)`. Пакет **`strings`** — Contains, Split, Join, Replace, Builder. Срезы строк режут по байтам — опасны для не-ASCII. Нет неявной конкатенации с числами — только явные преобразования.

## Чек-лист

- Чему равно `len("🙂")` в Go и почему?
- Что возвращает `for i, r := range s` для `i`?
- Как безопасно обрезать строку до 10 «символов»?
- Зачем `strings.Builder` вместо `+=` в цикле?
- Чем `byte` отличается от `rune`?
- Почему `strings.Index` не всегда подходит для UI-позиции курсора?

Следующий урок: [18. Лаба: control flow](18-lab-control-flow.md).
