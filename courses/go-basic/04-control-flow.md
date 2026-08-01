# 04. Управление потоком

## if

```go
if err != nil {
    return err
}

if n := len(items); n == 0 {
    return errors.New("empty")
}
// n виден только в этом if
```

Короткое объявление в `if` — идиоматично для `err` и локальных переменных.

## for — единственный цикл

```go
for i := 0; i < 10; i++ { }

for _, item := range items { }

for k, v := range m { }

for { /* бесконечный, выход break/return */ }
```

`range` по slice даёт индекс и значение; по map — ключ и значение. Строка в Go — байты UTF-8; `range` по `string` даёт **rune** (кодовую точку) и offset.

## switch

```go
switch status {
case "todo", "pending":
    // ...
case "done":
    // ...
default:
    // ...
}

switch {
case x < 0:
case x == 0:
default:
}
```

В Go **нет fallthrough по умолчанию** (кроме явного `fallthrough`).

## defer (введение)

```go
f, err := os.Open(path)
if err != nil {
    return err
}
defer f.Close()
```

`defer` откладывает вызов до выхода из функции — LIFO. Подробнее в [05-interfaces-errors.md](05-interfaces-errors.md).

## Типичные ошибки

- `:=` в `if` затеняет внешнюю `err` — классический баг: внешний `err` остаётся `nil`.
- Изменение slice во время `range` — непредсказуемо; копируйте или итерируйте по индексам.
- `break` в `switch` внутри `for` — выходит только из `switch`; нужен label или флаг.

## Чек-лист

- [ ] Написали `for range` по slice и map
- [ ] Использовали `if err != nil`
- [ ] Знаете, что `for` — единственный цикл

Дальше: [05. Interfaces и ошибки](05-interfaces-errors.md).
