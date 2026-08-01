# 09. Lab: modular app

## Lab goal

Split the monolithic `main.py` into an **`app/` package** with `health` and `products` routers, a shared `api/v1` prefix, and Pydantic schemas in their own module. Run it locally and compare the structure to [`deploy/fastapi/stack/api`](../../deploy/fastapi/stack/api).

## Prerequisites

- [08. Project structure](08-project-structure.md).
- Python 3.11+, venv.

```bash
mkdir -p ~/fastapi-modular/app/routers ~/fastapi-modular/app/schemas
cd ~/fastapi-modular
python -m venv .venv && source .venv/bin/activate
pip install "fastapi[standard]"
```

Course stand (optional):

```bash
cd deploy/fastapi && docker compose up -d
tree deploy/fastapi/stack/api/app 2>/dev/null || find deploy/fastapi/stack/api/app -type f
```

---

## Task 1. Schemas

**Why:** schemas live separately from HTTP concerns.

File `app/schemas/product.py`:

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

Empty `app/__init__.py`, `app/schemas/__init__.py`, `app/routers/__init__.py`.

---

## Task 2. In-memory store and router

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

## Task 3. main.py

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

Run it **from the directory** `~/fastapi-modular`:

```bash
uvicorn app.main:app --reload --port 8020
```

**What you'll see:** `Application startup complete` with no ImportError.

---

## Task 4. Checking the routes

```bash
curl -s http://localhost:8020/health | jq .
curl -s -X POST http://localhost:8020/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Modular Mug","price":12.5}' | jq .
curl -s http://localhost:8020/api/v1/products | jq .
```

**What you'll see:** health with `module`; a product with `id: 1`; a list of length 1.

---

## Task 5. OpenAPI tags

Open [http://localhost:8020/docs](http://localhost:8020/docs).

**What you'll see:** two groups — `health` and `products`; no duplicated paths.

Compare with [http://localhost:8090/docs](http://localhost:8090/docs) — the same `include_router` principles.

---

## Task 6. Add api/v1/router.py (optional)

Create `app/api/v1/router.py`, assemble the routers there, and keep `main.py` down to:

```python
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")
```

**Why:** once you grow past 10+ modules, you want a single file that assembles v1.

---

## Troubleshooting

| Symptom | Action |
|---------|--------|
| `No module named 'app'` | Run uvicorn from the parent of the `app/` package |
| 404 on `/api/v1/health` | health has no v1 prefix — its path is `/health` |
| Duplicate paths in OpenAPI | Don't include a router twice |
| Import cycle | schemas must not import routers |
| Reload doesn't pick up new files | Restart uvicorn |

---

## Success criteria

- [ ] Structure: `app/main.py`, `app/routers/*`, `app/schemas/*`
- [ ] `/health` and `/api/v1/products` work
- [ ] Swagger shows the `health` and `products` tags
- [ ] POST creates an entity, GET list returns an array
- [ ] You understand the analogy with `deploy/fastapi/stack/api/app`

## Cleanup

```bash
# Ctrl+C
rm -rf ~/fastapi-modular
```

## Self-check questions

1. Why was `health` split into its own router?
2. Where should `Settings` live in a larger project?
3. What does a `services/` layer add compared to talking to `store` directly?
4. Which lesson covers **pydantic-settings**?

Next lesson: [10. Settings](10-settings.md).
