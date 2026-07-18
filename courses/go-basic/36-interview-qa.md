# 36. Interview Q&A: топ-30 вопросов по Go (basic)

## Введение: зачем эта глава

На собеседовании по Go джуниора чаще просят **объяснить поведение кода**, разницу slice и array, как обрабатываются ошибки, что будет при `go` в цикле — а не «перечислите ключевые слова». Эта глава — **развёрнутые ответы** к вопросам из [interview-cheatsheet.md](interview-cheatsheet.md).

**Как работать с главой:**

1. Прочитайте вопрос, **закройте** ответ и ответьте вслух 1–2 минуты.
2. Откройте разбор и сравните: не только «что», но и **почему**.
3. Провалились — вернитесь к уроку из колонки «Где в курсе».

---

## Блок 1. Основы языка и типы

### 1. Чем Go отличается от Python/JavaScript «в двух словах»?

**Ответ.** Статическая типизация, компиляция в нативный бинарник, встроенная concurrency (goroutines) — но на basic уровне важнее: **явные ошибки** (`error` return вместо exceptions), **простой синтаксис** без наследования классов, **композиция** через struct embedding и interfaces. Один бинарник — простой деплой (важно для DevOps и microservices в mock-exams).

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 2. Что такое zero value?

**Ответ.** Каждый тип имеет **нулевое значение** при объявлении без инициализации:

| Тип | Zero value |
|-----|------------|
| числа | `0` |
| `string` | `""` |
| `bool` | `false` |
| pointer, slice, map, chan, func, interface | `nil` |
| struct | все поля — zero values |

```go
var n int
var s []int
fmt.Println(n, s == nil) // 0 true
```

**Где в курсе:** [02-variables-zero-values.md](02-variables-zero-values.md).

---

### 3. `:=` vs `var` vs `=`?

**Ответ.**

- `x := 10` — короткое объявление с выводом типа (только внутри функций).
- `var x int = 10` — явное объявление; на уровне пакета без `:=`.
- `x = 10` — присваивание уже объявленной переменной.

`:=` требует **хотя бы одну новую** переменную слева: `a, err := f()`.

**Где в курсе:** [02-variables-zero-values.md](02-variables-zero-values.md).

---

### 4. Экспортируемость: почему `name` не виден из другого пакета?

**Ответ.** Идентификатор **экспортируем**, если начинается с **заглавной** буквы (`Name`, `NewStore`). Строчная — видимость только внутри пакета. Это не `public/private` keyword, а соглашение компилятора + `encoding/json`, `go doc`.

**Где в курсе:** [26-packages.md](26-packages.md), [32-json.md](32-json.md).

---

### 5. `new(T)` vs `&T{}`?

**Ответ.** Оба дают `*T`, указывающий на zero value:

```go
p1 := new(int)   // *int → 0
p2 := &int{}     // то же
```

`new` не используется часто; идиома — литерал `&T{Field: v}` для инициализации полей.

**Где в курсе:** [11-pointers.md](11-pointers.md).

---

## Блок 2. Slices, maps, arrays

### 6. Array vs slice?

**Ответ.**

| | Array `[N]T` | Slice `[]T` |
|---|------------|-------------|
| Размер | фиксирован | динамический |
| Передача в функцию | копия всего массива | копия **заголовка** (ptr, len, cap) |
| Тип | `[3]int` ≠ `[4]int` | `[]int` |

Slice — ссылка на underlying array; append может переаллоцировать array.

**Где в курсе:** [08-slices-arrays.md](08-slices-arrays.md).

---

### 7. Что делает `append`?

**Ответ.** Добавляет элементы, при нехватке `cap` выделяет новый массив большего размера, копирует, возвращает **новый slice header** (может отличаться от исходного):

```go
s := []int{1, 2}
s2 := append(s, 3)
```

Всегда присваивайте результат: `s = append(s, x)`. Изменение элементов по индексу может быть видно в обоих slice, если делят array — ловушка при `s1 := s[:2]`.

**Где в курсе:** [08-slices-arrays.md](08-slices-arrays.md).

---

### 8. Как инициализировать map и что будет при записи в `nil` map?

**Ответ.**

```go
var m map[string]int // nil
m["a"] = 1           // panic: assignment to entry in nil map

m = make(map[string]int)
m["a"] = 1           // OK
```

Чтение из nil map возвращает zero value ключа без panic. `len(nil map)` → 0.

