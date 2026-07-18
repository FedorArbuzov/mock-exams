# 09. Лаба: модульное приложение

## Цель лабы

Разбить монолитный `main.py` на **пакет `app/`** с роутерами `health` и `products`, общим `api/v1` префиксом и Pydantic-схемами в отдельном модуле. Запустить локально и сравнить структуру с [`deploy/fastapi/stack/api`](../../deploy/fastapi/stack/api).

## Предварительно

- [08. Структура проекта](08-project-structure.md).
- Python 3.11+, venv.

```bash
mkdir -p ~/fastapi-modular/app/routers ~/fastapi-modular/app/schemas
cd ~/fastapi-modular
python -m venv .venv && source .venv/bin/activate
pip install "fastapi[standard]"
```

Стенд (опционально):

```bash
cd deploy/fastapi && docker compose up -d
tree deploy/fastapi/stack/api/app 2>/dev/null || find deploy/fastapi/stack/api/app -type f
```

---

## Задание 1. Схемы

**Зачем:** schemas отдельно от HTTP.

Файл `app/schemas/product.py`:

```python
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    title: str = Field(min_length=1)
    price: float = Field(gt=0)

class ProductOut(BaseModel):
    id: int
    title: str
    price: float
```

Пустые `app/__init__.py`, `app/schemas/__init__.py`, `app/routers/__init__.py`.

---

## Задание 2. In-memory store и router

`app/store.py`:

```python
_products: list[dict] = []
_next = 1

def create(data: dict) -> dict:
    global _next
    row = {"id": _next, **data}
    _products.append(row)
    _next += 1
    return row

def list_all() -> list[dict]:
    return list(_products)
```

`app/routers/products.py`:

```python
from fastapi import APIRouter

from app.schemas.product import ProductCreate, ProductOut
from app import store

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=list[ProductOut])
async def list_products():
    return store.list_all()

@router.post("", response_model=ProductOut, status_code=201)
async def create_product(body: ProductCreate):
    return store.create(body.model_dump())
```

`app/routers/health.py`:

```python
from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    return {"status": "ok", "module": "modular-lab"}
```

---

## Задание 3. main.py

`app/main.py`:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.routers import health, products

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Modular Lab", lifespan=lifespan)
app.include_router(health.router)
app.include_router(products.router, prefix="/api/v1")
```

Запуск **из каталога** `~/fastapi-modular`:

```bash
uvicorn app.main:app --reload --port 8020
```

**Что увидите:** `Application startup complete` без ImportError.

---

## Задание 4. Проверка путей

```bash
curl -s http://localhost:8020/health | jq .
curl -s -X POST http://localhost:8020/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Modular Mug","price":12.5}' | jq .
curl -s http://localhost:8020/api/v1/products | jq .
```

**Что увидите:** health с `module`; product `id: 1`; список длиной 1.

---

## Задание 5. OpenAPI теги

Откройте [http://localhost:8020/docs](http://localhost:8020/docs).

**Что увидите:** две группы — `health` и `products`; пути не дублируются.

Сравните с [http://localhost:8090/docs](http://localhost:8090/docs) — те же принципы `include_router`.

---

## Задание 6. Добавить api/v1/router.py (опционально)

Создайте `app/api/v1/router.py`, соберите роутеры там, в `main.py` только:

```python
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")
```

**Зачем:** при росте до 10+ модулей один файл сборки v1.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `No module named 'app'` | uvicorn запускайте из родителя пакета `app/` |
| 404 на `/api/v1/health` | health без prefix v1 — путь `/health` |
| Дубли путей в OpenAPI | не подключайте router дважды |
| Import cycle | schemas не импортируют routers |
| Reload не видит новые файлы | перезапустите uvicorn |

---

## Критерии успеха

- [ ] Структура `app/main.py`, `app/routers/*`, `app/schemas/*`
- [ ] `/health` и `/api/v1/products` работают
- [ ] Swagger показывает теги `health`, `products`
- [ ] POST создаёт сущность, GET list возвращает массив
- [ ] Понятна аналогия с `deploy/fastapi/stack/api/app`

## Уборка

```bash
# Ctrl+C
rm -rf ~/fastapi-modular
```

## Вопросы для самопроверки

1. Почему `health` вынесли в отдельный router?
2. Где лучше хранить `Settings` в большом проекте?
3. Что добавит слой `services/` по сравнению с прямым `store`?
4. Какой урок покрывает **pydantic-settings**?

Следующий урок: [10. Настройки](10-settings.md).
