# 32. encoding/json: Marshal, Unmarshal, struct tags

## Что узнаете

- Как `json.Marshal` и `json.Unmarshal` работают со struct, slice, map.
- Правило **экспортируемых полей** и почему `name` не попадёт в JSON.
- Теги: `json:"field_name"`, `omitempty`, `-`, вложенные struct.
- `json.RawMessage`, `json.Number`, указатели для optional-полей.

---

## Базовый пример: Marshal и Unmarshal

```go
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
)

type Product struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

func main() {
	p := Product{ID: 1, Name: "Keyboard", Price: 79.99}

	data, err := json.Marshal(p)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(data))
	// {"id":1,"name":"Keyboard","price":79.99}

	var decoded Product
	if err := json.Unmarshal(data, &decoded); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%+v\n", decoded)
}
```

| Функция | Назначение |
|---------|------------|
| `json.Marshal(v)` | Go-значение → `[]byte` JSON |
| `json.MarshalIndent(v, prefix, indent)` | с отступами для файлов и логов |
| `json.Unmarshal(data, &v)` | `[]byte` → заполняет **указатель** на значение |
| `json.NewEncoder(w).Encode(v)` | запись в `io.Writer` (HTTP, файл) |
| `json.NewDecoder(r).Decode(&v)` | чтение из `io.Reader` |

**Идиома ошибок:** всегда `if err != nil`.

---

## Экспортируемые поля — жёсткое правило

Пакет `encoding/json` видит только поля, **начинающиеся с заглавной буквы**:

```go
type Bad struct {
	Name  string // в JSON: "Name" (если без тега) — OK
	email string // НИКОГДА не сериализуется и не десериализуется
}
```

В публичном API и DTO поля делают экспортируемыми и задают JSON-имя тегом:

```go
type User struct {
	Email string `json:"email"` // в JSON ключ "email", в Go поле Email
}
```

---

## Struct tags: имя поля, omitempty, игнор

Тег — строка в обратных кавычках после имени поля. Парсер тегов: `reflect.StructTag`.

```go
type Product struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	InternalSKU string   `json:"internal_sku"`
	Tags        []string `json:"tags,omitempty"`
	Secret      string   `json:"-"` // не попадает ни в Marshal, ни в Unmarshal
}
```

### `omitempty`

Поле **пропускается**, если значение «пустое»:

| Тип | «Пустое» для omitempty |
|-----|-------------------------|
| числа | `0` |
| string | `""` |
| bool | `false` |
| slice, map, pointer | `nil` |
| struct | никогда* (нулевой struct — не omitempty по умолчанию) |

\* Для вложенного struct с нулевыми полями поведение зависит от версии и вложенности; для optional лучше **указатель** `*string`, `*time.Time`.

```go
p := Product{ID: 1, Name: "Mouse", Description: ""}
b, _ := json.Marshal(p)
// {"id":1,"name":"Mouse","internal_sku":""}
// description отсутствует — omitempty
```

**На собесе:** `omitempty` не значит «не задано в запросе» при Unmarshal — отсутствующий ключ просто не трогает поле в Go (останется zero value).

### Переименование и snake_case

```go
InternalSKU string `json:"internal_sku"`
```

Без тега Go отдал бы `"InternalSKU"` — не совпадёт с ожидаемым именем поля на другой стороне.

### Игнор поля: `json:"-"`

Пароли, внутренние флаги, derived fields — не отдавать клиенту.

---

## Unmarshal: указатель обязателен

```go
var p Product
err := json.Unmarshal(data, &p) // &p — адрес struct
```

Передача `p` без `&` — ошибка компиляции или запись «в никуда». Для вложенного обновления:

```go
type Order struct {
	Items []Product `json:"items"`
}
```

`Unmarshal` **заменяет** slice целиком, не append к существующим элементам (если не nil pointer на slice — см. документацию: для `*[]T` может append).

---

## MarshalIndent для файлов и логов

```go
data, err := json.MarshalIndent(products, "", "  ")
if err != nil {
	return err
}
// [
//   {
//     "id": 1,
//     "name": "Keyboard"
//   }
// ]
```

Такой формат удобен для сохранения в файл — читаемо в Git diff.

---

## Вложенные struct и анонимное встраивание

```go
type Timestamps struct {
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

type Product struct {
	ID int `json:"id"`
	Timestamps
	Name string `json:"name"`
}
```

Встроенные поля **промоутятся** на верхний уровень JSON (если нет конфликта имён):

```json
{"id":1,"created_at":"2024-06-18T10:00:00Z","name":"Keyboard"}
```

