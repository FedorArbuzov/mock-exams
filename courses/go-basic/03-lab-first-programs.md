# 03. Лаба: первые программы

Эта лаба переводит теорию уроков 01–02 (Go toolchain, `go run`, `var`/`:=`, zero values) в мышечную память: писать маленькие программы в пакете `main`, запускать их и читать ошибки компилятора вместо того, чтобы просто прочитать про них.

## Предварительно

- Go **1.22+** установлен, терминал перезапускали после установки.
- Прочитаны [00. Окружение](00-environment.md) и [02. Переменные](02-variables-zero-values.md).
- Вы в каталоге **`courses/go-basic/examples/`** (не в корне репозитория).

```bash
cd courses/go-basic/examples
go version
```

Модуль: `github.com/mock-exams/go-basic-labs` ([`go.mod`](examples/go.mod)). Эталоны — [`examples/solutions/`](examples/solutions/) — открывайте **только после** своей попытки и короткого ступора (5–15 минут).

---

## Задание 1. Hello и версия Go

**Контекст:** в CI pipeline первый шаг часто `go version`, чтобы не гонять тесты на Go 1.20. Локальная программа дублирует эту проверку для логов.

Стартовый код уже в [`lab/01hello/main.go`](examples/lab/01hello/main.go). Убедитесь, что он запускается:

```bash
go run ./lab/01hello
```

**Критерий:** три строки без ошибок. `GOOS`/`GOARCH` — `windows amd64`, `linux amd64` и т.д.; полезно в тикетах «не воспроизводится».

Опционально: добавьте четвёртую строку с `os.Getenv("USER")` или `USERNAME` (импорт `"os"`).

---

## Задание 2. Переменные и форматирование

**Контекст:** label для invoice в shop — `firstName`, `lastName`, форматированная строка через `fmt`.

Создайте `lab/02variables/main.go`:

```go
package main

import "fmt"

func main() {
	firstName := "Ann"
	lastName := "Smith"
	fullName := fmt.Sprintf("%s %s", firstName, lastName)

	fmt.Println(fullName)
	fmt.Printf("type of fullName: %T\n", fullName)

	var zero int
	fmt.Println("zero int:", zero)
}
```

```bash
go run ./lab/02variables
```

**Критерий:** `Ann Smith`, `type of fullName: string`, `zero int: 0`. В комментарии одной фразой: почему `zero` не «пустой», а `0`.

---

## Задание 3. Блоки и shadowing

**Контекст:** временные переменные в `if` не должны «утекать» наружу за пределы блока.

`lab/03blocks/main.go`:

```go
package main

import "fmt"

func main() {
	discount := 0.15
	if discount > 0 {
		label := "SALE"
		fmt.Println(label, discount)
	}
	// Раскомментируйте следующую строку и прочитайте ошибку компилятора:
	// fmt.Println(label)

	outer := 1
	if true {
		outer, inner := 2, 3
		fmt.Println("inside", outer, inner)
	}
	fmt.Println("outside", outer)
}
```

**В комментарии в файле** (2–4 предложения): что выведет `outside`, почему `label` снаружи `if` недоступен, что такое shadowing `outer` во внутреннем блоке.

```bash
go run ./lab/03blocks
```

---

## Задание 4. Сложение int и float

**Контекст:** количество из формы — целое, цена — дробная; в Go **разные типы** не складываются неявно.

`lab/04calc/main.go`:

```go
package main

import "fmt"

func main() {
	qty := 2
	unitPrice := 29.99
	// lineTotal := qty * unitPrice  // сначала закомментируйте — прочитайте ошибку
	lineTotal := float64(qty) * unitPrice
	fmt.Println("line total:", lineTotal)

	a, b := 2, 3
	fmt.Println("ints", a+b)

	// fmt.Println(a + unitPrice) // раскомментируйте — ошибка компиляции
}
```

**В комментарии:** почему `qty * unitPrice` без приведения не компилируется.

---

## Задание 5. REPL-like сниппет и float

**Контекст:** сумма line items shop не сходится на копейку — float64.

Создайте однофайловый пакет `lab/05float/main.go` **или** запустите временный файл:

```bash
cd courses/go-basic/examples
go run -e 'package main; import "fmt"; func main() { fmt.Println(0.1 + 0.2) }'
```

Флаг `-e` **не существует** в Go — это намеренная ловушка. В Go «REPL-like» = **короткий `main.go`**:

```go
package main

import "fmt"

func main() {
	a := 0.1 + 0.2
	fmt.Println(a)
	fmt.Println(a == 0.3)
	fmt.Printf("%.20f\n", a)
}
```

**Критерий:** видите `0.30000000000000004` (или похожее), `false` для `== 0.3`. В комментарии: как в production считать деньги (копейки `int64` — preview).

```bash
go run ./lab/05float
```

---

## Критерии успеха

- [ ] Все пакеты `01hello`–`05float` запускаются: `go run ./lab/…` из `examples/`
- [ ] В `03blocks` есть комментарий про scope и shadowing
- [ ] В `04calc` объяснено приведение `float64(qty)`
- [ ] Понимаете, зачем логировать `runtime.Version()` / `go version` в CI
- [ ] Пробовали «сломать» компиляцию раскомментированием строк — читали сообщение компилятора

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `cannot find main module` | Вы в `examples/`? Есть `go.mod`? |
| `no Go files in ...` | Путь `./lab/02variables` — каталог с `main.go`? |
| `undefined: fmt` | Импорт `"fmt"` и `import` блок |
| `declared and not used` | Удалите переменную или `_ = x` |
| Кириллица в пути ломает сборку | ASCII path или обновите Go |
| `invalid operation: qty * unitPrice` | Нужно приведение типов — задание 4 |

Следующий урок (теория): [04. Базовые типы](04-basic-types.md).
