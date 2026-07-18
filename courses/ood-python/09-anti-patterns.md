# 09. Когда паттерн не нужен

## Введение

«Применил 7 паттернов» — anti-hire. Интервьюер ищет **простоту** и обоснование.

---

## Антипаттерны OOD

| Антипаттерн | Проблема |
|-------------|----------|
| God class | всё в `SystemManager` |
| Anemic domain | только getters/setters, логика в service |
| Pattern fever | AbstractFactory для 2 кейсов |
| Premature microservices в OOD | 15 классов-сервисов |
| Наследование глубиной 5 | хрупкость |

---

## YAGNI на интервью

Реализуйте **требования сейчас** + **одну** точку расширения (interface).

«Если бы было 10 типов транспорта — ввёл бы Strategy».

---

## Python идиомы vs GoF

| GoF | Python often |
|-----|--------------|
| Strategy | callable / Protocol |
| Singleton | module |
| Decorator pattern | `@decorator` function |

---

## Подзадачи

**Время:** ~45 мин.

### 9.1 Refactor god (20 мин)

Разбейте вымышленный `AppManager` на 3 класса.

### 9.2 Justify pattern (15 мин)

Для parking — нужен ли Factory? аргумент да/нет.

### 9.3 Anemic fix (10 мин)

Перенесите одно правило в entity.

---

## Чек-лист

- [ ] Можете отказаться от паттерна?
- [ ] YAGNI phrase готов?

**Дальше:** [10. Parking Lot](10-parking-lot.md).
