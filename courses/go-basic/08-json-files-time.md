# 08. JSON, файлы, time

Минимум для CLI и для чтения конфигов/API в `go-intermediate`.

## encoding/json

```go
type Task struct {
    ID     string    `json:"id"`
    Title  string    `json:"title"`
    Done   bool      `json:"done"`
    Tags   []string  `json:"tags,omitempty"`
}

data, err := json.Marshal(t)
err = json.Unmarshal(data, &t)
```

- Теги `json:"field_name"` — имя в JSON.
- `omitempty` — пропуск нулевых значений.
- **Unmarshal только в pointer:** `json.Unmarshal(data, &t)`.

Для HTTP в intermediate используете `json.NewEncoder(w).Encode(v)` — те же теги.

## Файлы

```go
data, err := os.ReadFile("data/tasks.json")
err = os.WriteFile("data/tasks.json", data, 0o644)
```

Создайте каталог заранее или обработайте `os.IsNotExist`.

Построчное чтение:

```go
scanner := bufio.NewScanner(f)
for scanner.Scan() {
    line := scanner.Text()
}
```

Пути: `filepath.Join("data", "tasks.json")` — кроссплатформенно.

## time

```go
now := time.Now().UTC()
s := now.Format(time.RFC3339)
parsed, err := time.Parse(time.RFC3339, s)
```

Layout в Go — **эталонная дата** `Mon Jan 2 15:04:05 MST 2006`, не `YYYY-MM-DD`.

Для «сейчас + 24h»: `time.Now().Add(24 * time.Hour)`.

## Типичные ошибки

- Unmarshal в значение, не в pointer.
- Забытые теги — JSON `user_id`, поле `UserID` без тега не совпадёт.
- Сравнение `time.Time` без `.UTC()` — разные зоны.

## Чек-лист

- [ ] Struct сериализуется в JSON с тегами
- [ ] Прочитали/записали файл через `os`
- [ ] Отформатировали время в RFC3339

Дальше: [09. Лаба: мини-CLI](09-lab-mini-cli.md).
