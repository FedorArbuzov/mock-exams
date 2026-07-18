# 33. Пакет time: Time, Parse, Format

## Что узнаете

- Тип `time.Time` — момент на шкале UTC внутри, отображение зависит от Location.
- `time.Now()`, `time.Date`, нулевое значение `time.Time`.
- `Format` и `Parse` с layout reference date.
- RFC3339 / ISO 8601 для API и JSON.
- `time.Duration`, `Sleep`, `Since`, `Until`.
- Location и почему «просто +3 часа» ломается при DST.

---

## time.Time — что это

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	fmt.Println(now)           // 2024-06-18 13:45:00.123 +0300 MSK
	fmt.Println(now.Unix())    // секунды с 1970-01-01 UTC
	fmt.Println(now.UTC())     // тот же момент, зона UTC
	fmt.Println(now.IsZero())  // false
}
```

| Метод / понятие | Назначение |
|-----------------|------------|
| `time.Now()` | текущий момент в локальной зоне ОС |
| `t.UTC()` | тот же instant в UTC |
| `t.IsZero()` | `true` для нулевого `time.Time` |
| `t.Before(u)`, `After`, `Equal` | сравнение |
| `t.Add(d)`, `AddDate(y, m, d)` | арифметика |

**Нулевое значение:** `var t time.Time` — не «сейчас», а **1 января 0001 UTC**; `IsZero()` → `true`. В JSON с `omitempty` обычно не сериализуется как пустая строка без кастомной логики — для optional дат используйте `*time.Time`.

---

## Эталонная дата — сердце Format/Parse

Go не использует `%Y` и `%d`. Вместо этого layout описывает **конкретный образец**:

```text
Mon Jan 2 15:04:05 MST 2006
 1  2  3  4  5    6   7
```

| Компонент layout | Значение в эталоне |
|------------------|-------------------|
| `2006` | год |
| `01` | месяц |
| `02` | день |
| `15` | час (24h) |
| `04` | минуты |
| `05` | секунды |
| `MST` | зона (аббревиатура) |
| `-0700` | числовое смещение |

Мнемоника: **01/02 03:04:05PM '06 -0700** (американский порядок месяц/день в мнемонике).

```go
t := time.Date(2024, 6, 18, 10, 30, 0, 0, time.UTC)

fmt.Println(t.Format("2006-01-02"))           // 2024-06-18
fmt.Println(t.Format("02.01.2006"))           // 18.06.2024
fmt.Println(t.Format(time.RFC3339))           // 2024-06-18T10:30:00Z
fmt.Println(t.Format("2006-01-02 15:04:05")) // 2024-06-18 10:30:00
```

**Правило:** каждая цифра в layout — **фиксированная** часть эталона, не шаблон произвольной длины.

---

## Parse — строка → time.Time

```go
const layout = "2006-01-02"

t, err := time.Parse(layout, "2024-06-18")
if err != nil {
	// parsing time "..." as "...": cannot parse ...
	return err
}
```

`time.Parse` без зоны в layout интерпретирует время в **UTC**.

С явной зоной:

```go
t, err := time.Parse("2006-01-02 15:04:05 -0700", "2024-06-18 10:30:00 +0300")
```

### ParseInLocation

Для «локального времени пользователя» (отчёты, cron в MSK):

```go
loc, _ := time.LoadLocation("Europe/Moscow")
t, err := time.ParseInLocation("2006-01-02 15:04", "2024-06-18 13:00", loc)
```

Не путайте: `Parse` → UTC по умолчанию; `ParseInLocation` → указанная зона.

---

## RFC3339 и API

Константы в пакете `time`:

```go
time.RFC3339     // "2006-01-02T15:04:05Z07:00"
time.RFC3339Nano
```

Для HTTP и JSON — **стандарт де-факто**:

```go
created := time.Now().UTC()
s := created.Format(time.RFC3339)
// "2024-06-18T10:30:00Z"

parsed, err := time.Parse(time.RFC3339, s)
```

В struct для JSON:

```go
type Task struct {
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
}
```

`json.Marshal` сериализует `time.Time` как **RFC3339Nano** строку. При `Unmarshal` строка парсится обратно в `time.Time`.

---

## Duration и таймеры

```go
d := 500 * time.Millisecond
d = 2*time.Hour + 30*time.Minute