**Где в курсе:** [12-maps.md](12-maps.md).

---

### 9. Как безопасно удалить ключ из map?

**Ответ.** `delete(m, key)` — всегда безопасно, даже если ключа нет. Итерация: `for k, v := range m` — порядок **случайный** (намеренно).

**Где в курсе:** [12-maps.md](12-maps.md).

---

### 10. Value receiver vs pointer receiver?

**Ответ.**

| | Value `(t T)` | Pointer `(t *T)` |
|---|---------------|------------------|
| Мутация struct | копия, снаружи не меняется | меняет оригинал |
| Вызов на `T` и `*T` | Go подставит `&` при нужде | Go разыменует при нужде |
| Большие struct | копирование дорого | предпочтителен pointer |

Если метод меняет receiver или struct большой — pointer. Маленькие immutable — value OK.

**Где в курсе:** [14-methods.md](14-methods.md).

---

## Блок 3. Interfaces и ошибки

### 11. Как работают interfaces в Go?

**Ответ.** **Неявная** реализация: тип удовлетворяет interface, если имеет все методы с совместимыми сигнатурами. Нет ключевого слова `implements`. Interface value = (тип, значение). Nil interface — только когда и тип и значение nil — частая ловушка.

```go
type Stringer interface { String() string }
```

**Где в курсе:** [20-interfaces.md](20-interfaces.md).

---

### 12. Пустой interface `any` — зачем?

**Ответ.** `any` = `interface{}` — может хранить значение **любого** типа. Используется в `json.Unmarshal` в `map[string]any`, generic helpers. После извлечения нужен **type assertion**: `v.(string)` или `v, ok := v.(string)`.

**Где в курсе:** [20-interfaces.md](20-interfaces.md), [32-json.md](32-json.md).

---

### 13. Идиома обработки ошибок?

**Ответ.**

```go
result, err := do()
if err != nil {
	return fmt.Errorf("do failed: %w", err)
}
```

Не exceptions (кроме `panic` для программных багов). Вызывающий **обязан** проверить `err`. В HTTP handler — маппинг в статус код *(intermediate)*.

**Где в курсе:** [21-errors.md](21-errors.md).

---

### 14. `%w` в `fmt.Errorf` — зачем?

**Ответ.** Обёртка с сохранением цепочки для `errors.Is` и `errors.As`:

```go
if errors.Is(err, os.ErrNotExist) { ... }
```

Без `%w` — только текст, `Is` не сработает.

**Где в курсе:** [21-errors.md](21-errors.md), [25-errors-is-as.md](25-errors-is-as.md).

---

### 15. `panic` vs `error`?

**Ответ.**

| | `error` | `panic` |
|---|---------|---------|
| Когда | ожидаемые сбои (файл, сеть) | программный баг, невосстановимо |
| Обработка | `if err != nil` | `recover` в defer (редко) |

В библиотеках и HTTP handlers — **не panic** на пользовательский ввод. `json.Unmarshal` возвращает error, не panic.

**Где в курсе:** [23-defer-panic-recover.md](23-defer-panic-recover.md).

---

### 16. Что делает `defer`?

**Ответ.** Откладывает вызов до выхода из окружающей функции (LIFO). Классика: `defer f.Close()`. Аргументы `defer` вычисляются **в момент defer**, не при выполнении.

**Где в курсе:** [23-defer-panic-recover.md](23-defer-panic-recover.md).

---

## Блок 4. Concurrency (обзор basic)

### 17. Goroutine в одном предложении?

**Ответ.** Легковесный поток выполнения, планируемый runtime Go (`go f()`). Не OS thread 1:1. На basic — знать синтаксис и что **нужна синхронизация** для shared state; синхронизация и каналы — тема отдельного продвинутого курса.

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 18. Почему `go` в цикле с замыканием — баг?

**Ответ.** Все goroutines могут увидеть **одну** переменную цикла (до Go 1.22 в `for` была одна переменная). Fix: передать параметр `go func(i int) { ... }(i)` или Go 1.22+ per-iteration vars.

**Где в курсе:** обзор в [01-landscape.md](01-landscape.md).

---

## Блок 5. Пакеты, модули, тесты

### 19. `go mod init` и `go.mod`?

**Ответ.** Модуль — единица версионирования зависимостей. `go.mod` содержит `module path`, `go` version, `require`. `go get` добавляет зависимости; `go mod tidy` чистит неиспользуемые. Импорт: `github.com/org/repo/pkg`.

