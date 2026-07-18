# 34. Файлы и I/O: os, io, bufio, path/filepath

## Что узнаете

- Чтение и запись целиком: `os.ReadFile`, `os.WriteFile`.
- Потоковое чтение: `os.Open`, `io.Reader`, `bufio.Scanner`, `bufio.Reader`.
- Создание каталогов: `os.MkdirAll`.
- `filepath.Join`, `Base`, `Dir`, `Clean` — не конкатенация строк с `\`.
- Права `0o644`, `0o755` и umask.
- Атомарная запись через временный файл + rename.

---

## Пути: filepath, не ручной slash

```go
import "path/filepath"

path := filepath.Join("data", "shop", "products.json")
// data/shop/products.json на Unix
// data\shop\products.json на Windows

dir := filepath.Dir(path)   // data/shop
base := filepath.Base(path) // products.json
clean := filepath.Clean("../data/./products.json") // нормализация
```

| Антипаттерн | Проблема |
|-------------|----------|
| `"data" + "/" + name` | ломается на Windows |
| Хардкод `C:\...` | не переносится |
| Путь от `os.Getwd()` без документации | зависит от cwd при запуске |

**Для capstone:** путь к `tasks.json` задают флагом `--data` с дефолтом `data/tasks.json` относительно **cwd** или явно документируют; альтернатива — путь рядом с исполняемым файлом через `os.Executable()` (сложнее, опционально).

---

## ReadFile и WriteFile — 80% задач basic

```go
package main

import (
	"log"
	"os"
)

func main() {
	data, err := os.ReadFile("data/products.json")
	if err != nil {
		if os.IsNotExist(err) {
			log.Println("файл не найден — начнём с пустого каталога")
			data = []byte("[]")
		} else {
			log.Fatal(err)
		}
	}
	_ = data

	out := []byte(`{"ok":true}`)
	if err := os.WriteFile("data/out.json", out, 0o644); err != nil {
		log.Fatal(err)
	}
}
```

| Функция | Поведение |
|---------|-----------|
| `os.ReadFile(name)` | весь файл → `[]byte` |
| `os.WriteFile(name, data, perm)` | создать/перезаписать |
| `os.MkdirAll(dir, 0o755)` | каталоги по цепочке |
| `os.IsNotExist(err)` | файл отсутствует |
| `os.IsPermission(err)` | нет прав |

**Права `0o644`:** владелец rw, остальные r. Восьмеричный литерал Go 1.13+: префикс `0o`.

Перед `WriteFile` убедитесь, что каталог существует:

```go
if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
	return err
}
```

---

## Open + defer Close — большие файлы и потоки

```go
f, err := os.Open("access.log")
if err != nil {
	return err
}
defer f.Close()

// f реализует io.Reader
```

`defer` гарантирует закрытие при выходе из функции. Утечка дескрипторов в цикле без `Close` — классический баг в code review.

---

## bufio.Scanner — построчное чтение

```go
import (
	"bufio"
	"os"
)

f, err := os.Open("access.log")
if err != nil {
	return err
}
defer f.Close()

scanner := bufio.NewScanner(f)
for scanner.Scan() {
	line := scanner.Text()
	_ = line
}
if err := scanner.Err(); err != nil {
	return err
}
```

| Когда Scanner | Когда ReadFile |
|---------------|----------------|
| логи, CSV построчно | JSON целиком, маленькие конфиги |
| неизвестный размер | размер известен и умерен |

**Лимит строки:** по умолчанию до 64 КБ на строку; для очень длинных строк — `scanner.Buffer` или `bufio.Reader`.

### bufio.Reader и ReadString

```go
r := bufio.NewReader(f)
line, err := r.ReadString('\n')
```

Гибче, чем Scanner, для кастомных разделителей.

---

## io пакет — абстракция Reader/Writer

```go
import "io"

n, err := io.Copy(dstWriter, srcReader)
```

`json.NewDecoder(r)` и `json.NewEncoder(w)` принимают `io.Reader`/`io.Writer`.

Частые типы:

| Тип | Роль |
|-----|------|
| `os.File` | файл |
| `bytes.Buffer` | память |
| `strings.Reader` | строка как Reader |
| `http.Response.Body` | тело ответа *(intermediate)* |

---

## Проверка существования и метаданные

```go
info, err := os.Stat(path)
if os.IsNotExist(err) {
	// создать
} else if err != nil {
	return err
}
if info.IsDir() {
	return fmt.Errorf("%s is a directory", path)
}
```

`os.Stat` vs `os.Lstat` — последний не следует symlink (редко в basic).

---

## Атомарная запись (важно для persistence)

Если процесс упадёт во время `WriteFile`, файл может оказаться **обрезанным**. Паттерн:

```go
func writeAtomic(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, perm); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
```

`Rename` на одной файловой системе атомарен для читателей. В лабе 35 и capstone — рекомендуемый подход для `tasks.json` / `products.json`.

---

## Рабочий каталог и флаги

```go
import "flag"

dataPath := flag.String("data", "data/products.json", "path to JSON catalog")
flag.Parse()
```

Запуск:

```bash
go run ./cmd/shop --data ./my/catalog.json
```

Документируйте в README: путь **относительно cwd**, не относительно исходника `.go`.

---

## Embed (обзор)

Go 1.16+ — встроить статические файлы в бинарник:

```go
import _ "embed"

//go:embed default_products.json
var defaultProducts []byte
```

Для capstone не обязательно; полезно для дефолтного шаблона конфига.

---

## Типичные ошибки

1. **Не создали каталог** перед `WriteFile` — `no such file or directory`.

2. **Забыли `Close`** при `Open` без defer — лимит открытых файлов.

3. **Игнор `scanner.Err()`** после цикла `Scan` — тихая потеря ошибки I/O.

4. **Конкатенация путей** вместо `filepath.Join`.

5. **Чтение секретов в string** без нужды — для паролей позже `os.ReadFile` + минимизация копий в памяти; в basic — не коммитить секреты в JSON.

6. **Гонка двух процессов** пишут один файл — атомарный rename снижает риск битого JSON, но не заменяет file lock; для CLI capstone один процесс — достаточно.

7. **BOM в UTF-8** от Windows-редакторов — `json.Unmarshal` может падать; сохраняйте UTF-8 без BOM.

---

## В проде

- Конфиги: права `0o600` для чувствительных файлов.
- Логи: ротация (вне scope basic) — не один гигантский файл.
- Контейнеры: volume mount для `data/`; путь через env/flag.
- CI: `go test` с `t.TempDir()` для изоляции файловых тестов.

---

## Резюме

Для JSON-каталога shop: `ReadFile` → `json.Unmarshal` → логика → `json.MarshalIndent` → `writeAtomic`. Для логов — `bufio.Scanner`. Пути — `filepath.Join`. Ошибки — явно, включая `IsNotExist`. Следующая лаба собирает всё в рабочий сценарий.

---

## Чек-лист

- [ ] Использую `filepath.Join` для путей
- [ ] Перед записью — `MkdirAll` для родительского каталога
- [ ] Обрабатываю `os.IsNotExist` при первом запуске
- [ ] Знаю паттерн атомарной записи через `.tmp` + `Rename`
- [ ] Закрываю файлы через `defer f.Close()`

**Дальше:** [35-lab-json-files.md](35-lab-json-files.md) — hands-on persistence shop-данных.