time.Sleep(d)

start := time.Now()
// ... работа ...
elapsed := time.Since(start)
```

| Константа | Значение |
|-----------|----------|
| `time.Nanosecond` | 1 ns |
| `time.Millisecond` | 1e6 ns |
| `time.Second` | 1e9 ns |

`time.Duration` — **int64 наносекунд**, не «дата». Для дедлайнов используют `context.WithDeadline`; здесь достаточно `Since`/`Until`.

---

## Location и часовые пояса

```go
utc := time.UTC
moscow, err := time.LoadLocation("Europe/Moscow")
if err != nil {
	return err
}

t := time.Now().In(moscow)
```

| Антипаттерн | Почему плохо |
|-------------|--------------|
| `t.Add(3 * time.Hour)` «для MSK» | DST, исторические смещения |
| Хранить локальное время без зоны | неоднозначность при переводе |
| Парсить Excel-дату без layout | разные региональные форматы |

**В проде:** храните **UTC** (БД, JSON), конвертируйте в локаль только на UI. В capstone `createdAt` — строка RFC3339 в UTC.

---

## Сравнение и округление

```go
a := time.Date(2024, 6, 18, 10, 0, 0, 0, time.UTC)
b := time.Date(2024, 6, 18, 11, 0, 0, 0, time.UTC)

a.Before(b) // true
a.Equal(b)  // false

trunc := b.Truncate(time.Hour) // обнулить минуты/секунды в пределах часа
```

Для «только дата» без времени часто хранят `time.Date(y, m, d, 0, 0, 0, 0, loc)` или отдельный тип/строку — зависит от домена.

---

## Unix timestamp и ParseDuration

Для логов и внешних API иногда приходит **число секунд** (не строка RFC3339):

```go
sec := int64(1718706600)
t := time.Unix(sec, 0).UTC()
fmt.Println(t.Format(time.RFC3339))

nano := time.Unix(0, 1718706600123456789) // сек + наносек
```

Обратно:

```go
t.Unix()     // секунды
t.UnixMilli() // миллисекунды (Go 1.17+)
```

**Длительности** в конфигах (`timeout: 30s`):

```go
d, err := time.ParseDuration("1h30m")
if err != nil {
	return err
}
deadline := time.Now().Add(d)
```

`ParseDuration` понимает `ns`, `us`, `µs`, `ms`, `s`, `m`, `h` — не путать с парсингом календарной даты.

---

## Типичные ошибки

1. **Layout с `%Y-%m-%d`** — Go его не понимает; нужен layout от эталонной даты.

2. **`Parse` без зоны** — ожидали MSK, получили UTC.

3. **Сравнение строк дат** `"2024-06-18" < "2024-06-9"` — лексикографически неверно; сравнивайте `time.Time`.

4. **Забыли `.UTC()` перед записью в JSON** — клиенты в разных зонах видят разный «день».

5. **Нулевой `time.Time` в API** — уходит как `"0001-01-01T00:00:00Z"`; используйте pointer или omitempty + кастомная логика.

6. **Монотонные часы** — `time.Since` для измерений OK; для юридических меток времени — `time.Now()`, не monotonic clock внутри (Go разделяет это в сравнениях).

---

## В проде

- Логи и трейсы: UTC + RFC3339Nano.
- Пользовательский ввод: явный layout + `ParseInLocation` + валидация.
- Тесты: **не** `time.Now()` напрямую — подставляйте фиксированное время (в advanced — интерфейс clock; в basic — параметр функции `now func() time.Time`).

```go
func formatOrderID(t time.Time) string {
	return t.UTC().Format("20060102") + "-001"
}
```

---

## Резюме

`time.Time` — момент; `Duration` — интервал. Форматирование через layout от **2006-01-02 15:04:05**. Для API — `RFC3339` и UTC. Часовые пояса — через `Location`, не ручным смещением.

---

## Чек-лист

- [ ] Помню эталонную дату `2006-01-02 15:04:05`
- [ ] Использую `time.RFC3339` для JSON/API
- [ ] Различаю `Parse` (UTC default) и `ParseInLocation`
- [ ] Храню UTC, показываю локаль осознанно
- [ ] Не сравниваю даты как строки

**Дальше:** [34-files-io.md](34-files-io.md) — чтение и запись файлов для persistence.
