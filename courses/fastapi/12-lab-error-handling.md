# 12. Лаба: обработка ошибок

## Цель лабы

Добавить к CRUD-лабе ([06-lab-crud](06-lab-crud.md)) **единый формат ошибок** (`AppError` + handler), корректные **404/409**, `response_model` на успешные ответы и проверить поведение через `curl`.

## Предварительно

- [11. Ошибки и response_model](11-errors-response-model.md).
- Готовая база из урока 06 или новый каталог.

```bash
mkdir -p ~/fastapi-errors-lab && cd ~/fastapi-errors-lab
python -m venv .venv && source .venv/bin/activate
pip install "fastapi[standard]"
```

---

## Задание 1. Модели ошибок и AppError

`errors.py`:

```python
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error: dict

class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
```

---

## Задание 2. Handler в main.py

Фрагмент `main.py` (на базе CRUD из урока 06):

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from errors import AppError

app = FastAPI(title="Errors Lab")

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )
```

---

## Задание 3. Бизнес-ошибка 409

В `store.py` добавьте проверку уникальности title:

```python
def create_product(data: dict) -> dict:
    for row in _products.values():
        if row["title"].lower() == data["title"].lower():
            raise AppError("duplicate_title", "Product title already exists", 409)
    ...
```

Импортируйте `AppError` в `store.py`.

---

## Задание 4. HTTPException → 404

В `get_product` handler:

```python
from fastapi import HTTPException

row = store.get_product(product_id)
if not row:
    raise HTTPException(status_code=404, detail="Product not found")
```

**Зачем:** 404 оставляем стандартным; доменные — через `AppError`.

---

## Задание 5. response_model

Убедитесь, что все успешные ответы используют `ProductOut`:

```python
@app.post("/api/v1/products", response_model=ProductOut, status_code=201)
```

Добавьте лишнее поле в dict store `internal_note` — убедитесь, что клиент его **не видит**.

```bash
uvicorn main:app --reload --port 8030
```

---

## Задание 6. Проверка сценариев

```bash
# create ok
curl -s -X POST http://localhost:8030/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Unique","price":10}' | jq .

# duplicate 409
curl -s -X POST http://localhost:8030/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"unique","price":11}' | jq .

# 404
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8030/api/v1/products/999

# 422
curl -s -X POST http://localhost:8030/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"X","price":0}' | jq .
```

**Что увидите:**

- `201` + только поля `ProductOut`
- `409` + `{"error":{"code":"duplicate_title",...}}`
- `404` + `{"detail":"Product not found"}`
- `422` + массив `detail` от Pydantic

---

## Задание 7. OpenAPI responses (опционально)

Добавьте к POST:

```python
responses={409: {"description": "Duplicate title"}}
```

Проверьте в `/docs`.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| 409 возвращает 500 | `AppError` не наследует Exception правильно / handler не зарегистрирован |
| Handler не вызывается | exception_handler до `include_router` не важно — но на том же `app` |
| 409 с телом `detail` | подняли HTTPException вместо AppError |
| internal_note виден клиенту | нет `response_model` на endpoint |
| Circular import store↔errors | errors без импорта store |

---

## Критерии успеха

- [ ] `AppError` → JSON `error.code` / `error.message`
- [ ] Дубликат title → **409**
- [ ] Несуществующий id → **404**
- [ ] Невалидный price → **422**
- [ ] `internal_note` не в ответе API

## Уборка

```bash
rm -rf ~/fastapi-errors-lab
```

## Вопросы для самопроверки

1. Почему 404 оставили как `HTTPException`, а 409 — как `AppError`?
2. Можно ли одним handler покрыть и 404? Стоит ли?
3. Что попадёт в OpenAPI для 422?
4. Как залогировать `AppError` без утечки в клиент?

Следующий урок: [13. SQLAlchemy async](13-sqlalchemy-async.md).
