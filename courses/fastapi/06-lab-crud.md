# 06. Лаба: CRUD в памяти

## Цель лабы

Реализовать **полный CRUD** для сущности `Product` в памяти (dict/list): Pydantic-модели, path/query параметры, коды **201/404/422**. Проверить через `curl` и Swagger. Код пишется **локально** в venv; стенд `8090` используется для сверки стиля с эталоном.

## Предварительно

- Пройдены [04. Pydantic v2](04-pydantic-v2.md) и [05. Параметры](05-parameters.md).
- Python 3.11+, venv.

```bash
mkdir -p ~/fastapi-crud-lab && cd ~/fastapi-crud-lab
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install "fastapi[standard]" httpx
```

Опционально — стенд для референса:

```bash
cd deploy/fastapi && docker compose up -d
curl -s http://localhost:8090/api/v1/items | jq .
```

---

## Задание 1. Модели и хранилище

**Зачем:** разделить Create/Update/Out.

Создайте `models.py`:

```python
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    price: float = Field(gt=0)

class ProductUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=120)
    price: float | None = Field(None, gt=0)

class ProductOut(BaseModel):
    id: int
    title: str
    price: float
```

Создайте `store.py`:

```python
_products: dict[int, dict] = {}
_next_id = 1

def list_products(skip: int, limit: int) -> list[dict]:
    items = list(_products.values())[skip : skip + limit]
    return items

def create_product(data: dict) -> dict:
    global _next_id
    row = {"id": _next_id, **data}
    _products[_next_id] = row
    _next_id += 1
    return row

def get_product(pid: int) -> dict | None:
    return _products.get(pid)

def update_product(pid: int, patch: dict) -> dict | None:
    row = _products.get(pid)
    if not row:
        return None
    row.update({k: v for k, v in patch.items() if v is not None})
    return row

def delete_product(pid: int) -> bool:
    return _products.pop(pid, None) is not None
```

---

## Задание 2. Роуты CRUD

**Зачем:** закрепить Path, Query, Body, status codes.

Создайте `main.py`:

```python
from fastapi import FastAPI, HTTPException, Path, Query

from models import ProductCreate, ProductOut, ProductUpdate
import store

app = FastAPI(title="CRUD Lab")

@app.get("/api/v1/products", response_model=list[ProductOut])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return store.list_products(skip, limit)

@app.post("/api/v1/products", response_model=ProductOut, status_code=201)
async def create_product(body: ProductCreate):
    return store.create_product(body.model_dump())

@app.get("/api/v1/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: int = Path(ge=1)):
    row = store.get_product(product_id)
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return row

@app.patch("/api/v1/products/{product_id}", response_model=ProductOut)
async def update_product(product_id: int, body: ProductUpdate):
    row = store.update_product(product_id, body.model_dump(exclude_unset=True))
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return row

@app.delete("/api/v1/products/{product_id}", status_code=204)
async def delete_product(product_id: int):
    if not store.delete_product(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
```

```bash
uvicorn main:app --reload --port 8010
```

---

## Задание 3. Create и list

```bash
curl -s -X POST http://localhost:8010/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Keyboard","price":49.99}' | jq .

curl -s http://localhost:8010/api/v1/products | jq .
```

**Что увидите:** `201` с `id: 1`; список из одного элемента.

---

## Задание 4. Update и delete

```bash
curl -s -X PATCH http://localhost:8010/api/v1/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":39.99}' | jq .

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8010/api/v1/products/1

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/v1/products/1
```

**Что увидите:** обновлённая цена; `204` на delete; `404` на повторный get.

---

## Задание 5. Валидация 422

```bash
curl -s -X POST http://localhost:8010/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"","price":-1}' | jq .
```

**Что увидите:** `422` и массив `detail` с локациями `body.title`, `body.price`.

---

## Задание 6. Swagger

Откройте [http://localhost:8010/docs](http://localhost:8010/docs). Выполните create → list → patch → delete из UI.

**Что увидите:** схемы `ProductCreate`, `ProductOut`; код 204 у DELETE без тела.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `ModuleNotFoundError: models` | запускайте uvicorn из каталога с `main.py` |
| DELETE возвращает 200 с телом | проверьте `status_code=204` |
| PATCH затирает поля `null` | используйте `exclude_unset=True` |
| 422 на PATCH `{}` | это нормально, если все поля optional — должен быть 200 с тем же объектом |
| Порт 8010 занят | смените `--port` |

---

## Критерии успеха

- [ ] POST создаёт продукт с `201` и авто-`id`
- [ ] GET list учитывает `skip`/`limit`
- [ ] GET/PATCH/DELETE по несуществующему id → `404`
- [ ] Невалидный body → `422` с понятным `detail`
- [ ] OpenAPI в `/docs` отражает все операции

## Уборка

```bash
# Ctrl+C uvicorn
deactivate
cd ~ && rm -rf ~/fastapi-crud-lab   # опционально
```

## Вопросы для самопроверки

1. Зачем `response_model=list[ProductOut]` на list?
2. Почему DELETE с кодом 204 не возвращает JSON?
3. Чем `model_dump(exclude_unset=True)` отличается от полного dump?
4. Что изменится при переходе с dict на Postgres ([13](13-sqlalchemy-async.md))?

Следующий урок: [07. Dependency Injection](07-dependency-injection.md).
