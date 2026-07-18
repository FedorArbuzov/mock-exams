# Go — Basic

Курс **базового Go** без веб-фреймворков: установка, модули, типы, structs, slices, maps, указатели, methods, interfaces, errors, `defer`/`panic`, пакеты, `go test`, `go vet`, линтеры. **38 уроков** (00–37) + interview cheatsheet.

**Локально:** Go **1.22+** на хосте. Код лаб — каталог [`examples/`](examples/go.mod).

```bash
cd courses/go-basic/examples
go version          # go1.22.x или новее
go run ./lab/01hello
```

Опционально: [goenv](https://github.com/go-nv/goenv) или официальный установщик с [go.dev/dl](https://go.dev/dl/) для переключения версий.

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка. Читайте последовательно: объяснение → примеры → «Типичные ошибки» → «Чек-лист».

1. **Теория** — объяснение → код → «Типичные ошибки» → «Чек-лист».
2. **Лаба** — hands-on в [`examples/`](examples/go.mod): `go run ./lab/…`, критерии успеха, таблица troubleshooting.
3. После блока 35 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [37-capstone.md](37-capstone.md) — **4–6 часов**, CLI «Task Tracker» на Go; собирает structs, errors, JSON, тесты из глав 20–35.

**Время:** **~50–70 минут** на пару «теория + лаба». Весь курс — **~14–18 часов**; capstone отдельно.

## Программа (38 уроков)

### Фаза 1. Среда и первые программы (00–03)

| # | Урок |
|---|------|
| 00 | [Окружение: Go toolchain, редактор, gopls](00-environment.md) |
| 01 | [Ландшафт: компиляция, GOPATH vs modules, экосистема](01-landscape.md) |
| 02 | [Переменные, zero values, короткое объявление](02-variables-zero-values.md) |
| 03 | [Лаба: первые программы](03-lab-first-programs.md) |

### Фаза 2. Типы и структуры данных (04–09)

| 04 | [Базовые типы: числа, строки, bool, rune, byte](04-basic-types.md) |
| 05 | [Константы и iota](05-constants-iota.md) |
| 06 | [Лаба: типы и константы](06-lab-types.md) |
| 07 | [Structs: поля, теги, вложенность](07-structs.md) |
| 08 | [Массивы и slices](08-slices-arrays.md) |
| 09 | [Лаба: structs и slices](09-lab-structs-slices.md) |

### Фаза 3. Указатели, maps, функции (10–15)

| 10 | [Функции: параметры, возврат, variadic](10-functions.md) |
| 11 | [Указатели и передача по значению](11-pointers.md) |
| 12 | [Maps](12-maps.md) |
| 13 | [Лаба: указатели и maps](13-lab-pointers-maps.md) |
| 14 | [Methods и receivers](14-methods.md) |
| 15 | [Лаба: methods](15-lab-methods.md) |

### Фаза 4. Управление потоком (16–19)

| 16 | [if, for, switch](16-control-flow.md) |
| 17 | [Строки, runes, пакеты strings/unicode](17-strings-runes.md) |
| 18 | [Лаба: control flow](18-lab-control-flow.md) |
| 19 | [Преобразование типов](19-type-conversions.md) |

### Фаза 5. Interfaces и ошибки (20–25)

| 20 | [Interfaces: неявная реализация](20-interfaces.md) |
| 21 | [Ошибки: error, fmt.Errorf, %w](21-errors.md) |
| 22 | [Лаба: interfaces](22-lab-interfaces.md) |
| 23 | [defer, panic, recover](23-defer-panic-recover.md) |
| 24 | [Лаба: errors](24-lab-errors.md) |
| 25 | [errors.Is, errors.As, обёртки](25-errors-is-as.md) |

### Фаза 6. Пакеты и модули (26–27)

| 26 | [Пакеты, видимость, layout](26-packages.md) |
| 27 | [go mod, зависимости, go work (обзор)](27-modules.md) |

### Фаза 7. Тесты и инструменты (28–31)

| 28 | [go test, table-driven tests](28-testing.md) |
| 29 | [Лаба: тестирование](29-lab-testing.md) |
| 30 | [go vet, staticcheck, golangci-lint](30-tooling.md) |
| 31 | [Лаба: линтеры и vet](31-lab-tooling.md) |

### Фаза 8. JSON, время, файлы (32–35)

| 32 | [encoding/json](32-json.md) |
| 33 | [Пакет time](33-time.md) |
| 34 | [Файлы: os, io, bufio](34-files-io.md) |
| 35 | [Лаба: JSON и файлы](35-lab-json-files.md) |

### Фаза 9. Финал (36–37)

| 36 | [Interview Q&A (топ-30)](36-interview-qa.md) |
| 37 | [Capstone: Task Tracker CLI](37-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Пишете **идиоматичный** Go: короткое объявление `:=`, явные ошибки, `defer` для cleanup.
- Объясняете **zero values**, разницу slice vs array, когда нужен указатель.
- Строите **structs** с methods и **interfaces** без «implements» в синтаксисе.
- Обрабатываете ошибки через **`if err != nil`**, `%w`, `errors.Is`/`As`.
- Разбиваете код на **пакеты** и **модули** (`go mod init`, `go get`).
- Пишете **table-driven tests** и запускаете **`go test -race`**.
- Используете **go vet** и **golangci-lint** до merge в CI.

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/go.mod`](examples/go.mod) | модуль лаб курса |
| [`examples/lab/`](examples/lab/) | стартовые `main.go` для лаб |
| [`examples/solutions/`](examples/solutions/) | эталоны (после своей попытки) |
