# 35. Лаба: сохранение shop-данных в JSON-файл

Цель — собрать пайплайн **persistence**: структура `Product` с валидацией, `CatalogStore` для CRUD в памяти, чтение и атомарная запись JSON-файла.

```text
Product struct  →  Validate  →  CatalogStore  →  shop.json (atomic)
```

**Время:** ~35–50 минут.

## Стенд

```bash
cd courses/go-basic/examples
go version   # 1.22+
```

Создайте пакет в `lab/35shop/` (или `lab/shopstore/`). Модуль уже объявлен в [`go.mod`](examples/go.mod).

### Целевая структура

```text
examples/lab/35shop/
├── main.go           # flag --data, демо Add/List
├── product.go        # Product, Catalog, ValidateProduct
├── product_test.go   # table-driven validation
├── store.go          # CatalogStore, Load/Save, CRUD
├── fileutil.go       # writeAtomic
└── fileutil_test.go  # atomic write в t.TempDir()
```

```bash
go run ./lab/35shop
```

Эталон после своей попытки — [`examples/solutions/lab/35shop/`](examples/solutions/) (открывайте только после 5–15 минут своей попытки).

---

## Предварительно

- Прочитаны предыдущие главы: JSON, time, файлы и I/O.
- Понимаете `if err != nil` и экспортируемые поля struct.

---

## Модель данных

```go
type Product struct {
	ID          int       `json:"id"`
	SKU         string    `json:"sku"`
	Name        string    `json:"name"`
	Price       float64   `json:"price"`
	Description string    `json:"description,omitempty"`
	InStock     bool      `json:"in_stock"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Catalog struct {
	SchemaVersion int       `json:"schema_version"`
	Products      []Product `json:"products"`
}
```

| Поле | Правила |
|------|---------|
| `schema_version` | константа `1` при сохранении |
| `id` | уникальный, > 0 |
| `sku` | не пустой, уникальный в каталоге |
| `name` | 1–200 символов |
| `price` | ≥ 0 |
| `updated_at` | RFC3339 в JSON |

---

## Задание 1. Валидация `Product`

Файл `product.go`:

```go
package shop

import "time"

var (
	ErrEmptyName  = errors.New("product name is required")
	ErrInvalidID  = errors.New("product id must be positive")
	// TODO: свои sentinel errors для sku, price
)

func ValidateProduct(p Product) error {
	// TODO
	return nil
}
```

**Требования:**

- Пустой `name` → `ErrEmptyName` (или обёртка с контекстом).
- `id <= 0` → ошибка.
- `price < 0` → ошибка.
- Пустой `sku` → ошибка.

**Проверка** — table-driven test `product_test.go` (минимум 4 кейса).

```bash
go test ./lab/35shop/...
```

---

## Задание 2. `CatalogStore` в памяти

Файл `store.go`:

```go
type CatalogStore struct {
	path string
	data Catalog
}

func NewCatalogStore(path string) *CatalogStore {
	return &CatalogStore{
		path: path,
		data: Catalog{SchemaVersion: 1, Products: []Product{}},
	}
}

func (s *CatalogStore) List() []Product {
	// TODO: вернуть копию slice, не внутренний массив
}

func (s *CatalogStore) GetByID(id int) (Product, error) {
	// TODO: ErrNotFound если нет
}

func (s *CatalogStore) Add(p Product) error {
	// TODO: ValidateProduct, проверка дубликата id/sku, UpdatedAt = time.Now().UTC()
}

func (s *CatalogStore) Update(p Product) error {
	// TODO
}

func (s *CatalogStore) Delete(id int) error {
	// TODO
}
```

**Поведение `Add`:**

- Присвоить `UpdatedAt = time.Now().UTC()` если нулевой.
- Отклонить дубликат `id` или `sku`.

**Важно:** `List()` не должен позволять вызывающему коду мутировать внутренний slice снаружи — верните `append([]Product(nil), s.data.Products...)` или копию аналогично.

---

## Задание 3. `Load` и `Save`

В том же `store.go`:

```go
func (s *CatalogStore) Load() error {
	// os.ReadFile(s.path)
	// если os.IsNotExist — пустой каталог, nil error
	// json.Unmarshal
	// если schema_version неизвестен — ошибка с понятным текстом
}

