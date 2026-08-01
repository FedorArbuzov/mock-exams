# Go — Basic

**Быстрый вход в Go:** установка, синтаксис, structs, slices, maps, interfaces, errors, пакеты, `go test`. Без веб-фреймворка — только то, что нужно, чтобы уверенно перейти в [`go-intermediate`](../golang-path.md).

> Маршрут: [`golang-path.md`](../golang-path.md). После этого курса — **go-intermediate** (Chi/Gin, pgx, shop API).

**Предварительно:** терминал ([`linux-basic`](../linux-basic/README.md) 02–03). Опыт с любым языком (Python, JS) — плюс, не обязателен.

**Локально:** Go **1.22+**, каталог [`examples/`](examples/go.mod).

```bash
cd courses/go-basic/examples
go version
go run ./lab/01hello
```

## Философия курса

`go-basic` — **не** мини-книга на 40 глав и **не** шпаргалка. Это **~6–8 часов** практики: прочитал → попробовал в `examples/` → пошёл в backend на Go.

Глубокие темы (concurrency, httptest, testcontainers, internals) — в [`go-concurrency`](../golang-path.md), [`go-testing`](../golang-path.md), `go-intermediate`.

## Программа (11 уроков)

| # | Урок | ~время |
|---|------|--------|
| 00 | [Окружение и первый запуск](00-environment.md) | 30 мин |
| 01 | [Типы, переменные, константы](01-types-variables.md) | 40 мин |
| 02 | [Structs, slices, maps](02-structs-slices-maps.md) | 50 мин |
| 03 | [Функции, указатели, methods](03-functions-pointers-methods.md) | 50 мин |
| 04 | [Управление потоком](04-control-flow.md) | 35 мин |
| 05 | [Interfaces и ошибки](05-interfaces-errors.md) | 50 мин |
| 06 | [Пакеты и go mod](06-packages-modules.md) | 40 мин |
| 07 | [Тесты и go vet](07-testing-tooling.md) | 40 мин |
| 08 | [JSON, файлы, time](08-json-files-time.md) | 45 мин |
| 09 | [Лаба: мини-CLI](09-lab-mini-cli.md) | 1.5 ч |
| 10 | [Что дальше](10-next-steps.md) | 20 мин |

| — | [Interview cheatsheet](interview-cheatsheet.md) | справка |

## Что должно получиться

После курса вы:

- запускаете `go run`, `go test`, `go mod tidy` без путаницы с каталогами;
- пишете **идиоматичный** код: `:=`, `if err != nil`, pointer receiver где нужно;
- читаете чужой Go в `go-intermediate` и не спотыкаетесь о slice/map/interface;
- понимаете, **что учить дальше** (HTTP, pgx, goroutines) — и не застреваете в basic.

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/go.mod`](examples/go.mod) | модуль лаб |
| [`examples/lab/`](examples/lab/) | упражнения |
| [`examples/solutions/`](examples/solutions/) | эталоны — после своей попытки |
