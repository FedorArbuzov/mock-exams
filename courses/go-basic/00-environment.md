# 00. Окружение: Go toolchain, редактор, gopls

## Что вы узнаете

- Как установить **Go 1.22+** и проверить версию.
- Цикл разработки: **файл → `go run` → читать вывод → править**.
- Краткий обзор **GOPATH vs Go modules** — полный разбор в [27-modules.md](27-modules.md).
- Структура каталога **`examples/`**, модуль `github.com/mock-exams/go-basic-labs`.
- Минимальная настройка **редактора** (gopls, gofmt).

## Установка Go

Рекомендуется **Go 1.22** или новее (курс написан под `go 1.22` в [`examples/go.mod`](examples/go.mod)). Официальный установщик: [go.dev/dl](https://go.dev/dl/).

### Linux и macOS

```bash
# После установки из .tar.gz или пакетного менеджера
go version    # go1.22.x или go1.23.x

go env GOROOT   # где лежит toolchain
go env GOPATH   # каталог для кэша модулей и bin (см. ниже)
```

Опционально — менеджер версий [goenv](https://github.com/go-nv/goenv) для переключения версий Go:

```bash
goenv install 1.22.5
goenv local 1.22.5
go version
```

### Windows

Установщик `.msi` с [go.dev/dl](https://go.dev/dl/) или **goenv** под WSL. После установки **перезапустите терминал** — PATH обновляется только в новых сессиях. PowerShell:

```powershell
go version
Get-Command go
```

### Проверка «как в CI»

Добавьте в корень pet-проектов файл `go.mod` с директивой:

```go
go 1.22
```

Или в CI-конфиге явно укажите образ `golang:1.22`. Тогда «работает у меня» не разойдётся с пайплайном.

| Инструмент | Назначение | Когда понадобится |
|------------|------------|-------------------|
| `go run` | Компиляция + запуск без сохранения бинарника | каждая лаба |
| `go build` | Сборка исполняемого файла | capstone, CLI |
| `go test` | Запуск тестов | уроки 28–31 |
| `go mod` | Зависимости и модули | урок 27 |
| `go fmt` / `gofmt` | Форматирование | всегда перед commit |

## GOPATH vs Go modules (краткий обзор)

Исторически проекты жили в `$GOPATH/src/github.com/you/project`. С **Go modules** (с 1.11, default с 1.16) корень проекта — каталог с **`go.mod`**. Импорты вида `github.com/mock-exams/go-basic-labs/lab/01hello` резолвятся через модуль, а не через жёсткий путь в GOPATH.

```bash
go env GO111MODULE   # on (по умолчанию)
go env GOPATH        # ~/go на Linux/macOS, %USERPROFILE%\go на Windows
```

**GOPATH** сегодня в основном для:

- кэша скачанных модулей (`$GOPATH/pkg/mod`);
- установленных CLI (`go install` → `$GOPATH/bin` — добавьте в PATH).

Не кладите учебный код в `~/go/src` вручную — работайте в клоне репозитория, каталог `courses/go-basic/examples/`. Подробно — [27-modules.md](27-modules.md).

## Первый запуск: `go run`

Модуль курса уже инициализирован:

```text
courses/go-basic/examples/
├── go.mod          # module github.com/mock-exams/go-basic-labs
└── lab/
    └── 01hello/
        └── main.go
```

Перейдите в каталог examples:

```bash
cd courses/go-basic/examples
go version
go run ./lab/01hello
```

**Что увидите (примерно):**

```text
Hello from lab 01
Go version: go1.22.5
OS/Arch: windows amd64
```

Исходник лабы:

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	fmt.Println("Hello from lab 01")
	fmt.Println("Go version:", runtime.Version())
	fmt.Println("OS/Arch:", runtime.GOOS, runtime.GOARCH)
}
```

`fmt.Println` — главный «прибор» первых недель: пишет в **stdout** с переводом строки. Пакет **`runtime`** даёт версию Go и платформу.

### Типичная ошибка первого дня

```bash
go run main.go    # из корня репозитория, без go.mod
```

Ошибка: `go: cannot find main module`. **Всегда** запускайте из каталога с `go.mod` или укажите путь к пакету: `go run ./lab/01hello`.

## Структура каталога курса

```text
courses/go-basic/
├── README.md
├── 00-environment.md … 37-capstone.md
├── interview-cheatsheet.md
└── examples/
    ├── go.mod              # github.com/mock-exams/go-basic-labs
    ├── lab/                # ваши решения лаб (подкаталоги с main.go)
    └── solutions/          # эталоны — только после своей попытки
```

Запуск **всегда из `examples/`**, иначе относительные пути в будущих лабах (JSON, файлы) не найдутся.

Каждая лаба — **отдельный пакет** `main` в подкаталоге (`lab/02variables/main.go`), а не один гигантский `main.go`. Так принято в Go: один `main` на команду/утилиту.

## Редактор и gopls

Подойдёт **VS Code**, **Cursor**, GoLand, Neovim — любой редактор с поддержкой Go. Для курса достаточно:

| Расширение / настройка | Зачем |
|------------------------|-------|
| **gopls** | language server: автодополнение, go to definition, diagnostics |
| Format on save (`gofmt` / `goimports`) | единый стиль в команде |
| `go test` integration | запуск тестов из IDE (позже) |

Установка gopls (один раз):

```bash
go install golang.org/x/tools/gopls@latest
```

Убедитесь, что `$GOPATH/bin` (или `%USERPROFILE%\go\bin`) в PATH. Откройте в редакторе **корень** `courses/go-basic/examples/`, если gopls путает модули при открытом монорепозитории.

### Кодировка на Windows

Сохраняйте файлы в **UTF-8**. Go source — UTF-8 по спецификации. Если в комментариях кириллица, а в терминале «кракозябры» — используйте Windows Terminal с UTF-8. Путь с кириллицей иногда ломает старые инструменты — для учебных проектов лучше ASCII-пути.

## `go.mod` и модуль лаб

В [`examples/go.mod`](examples/go.mod):

```go
module github.com/mock-exams/go-basic-labs

go 1.22
```

Имя модуля — **логический путь** для импортов внутри монорепо; он не обязан существовать на GitHub, пока вы не публикуете пакет. Локально `go run ./lab/01hello` компилирует пакет `main` без внешних зависимостей.

Позже вы добавите:

```bash
go get github.com/some/dependency
```

и строка `require` появится в `go.mod` автоматически. Правило курса на первых неделях: **только стандартная библиотека** (`fmt`, `strings`, `encoding/json`, …).

## Типичные ошибки

**«go не найден» после установки.** Терминал не перезапущен; Go не в PATH; на Windows установщик не добавил `%USERPROFILE%\go\bin`. Проверка: `which go` (Linux/macOS) или `Get-Command go` (PowerShell).

**`cannot find main module`.** Запуск из каталога без `go.mod`. Решение: `cd courses/go-basic/examples` или `go run` с путём к пакету внутри модуля.

**gopls красит импорты, `go build` ок.** Открыт неверный workspace root; gopls не установлен; версия gopls не совпадает с Go. Переустановите: `go install golang.org/x/tools/gopls@latest`.

**Разные версии Go у команды.** Зафиксируйте `go 1.22` в `go.mod` и образ в CI.

**Путают `go run file.go` и `go run ./pkg`.** Для лаб курса используйте **путь к пакету** (`./lab/01hello`), чтобы компилятор видел все `.go` файлы пакета.

**Кладут код в `$GOPATH/src` по старым туториалам.** Для modules достаточно `go.mod` в корне проекта.

## Резюме

Окружение go-basic — **Go 1.22+ на хосте**, терминал и редактор с **gopls**. Вы запускаете программы командой `go run ./lab/...` из каталога `examples/`, работаете в модуле `github.com/mock-exams/go-basic-labs`. `fmt.Println` и `runtime.Version` — первые инструменты диагностики; позже к ним добавятся типы, structs и `go test`.

## Чек-лист

- [ ] `go version` показывает **1.22.x или новее**
- [ ] `go env GOPATH` отвечает без ошибки
- [ ] `go run ./lab/01hello` из `examples/` печатает три строки
- [ ] Понимаете разницу «go не установлен» vs «запуск не из модуля»
- [ ] Открыт каталог `courses/go-basic/examples/`, виден `go.mod`
- [ ] gopls установлен (`gopls version`) или Go extension в IDE активен

Следующий урок: [01. Ландшафт Go](01-landscape.md).