---

## map[string]any и динамический JSON

Когда схема неизвестна (прокси, отладка):

```go
var raw map[string]any
if err := json.Unmarshal(data, &raw); err != nil {
	return err
}
name, _ := raw["name"].(string) // type assertion — может panic без ok
```

| Подход | Когда |
|--------|-------|
| Typed struct | стабильный контракт API, shop-модель |
| `map[string]any` | разовый парсинг, миграция |
| `json.RawMessage` | отложенный парсинг части документа |

```go
type Envelope struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}
```

---

## Указатели и optional-поля

Чтобы отличить «не передано» от «передано пустое» в **ответах** иногда используют указатель:

```go
type Product struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}
```

- `Description == nil` → ключ отсутствует (с omitempty).
- `Description` указывает на `""` → `"description":""` в JSON.

Для входящих API такие поля чаще валидируют явно; здесь достаточно понимать паттерн.

---

## Кастомный MarshalJSON / UnmarshalJSON

Тип реализует интерфейсы:

```go
type Money int // копейки

func (m Money) MarshalJSON() ([]byte, error) {
	return json.Marshal(float64(m) / 100)
}
```

Используйте редко — сначала struct tags. Нужно при нестандартном формате (деньги, enum как строка).

---

## Encoder / Decoder vs Marshal

Для **потоков** (большой файл, HTTP body):

```go
enc := json.NewEncoder(os.Stdout)
enc.SetIndent("", "  ")
if err := enc.Encode(products); err != nil {
	return err
}
```

`Encode` добавляет перевод строки после значения. Для файлов часто проще `MarshalIndent` + `os.WriteFile`.

---

## Типичные ошибки

1. **Забыли `&` в Unmarshal** — одна из первых ошибок новичка.

2. **Несовпадение имён** — `json:"product_id"` в Go, а API шлёт `productId`. Решение: явный тег с точным именем поля.

3. **`omitempty` на bool** — `false` исчезает из JSON; клиент не отличит «false» от «не задано».

4. **Unmarshal в interface{}** — числа становятся `float64`, не `int`. Для JSON из API используйте struct.

5. **Циклические ссылки в map/struct** — `Marshal` вернёт ошибку `unsupported value`.

6. **HTML в JSON без экранирования** — `json.Marshal` экранирует; вручную конкатенировать JSON строку нельзя (инъекции, битый формат).

7. **Большой `[]byte` в памяти** — для гигантских файлов — `Decoder` по частям; для shop-каталога в basic — достаточно `ReadFile` + `Unmarshal`.

8. **Неизвестные поля в JSON** — по умолчанию `Unmarshal` **молча игнорирует** лишние ключи. Для строгого контракта:

```go
dec := json.NewDecoder(bytes.NewReader(data))
dec.DisallowUnknownFields()
if err := dec.Decode(&catalog); err != nil {
	return fmt.Errorf("strict decode: %w", err)
}
```

9. **Неверный тип в JSON** — `Unmarshal` возвращает `*json.UnmarshalTypeError` с полями `Field`, `Value`, `Type`:

```go
var p Product
err := json.Unmarshal([]byte(`{"id":"not-a-number"}`), &p)
var typeErr *json.UnmarshalTypeError
if errors.As(err, &typeErr) {
	fmt.Println(typeErr.Field) // id
}
```

---

## В проде

- **Контракт первым:** поля и имена согласуют с OpenAPI / клиентом до написания handler.
- **Не логировать секреты** — тег `json:"-"` + не класть в struct для логов.
- **Версионирование:** поле `schema_version` в файле persistence — упрощает миграции.
- **Тесты:** golden file `testdata/products.json` + `json.Unmarshal` в table-driven test.

---

## Резюме

`encoding/json` связывает Go-типы с проводным форматом. Экспортируемые поля + теги `json` — основной инструмент. `Marshal`/`Unmarshal` всегда с проверкой `err`. `omitempty` убирает нулевые значения из вывода, но не заменяет продуманную модель optional-полей.

---

## Чек-лист

- [ ] Могу объяснить, почему поле `sku` не попало в JSON
- [ ] Знаю разницу `json:"x"` и `json:"x,omitempty"`
- [ ] Пишу `Unmarshal(data, &v)` с указателем
- [ ] Выбираю struct для контракта, `map[string]any` — только для разового разбора
- [ ] Помню: числа в `interface{}` после Unmarshal — `float64`, не `int`

**Дальше:** [33-time.md](33-time.md) — `time.Time` и RFC3339 в JSON.
