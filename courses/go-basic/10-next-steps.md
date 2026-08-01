# 10. Что дальше

## Вы прошли go-basic — что это значит

Вы умеете читать и писать **обычный** Go: типы, structs, errors, пакеты, тесты, JSON. Этого достаточно, чтобы открыть **`go-intermediate`** и не тратить неделю на синтаксис.

## Следующий шаг: go-intermediate

См. [`golang-path.md`](../golang-path.md):

| Тема | Где |
|------|-----|
| HTTP API (Chi/Gin) | `go-intermediate` |
| Postgres (pgx, sqlc) | `go-intermediate` + [`postgresql-developer`](../postgresql-developer/README.md) |
| JWT, middleware, slog | `go-intermediate` |
| Стенд shop API | `deploy/go-api` *(план)* `:8099`, контракт как у [`fastapi`](../../deploy/fastapi/README.md) `:8090` |

Параллельно полезно: [`api-design`](../api-design/README.md) (REST, ошибки, версии).

## Что сознательно не входило в basic

| Тема | Курс |
|------|------|
| Goroutines, channels, `context` | [`go-concurrency`](../golang-path.md) |
| httptest, mocks, testcontainers | [`go-testing`](../golang-path.md) |
| GC, scheduler, escape analysis | `go-internals` |
| LeetCode-паттерны | `go-algorithms` |
| client-go, operators | `go-cloud-native` |

Не застревайте в basic «пока не выучу всё» — **лучший Go учится на реальном API**.

## Быстрый self-check перед intermediate

- [ ] Объясняете разницу slice и array, value vs pointer receiver
- [ ] Написали `if err != nil` без раздражения
- [ ] Сделали table-driven test
- [ ] Разнесли `main` и `internal/` пакет
- [ ] Прочитали чужой handler с `http.ResponseWriter` — хотя бы на уровне «понимаю сигнатуру»

## Interview

Краткая шпаргалка — [`interview-cheatsheet.md`](interview-cheatsheet.md). Полный разбор вопросов — в `go-interviews` *(план)*.

---

**go-basic завершён.** Откройте `golang-path.md` и переходите к `go-intermediate`, когда он появится в репозитории — или начните с официального [Tutorial](https://go.dev/doc/tutorial/) и кода shop в FastAPI для контраста стеков.
