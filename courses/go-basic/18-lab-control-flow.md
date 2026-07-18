# 18. Лаба: control flow и строки

## Цель лабораторной

Закрепить control flow и строки: `switch` по статусам, `for range`, парсинг строк, безопасная обрезка по runes.

**Время:** ~45–55 минут.  
**Окружение:** `courses/go-basic/examples`, Go 1.22+.

## Подготовка

```bash
cd courses/go-basic/examples
mkdir -p lab/18control
```

Файл `lab/18control/main.go`.

---

## Задание 1. Статусы заказа: `switch`

### Модель

```go
type Order struct {
	ID     string
	Status string // "new", "paid", "shipped", "cancelled"
	Total  int
}
```

Функция `func NextAction(o Order) string`:

| Status | Возврат |
|--------|---------|
| `new` | `"await_payment"` |
| `paid` | `"pack"` |
| `shipped` | `"none"` |
| `cancelled` | `"none"` |
| иное | `"unknown"` |

Используйте **`switch o.Status`**, не цепочку `if` (для тренировки). В `default` обработайте неизвестный статус.

### Критерии

- [ ] Все пять веток покрыты тестом в `main` через table slice.
- [ ] Нет `fallthrough`.

---

## Задание 2. Фильтр заказов: `for range`

Вход: `[]Order`. Функция `func PaidTotal(orders []Order) int` — сумма `Total` только для `Status == "paid"`.

```go
orders := []Order{
	{ID: "1", Status: "paid", Total: 1000},
	{ID: "2", Status: "new", Total: 500},
	{ID: "3", Status: "paid", Total: 200},
}
// ожидается 1200
```

### Критерии

- [ ] Пустой slice → `0`.
- [ ] Используется `for _, o := range orders`.

---

## Задание 3. Парсинг CSV-строки SKU

Строка формата `"SKU1:10,SKU2:5,SKU3:0"` — пары SKU:quantity через запятую.

Реализуйте `func ParseStockLine(line string) (map[string]int, error)`:

1. `strings.TrimSpace` на всю строку; пустая → пустой map, не error.
2. `strings.Split` по `,`.
3. Каждая часть: `strings.SplitN(part, ":", 2)` — ровно два поля.
4. Quantity — `strconv.Atoi`; ошибка формата → `error`.
5. Отрицательное quantity → error.

### Пример

```go
m, err := ParseStockLine("TEA:10,COFFEE:5")
// map[TEA:10 COFFEE:5]
```

### Критерии

- [ ] Неверный формат `"TEA-10"` → error.
- [ ] Дубликат SKU в строке — последнее значение побеждает (или верните error — задокументируйте в комментарии).

---

## Задание 4. Truncate display name

`func TruncateDisplay(name string, maxRunes int) string` — обрезка до `maxRunes` **runes**, не байт.

```go
TruncateDisplay("Василий", 3)   // "Вас"
TruncateDisplay("hello", 10)    // "hello"
TruncateDisplay("Go🙂", 3)      // "Go🙂"
TruncateDisplay("Go🙂", 2)      // "Go" (без половины эмодзи)
```

Используйте `[]rune(name)` или `range` с подсчётом.

### Критерии

- [ ] `maxRunes <= 0` → `""`.
- [ ] Нет invalid UTF-8 в результате для тестов выше.

---

## Задание 5 (бонус). Command loop

`func REPL()` читает строки из stdin (`fmt.Scanln` или `bufio.Scanner`):

- `quit` — выход из `for {}`.
- `total <csv-line>` — парсит строку из задания 3, печатает сумму quantities.
- иное — `unknown command`.

Демонстрация `for` как REPL.

---

## Сводный чек-лист

- [ ] `switch` по статусам заказа
- [ ] `PaidTotal` с `range`
- [ ] `ParseStockLine` с `strings` + `strconv`
- [ ] `TruncateDisplay` по runes
- [ ] Понимаете разницу байт/rune на примере эмодзи

## Troubleshooting

| Симптом | Причина |
|---------|---------|
| кракозябры в truncate | срез по байтам |
| `Atoi` падает | не проверили err |
| switch всегда default | опечатка в статусе, регистр |

Следующий урок: [19. Преобразование типов](19-type-conversions.md).
