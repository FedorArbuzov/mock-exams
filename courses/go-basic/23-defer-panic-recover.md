# 23. defer, panic, recover

## defer — отложенный вызов

`defer` регистрирует вызов функции на **выход** из текущей функции (нормальный return, error return или panic):

```go
func copyFile(dst, src string) error {
    in, err := os.Open(src)
    if err != nil {
        return err
    }
    defer in.Close()

    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    _, err = io.Copy(out, in)
    return err
}
```

Даже при `return err` после `Copy` — **оба** `Close` выполнятся.

### Порядок LIFO (стек)

Несколько `defer` выполняются **в обратном порядке** регистрации — как стек:

```go
func demo() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    defer fmt.Println("3")
}
// вывод: 3, 2, 1
```

Аналогия: вложенные `finally` или «закрыть в обратном порядке открытия» — сначала mutex B, потом A.

```go
muA.Lock()
defer muA.Unlock()
muB.Lock()
defer muB.Unlock()
// unlock B, затем A
```

### Аргументы defer вычисляются сразу

```go
func trap() {
    i := 0
    defer fmt.Println(i) // печатает 0 — i захвачено по значению на момент defer
    i++
}
```

Для **актуального** значения — closure:

```go
defer func() { fmt.Println(i) }()
```

Или именованный result:

```go
func sum() (total int) {
    defer func() { fmt.Println("total", total) }()
    total = 1 + 2
    return total
}
```

### defer в цикле — осторожно

```go
// плохо — все Close в конце функции, N открытых файлов
func processAll(paths []string) error {
    for _, p := range paths {
        f, err := os.Open(p)
        if err != nil {
            return err
        }
        defer f.Close()
        // обработка...
    }
    return nil
}
```

**Исправление:** вынести тело в отдельную функцию:

```go
func processOne(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()
    // ...
    return nil
}

func processAll(paths []string) error {
    for _, p := range paths {
        if err := processOne(p); err != nil {
            return err
        }
    }
    return nil
}
```

## defer + именованные возвращаемые значения

```go
func divide(a, b int) (result int, err error) {
    defer func() {
        if err != nil {
            log.Println("divide failed:", err)
        }
    }()
    if b == 0 {
        err = errors.New("division by zero")
        return
    }
    result = a / b
    return
}
```

`defer` видит **именованные** `err`/`result` после присваивания, но до фактического return — удобно для трейсинга и метрик.

**Изменение named return в defer** — редкий приём (например, recover ниже); не злоупотребляйте.

## panic — ненормальное завершение

`panic(v any)` раскручивает стек, выполняя **defer** по пути, пока не встретит `recover` или не убьёт программу:

```go
func mustParse(s string) int {
    n, err := strconv.Atoi(s)
    if err != nil {
        panic(fmt.Sprintf("mustParse: %q", s))
    }
    return n
}
```

| Уместен panic | Не уместен |
|---------------|------------|
| `init()` невозможен без конфига | HTTP 400 bad input |
| `template.Must` при compile parse | ошибка чтения файла |
| баг: инвариант нарушен | ожидаемый `not found` |

Необработанный panic → **краш процесса** (если нет recover на верхнем уровне).

## recover — только внутри defer

```go
func safeCall(fn func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic recovered: %v", r)
        }
    }()
    fn()
    return nil
}
```

**Правила:**

1. `recover()` **имеет смысл только** в deferred-функции.
2. Вне panic `recover()` возвращает `nil`.
3. После recover выполнение продолжается **после** deferred, не с места panic.

```go
func handler(w http.ResponseWriter, r *http.Request) {
    defer func() {
        if rec := recover(); rec != nil {
            slog.Error("panic", "recover", rec)
            http.Error(w, "internal server error", http.StatusInternalServerError)
        }
    }()
    dangerous(r)
}
```

Паттерн — **один** recover на HTTP handler, не в каждой функции.

### panic(nil)

`panic(nil)` в Go 1.21+ ведёт себя особо — избегайте; используйте `errors.New`.

## defer, panic и ошибки — как совмещать

Предпочтительный стиль курса:

```go
func work() (err error) {
    f, err := os.Create("out.txt")
    if err != nil {
        return err
    }
    defer func() {
        closeErr := f.Close()
        if err == nil && closeErr != nil {
            err = closeErr
        }
    }()

  // ... запись ...
    return nil
}
```

При ошибке записи — возвращаем её; при успехе — не теряем ошибку `Close` (важно на некоторых FS).

**Не** смешивайте `panic` и `error` в одном слое без политики команды.

В Go **нет** глобального catch — необработанный panic убивает goroutine/процесс.

## sync и defer (задел)

```go
var mu sync.Mutex
mu.Lock()
defer mu.Unlock()
```

На basic достаточно: **всегда** `defer Unlock` сразу после `Lock`.

## Типичные ошибки

- **defer в tight loop** без отдельной функции — утечки FD, память.
- **Забыли defer Close** после `Open` — классический production incident.
- **panic на пользовательский ввод** — DoS своему API.
- **recover без лога** — «проглотили» баг, состояние неизвестно.
- **recover не в defer** — не работает.
- **Думать, что defer в конце блока `if`** — только при выходе из **функции**.

## Чек-лист

- В каком порядке выполняются три `defer` подряд?
- Когда вычисляются аргументы `defer fmt.Println(x)`?
- Почему `defer f.Close()` в `for` опасен?
- Где допустим `recover`?
- Чем `panic` в handler'е хуже `return err`?
- Как defer помогает при `return err` из функции с открытым файлом?

Следующий урок: [24. Лаба: errors](24-lab-errors.md). Теория ошибок: [21-errors.md](21-errors.md), [25-errors-is-as.md](25-errors-is-as.md).
