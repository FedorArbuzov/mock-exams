# Go Basic — Interview Cheatsheet

Справочник **после** прохождения курса. Проверьте себя **без подглядывания** в главы, затем сверьтесь здесь и в [36-interview-qa.md](36-interview-qa.md).

---

## Быстрые ответы

### Типы и zero values

| Вопрос | Ответ |
|--------|-------|
| Zero value `int`, `string`, `bool` | `0`, `""`, `false` |
| Zero value slice, map, pointer | `nil` |
| `:=` | короткое объявление внутри функции |
| Экспорт | идентификатор с **заглавной** буквы |

### Slices и maps

| Вопрос | Ответ |
|--------|-------|
| Array vs slice | `[N]T` фикс. размер; `[]T` динамический заголовок |
| `append` | может новый backing array → присваивать результат |
| Запись в `nil` map | **panic** |
| Чтение из `nil` map | zero value, без panic |
| `delete(m, k)` | безопасно всегда |

### Указатели и methods

| Вопрос | Ответ |
|--------|-------|
| `&T{}` vs `new(T)` | оба `*T` на zero value |
| Pointer receiver | мутация struct, избежать копии |
| Value receiver | копия, для маленьких immutable типов |

### Interfaces и errors

| Вопрос | Ответ |
|--------|-------|
| Реализация interface | неявная, все методы совпали |
| `any` | alias `interface{}` |
| Идиома ошибок | `if err != nil { return ... }` |
| `%w` | wrap для `errors.Is` / `errors.As` |
| `panic` | баги / невосстановимо, не user input |

### defer / panic

| | |
|---|---|
| `defer` | LIFO при выходе из функции |
| `recover` | только внутри deferred func |

### Пакеты и модули

| | |
|---|---|
| `go mod init` | новый модуль |
| `go mod tidy` | синхронизация require |
| Импорт | путь из `go.mod` + `/pkg` |

### Concurrency (обзор)

| Вопрос | Ответ |
|--------|-------|
| Goroutine | `go f()` — легковесный поток, планируется runtime |
| `go` в цикле | одна переменная цикла до Go 1.22 — баг; передавать `i` параметром |
| Shared state | нужны mutex/channel — тема отдельного продвинутого курса |

### Тесты и tooling

| | |
|---|---|
| Table-driven | `[]struct{...}` + `t.Run` |
| `go test ./...` | все пакеты |
| `go test -race` | race detector (CI) |
| `go vet` | подозрительный код |

### JSON

| | |
|---|---|
| Экспорт полей | заглавная буква |
| `json:"name,omitempty"` | имя + пропуск zero value |
| `json:"-"` | игнор |
| `Unmarshal` | второй аргумент **указатель** |
| `time.Time` в JSON | RFC3339 строка |

### Время

| | |
|---|---|
| Layout эталон | `2006-01-02 15:04:05` |
| API формат | `time.RFC3339`, хранить UTC |
| `Parse` vs `ParseInLocation` | UTC default vs зона |

### Файлы

| | |
|---|---|
| Малый файл | `os.ReadFile` / `WriteFile` |
| Построчно | `bufio.Scanner` |
| Пути | `filepath.Join`, не `+ "/"` |
| Атомарная запись | `.tmp` + `os.Rename` |

---

## Мини-сниппеты

```go
// error wrap
if err != nil {
	return fmt.Errorf("load catalog: %w", err)
}

// errors.Is
if errors.Is(err, os.ErrNotExist) { /* ... */ }

// slice copy
out := append([]Task(nil), s.tasks...)

// safe defer close
f, err := os.Open(path)
if err != nil {
	return err
}
defer f.Close()

// table-driven test
for _, tc := range tests {
	t.Run(tc.name, func(t *testing.T) {
		got := fn(tc.in)
		if got != tc.want {
			t.Fatalf("got %v want %v", got, tc.want)
		}
	})
}

// JSON indent save
data, err := json.MarshalIndent(v, "", "  ")
if err != nil {
	return err
}
return writeAtomic(path, data, 0o644)
```

---

## Частые ловушки

1. Запись в **nil map** → panic
2. **Не присвоили** результат `append`
3. **Неэкспортируемое** поле не в JSON
4. `Unmarshal` без `&`
5. `omitempty` скрывает `false` / `0` — клиент не отличит «не задано»
6. `List()` отдаёт внутренний slice — мутация снаружи
7. Путь к файлу от **cwd**, не от исходника
8. Сравнение struct со slice/map полями через `==` — не компилируется
9. `interface{}` с JSON числом → **float64**
10. `panic` на плохой user input в CLI

---

## Capstone checklist

- [ ] `cmd/` + `internal/` layout
- [ ] `Load` / `Save` + atomic write
- [ ] `flag` для `-data` и фильтров
- [ ] exit 0 / 1, ошибки в stderr
- [ ] `go test` на validate и store

Подробно: [37-capstone.md](37-capstone.md).

---

[← README](README.md) · [36-interview-qa](36-interview-qa.md) · [37-capstone](37-capstone.md)
