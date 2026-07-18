# 20. Interfaces: неявная реализация

## Что такое interface в Go

**Interface** — именованный набор **сигнатур методов**. Тип **неявно** удовлетворяет interface, если реализует все его методы. Компилятор проверяет это **в месте использования**, а не в объявлении типа.

```go
type Stringer interface {
    String() string
}

type Product struct {
    Name  string
    Price float64
}

func (p Product) String() string {
    return fmt.Sprintf("%s — %.2f", p.Name, p.Price)
}

func describe(s Stringer) {
    fmt.Println(s.String())
}

func main() {
    p := Product{Name: "Go in Action", Price: 39.99}
    describe(p) // OK: Product имеет String() string
}
```

**Правило дизайна Go:** «Принимай interfaces, возвращай concrete types» — функция зависит от **минимального** контракта, а не от конкретного struct.

## Неявное удовлетворение (implicit satisfaction)

Объявление `type Product struct` **не содержит** списка interfaces. Компилятор проверяет соответствие, когда вы передаёте `Product` туда, где ожидается `Stringer`:

```go
var _ Stringer = Product{} // compile-time assert: Product реализует Stringer
```

Строка `var _ Stringer = Product{}` — идиома **compile-time check**: если уберёте метод `String`, сборка упадёт сразу, а не в рантайме.

Несколько interfaces — один тип:

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

type ReadCloser interface {
    Reader
    Closer
}
```

`ReadCloser` **встраивает** другие interfaces — композиция контрактов, не наследование реализации.

### Pointer vs value receiver

Метод с **value receiver** доступен и для value, и для pointer (Go автоматически берёт адрес, если нужно). Метод только с **pointer receiver** — interface удовлетворяет только **`*T`**, не `T`:

```go
type Counter struct{ n int }

func (c *Counter) Inc() { c.n++ }

type Incrementer interface {
    Inc()
}

func main() {
    var inc Incrementer
    c := Counter{}
    // inc = c       // ошибка компиляции: Counter не реализует Incrementer
    inc = &c          // OK
    inc.Inc()
}
```

На code review частая ошибка: забыли `*` в receiver — interface «не работает».

## Пустой interface: `interface{}` и `any`

Пустой interface **не требует методов**. Любой тип его удовлетворяет. С Go 1.18 алиас `any` = `interface{}`:

```go
func debugPrint(v any) {
    fmt.Printf("%T = %v\n", v, v)
}

debugPrint(42)
debugPrint("hello")
debugPrint(Product{Name: "Book"})
```

| Когда использовать `any` | Когда избегать |
|--------------------------|----------------|
| `json.Unmarshal`, generic debug | Публичный API бизнес-логики |
| Временный прототип | Hot path без type switch |
| `fmt.Println` variadic | Вместо нормального interface |

**Антипаттерн:** `func Save(data any)` в доменном слое — теряете типобезопасность. Лучше `SaveOrder(o Order)` или узкий interface `Saver`.

## Type assertion и type switch

Когда значение хранится как interface, **конкретный тип** извлекают **type assertion**:

```go
var i any = Product{Name: "Tea", Price: 3.5}

p, ok := i.(Product)
if ok {
    fmt.Println(p.Price)
}

// без ok — panic при неверном типе
p2 := i.(Product)
```

**Type switch** — ветвление по динамическому типу:

```go
func format(v any) string {
    switch x := v.(type) {
    case string:
        return x
    case int:
        return strconv.Itoa(x)
    case Stringer:
        return x.String()
    default:
        return fmt.Sprintf("%v", x)
    }
}
```

В `switch x := v.(type)` переменная `x` имеет **конкретный тип** в каждой ветке — удобнее, чем повторять assertion.

### Двухзначная форма — обязательна в production

```go
w, ok := r.(io.Writer)
if !ok {
    return fmt.Errorf("expected io.Writer, got %T", r)
}
```

Однозначная `r.(io.Writer)` без `ok` — **panic** при несовпадении. В HTTP-handlers и парсерах почти всегда нужна безопасная форма.

## Nil interface: главная ловушка

В Go interface — это **два поля**: (1) динамический **тип**, (2) динамическое **значение**. `nil` interface — оба поля nil. **Но:**

```go
func returnsError() error {
    var p *os.PathError = nil
    return p // возвращает non-nil error!
}

func main() {
    err := returnsError()
    fmt.Println(err == nil) // false — тип *os.PathError, значение nil
    if err != nil {
        fmt.Println("вошли сюда, хотя «логически» ошибки нет")
    }
}
```

| Ситуация | `err == nil` | Почему |
|----------|--------------|--------|
| `var err error` | `true` | тип и значение nil |
| `return nil` из `func() error` | `true` | явный nil interface |
| `var p *T = nil; return p` как `error` | `false` | тип `*T` уже не nil |

**Правило:** из функции с возвратом `error` возвращайте **либо** `nil`, **либо** конкретную non-nil ошибку — не «типизированный nil pointer» как `error`.

Та же ловушка с любым interface:

```go
type Worker interface { Work() }

func getWorker() Worker {
    var w *MyWorker = nil
    return w // Worker != nil
}
```

Исправление: `if w == nil { return nil }; return w`.

## Interfaces в стандартной библиотеке

Стандартная библиотека — каталог **маленьких** interfaces:

| Interface | Метод(ы) | Пример реализации |
|-----------|----------|-------------------|
| `io.Reader` | `Read([]byte) (int, error)` | `os.File`, `bytes.Buffer`, `strings.Reader` |
| `io.Writer` | `Write([]byte) (int, error)` | `os.Stdout`, `bytes.Buffer` |
| `fmt.Stringer` | `String() string` | любой тип с методом |
| `error` | `Error() string` | любой тип с методом |

Паттерн **accept interfaces, return structs** в действии:

```go
func copyAll(dst io.Writer, src io.Reader) (int64, error) {
    return io.Copy(dst, src)
}
```

`copyAll` не знает про `*os.File` — только про чтение/запись байтов.

## Interface segregation на практике

Разбивайте **толстые** контракты:

```go
// плохо — заставляет реализовать лишнее
type Storage interface {
    Get(id int) (Item, error)
    Save(Item) error
    Delete(id int) error
    List() ([]Item, error)
    Ping() error
}

// лучше — узкие роли
type Getter interface {
    Get(id int) (Item, error)
}

type Saver interface {
    Save(Item) error
}
```

Функция `LoadAndDisplay(g Getter, id int)` тестируется с **fake**, реализующим один метод — без полной БД.

## Типичные ошибки

- **Гигантский interface** на 15 методов — сложно мокать и реализовывать.
- **Pointer receiver забыли** — тип не удовлетворяет interface.
- **Возврат typed nil** из `func() error` — `if err != nil` срабатывает «ложно».
- **Type assertion без `ok`** в пользовательском вводе — panic в prod.
- **`any` везде** вместо доменных типов — потеря помощи компилятора.
- **Проверка `implements` в runtime** там, где достаточно compile-time `var _ I = T{}`.

## Чек-лист

- Чем **неявная** реализация отличается от `implements` в Java?
- Почему `*Counter`, но не `Counter`, может удовлетворять interface с `Inc()`?
- Что хранит interface value внутри (два поля)?
- Когда `err == nil` ложь, хотя «ошибки нет»?
- Зачем `v, ok := x.(T)` вместо `v := x.(T)`?
- Назовите три interfaces из `io` и зачем они разделены.

Следующий урок: [21. Ошибки: error, fmt.Errorf, %w](21-errors.md). Практика: [22. Лаба: interfaces](22-lab-interfaces.md).