**Где в курсе:** [27-modules.md](27-modules.md).

---

### 20. Table-driven test — что это?

**Ответ.** Один тест-функция, слайс кейсов `[]struct{ name, input, want }`, цикл `t.Run(tc.name, func(t *testing.T) { ... })`. Идиоматично для Go, покрывает граничные случаи без копипасты.

**Где в курсе:** [28-testing.md](28-testing.md).

---

### 21. `go test ./...` и `-race`?

**Ответ.** `./...` — все пакеты рекурсивно. `-race` — race detector (замедляет, для CI). `-cover` — покрытие. Тесты в `*_test.go`, функции `TestXxx(t *testing.T)`.

**Где в курсе:** [28-testing.md](28-testing.md).

---

### 22. `go vet` — зачем?

**Ответ.** Статический анализ: подозрительные конструкции (`Printf` с неверной вербой, unreachable code). Запускают до merge; дополняет `staticcheck` / `golangci-lint` — [30-tooling.md](30-tooling.md).

**Где в курсе:** [30-tooling.md](30-tooling.md).

---

## Блок 6. JSON, время, файлы

### 23. Почему поле не попало в JSON?

**Ответ.** (1) неэкспортируемое поле; (2) тег `json:"-"`; (3) `omitempty` и zero value; (4) забыли Marshal. Проверяйте заглавную букву и теги.

**Где в курсе:** [32-json.md](32-json.md).

---

### 24. Как форматировать дату в Go?

**Ответ.** `t.Format(layout)` где layout из эталона `2006-01-02 15:04:05`. API: `time.RFC3339`. Не `YYYY-MM-DD` как в strftime.

**Где в курсе:** [33-time.md](33-time.md).

---

### 25. `os.ReadFile` vs `bufio.Scanner`?

**Ответ.** ReadFile — весь файл в память, просто. Scanner — построчно, для логов. Для shop JSON — ReadFile + Unmarshal.

**Где в курсе:** [34-files-io.md](34-files-io.md).

---

## Блок 7. Практика и дизайн

### 26. Когда передавать pointer в функцию?

**Ответ.** Нужно изменить аргумент; struct большой (избежать копии); методы с pointer receiver; `json.Unmarshal` требует pointer. Слайсы и maps уже содержат указатель на данные — иногда pointer на slice не нужен для мутации элементов, но нужен для смены заголовка slice.

**Где в курсе:** [11-pointers.md](11-pointers.md).

---

### 27. Сравнение struct с `==`?

**Ответ.** Можно, если все поля **сравнимы** (нет slice, map, func). Иначе — `reflect.DeepEqual` или сравнение полей вручную / `cmp.Equal` с опциями.

**Где в курсе:** [07-structs.md](07-structs.md).

---

### 28. Константы и `iota`?

**Ответ.** `iota` — автоинкремент в блоке `const` для enum-подобных значений:

```go
const (
	StatusTodo = iota
	StatusDone
)
```

**Где в курсе:** [05-constants-iota.md](05-constants-iota.md).

---

### 29. Как организовать layout CLI-проекта?

**Ответ.** Минимум: `cmd/app/main.go` (тонкий entry), `internal/` или корневые пакеты `store`, `model`, `cmd` flags. `go mod` в корне. Capstone — [37-capstone.md](37-capstone.md). Cobra не обязателен — `flag` package.

**Где в курсе:** [26-packages.md](26-packages.md), [37-capstone.md](37-capstone.md).

---

### 30. После go-basic — что дальше?

**Ответ (пример).** Basic даёт синтаксис, ошибки, тесты и JSON — это фундамент для дальнейшей работы с backend API, concurrency (goroutines, каналы) и более глубоким тестированием на Go.

**Где в курсе:** [README.md](README.md).

---

## Резюме

Сильный кандидат на junior Go объясняет **zero values**, **slice header**, **error wrapping**, **экспорт** и **JSON tags**, приводит **контрпример** (nil map write, `List()` без копии). Пройдите все 30 вслух за 2–3 сессии.

---

## Чек-лист перед capstone

- [ ] 5+ вопросов ответили без подглядывания
- [ ] Могу объяснить difference array/slice на доске
- [ ] Могу написать table-driven test с `t.Run`
- [ ] Знаю, зачем `errors.Is` после `%w`

**Следующий шаг:** [37-capstone.md](37-capstone.md).