func (s *CatalogStore) Save() error {
	// json.MarshalIndent
	// writeAtomic (функция из задания 4)
}
```

| Ситуация | Поведение |
|----------|-----------|
| Файла нет | пустой каталог, `Load` → `nil` |
| Битый JSON | ошибка, не молчаливый сброс |
| Успешный save | файл `data/shop.json` с отступами 2 пробела |

После каждой мутации (`Add`, `Update`, `Delete`) вызывайте `Save()` — или явно документируйте batch-режим в README лабы.

---

## Задание 4. `writeAtomic`

Файл `fileutil.go`:

```go
func writeAtomic(path string, data []byte, perm os.FileMode) error {
	// MkdirAll для Dir(path)
	// WriteFile path+".tmp"
	// Rename tmp → path
}
```

Реализуйте по паттерну атомарной записи: временный файл + `Rename`. Покройте тестом с `t.TempDir()`.

---

## Задание 5. CLI-демо `main.go`

```go
package main

func main() {
	path := flag.String("data", "data/shop.json", "catalog JSON path")
	flag.Parse()

	store := shop.NewCatalogStore(*path)
	if err := store.Load(); err != nil {
		fmt.Fprintln(os.Stderr, "load:", err)
		os.Exit(1)
	}

	// Демо: Add двух товаров, List, перезапуск должен показать те же данные
}
```

**Ручная проверка:**

```bash
rm -f data/shop.json
go run ./lab/35shop
cat data/shop.json
go run ./lab/35shop   # данные на месте
```

**Ожидаемый фрагмент `data/shop.json`:**

```json
{
  "schema_version": 1,
  "products": [
    {
      "id": 1,
      "sku": "KB-001",
      "name": "Keyboard",
      "price": 79.99,
      "in_stock": true,
      "updated_at": "2024-06-18T10:30:00Z"
    }
  ]
}
```

Пустой `description` **отсутствует** в файле благодаря `omitempty`.

---

## Задание 6 (опционально). Поиск и фильтр

```go
func (s *CatalogStore) Search(keyword string) []Product
func (s *CatalogStore) ListInStock(only bool) []Product
```

Регистронезависимый поиск по `name` и `sku` — `strings.EqualFold` или `strings.Contains(strings.ToLower(...))`.

---

## Критерии успеха

- [ ] `go test ./lab/35shop/...` — зелёные тесты на `ValidateProduct` и `writeAtomic`
- [ ] Первый запуск создаёт `data/shop.json` после добавления товара
- [ ] Второй запуск читает тот же каталог
- [ ] Битый JSON при `Load` → exit 1 в `main` с сообщением в stderr
- [ ] `List()` возвращает копию, не внутренний slice
- [ ] В JSON поля в `snake_case`, пустой `description` отсутствует (`omitempty`)

---

## Troubleshooting

| Симптом | Вероятная причина | Действие |
|---------|-------------------|----------|
| `{}` вместо каталога | struct без экспортируемых полей | заглавные буквы + json tags |
| `updated_at` странная дата | нулевой `time.Time` | выставить `time.Now().UTC()` |
| Файл не там | cwd другой | `pwd`, флаг `--data` |
| `permission denied` | нет каталога `data/` | `MkdirAll` в `writeAtomic` |
| Тесты падают на Windows | путь с `\` | только `filepath.Join` |
| Дубликат id тихо перезаписывает | нет проверки в `Add` | искать по id перед append |

---

## Резюме лабы

Вы связали **модель** (struct + validation), **персистентность** (JSON file + atomic write) и **тесты**.

**Дальше:** [36-interview-qa.md](36-interview-qa.md).
