# 06. Lab: in-memory CRUD

## Lab goal

Implement **full CRUD** for a `Product` entity in memory (dict/list): Pydantic models, path/query parameters, **201/404/422** codes. Verify with `curl` and Swagger. Write the code **locally** in a venv; the `8090` stand is used to compare your style with the reference.

## Prerequisites

- Completed [04. Pydantic v2](04-pydantic-v2.md) and [05. Parameters](05-parameters.md).
- Python 3.11+, venv.

```bash
mkdir -p ~/fastapi-crud-lab && cd ~/fastapi-crud-lab
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install "fastapi[standard]" httpx
```

Optional — the stand for reference:

```bash
cd deploy/fastapi && docker compose up -d
curl -s http://localhost:8090/api/v1/items | jq .
```

---

## Task 1. Models and storage

**Why:** to separate Create/Update/Out.

Create `models.py`:

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

Create `store.py`:

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

## Task 2. CRUD routes

**Why:** to reinforce Path, Query, Body, status codes.

Create `main.py`:

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

## Task 3. Create and list

```bash
curl -s -X POST http://localhost:8010/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Keyboard","price":49.99}' | jq .

curl -s http://localhost:8010/api/v1/products | jq .
```

**What you'll see:** `201` with `id: 1`; a list with one element.

---

## Task 4. Update and delete

```bash
curl -s -X PATCH http://localhost:8010/api/v1/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":39.99}' | jq .

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8010/api/v1/products/1

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/v1/products/1
```

**What you'll see:** the updated price; `204` on delete; `404` on the repeated get.

---

## Task 5. 422 validation

```bash
curl -s -X POST http://localhost:8010/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"","price":-1}' | jq .
```

**What you'll see:** `422` and a `detail` array with locations `body.title`, `body.price`.

---

## Task 6. Swagger

Open [http://localhost:8010/docs](http://localhost:8010/docs). Run create → list → patch → delete from the UI.

**What you'll see:** the `ProductCreate`, `ProductOut` schemas; code 204 for DELETE with no body.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `ModuleNotFoundError: models` | run uvicorn from the directory with `main.py` |
| DELETE returns 200 with a body | check `status_code=204` |
| PATCH wipes fields to `null` | use `exclude_unset=True` |
| 422 on PATCH `{}` | this is fine if all fields are optional — it should be 200 with the same object |
| Port 8010 in use | change `--port` |

---

## Success criteria

- [ ] POST creates a product with `201` and an auto `id`
- [ ] GET list respects `skip`/`limit`
- [ ] GET/PATCH/DELETE on a non-existent id → `404`
- [ ] Invalid body → `422` with a clear `detail`
- [ ] OpenAPI in `/docs` reflects all operations

## Cleanup

```bash
# Ctrl+C uvicorn
deactivate
cd ~ && rm -rf ~/fastapi-crud-lab   # optional
```

## Self-check questions

1. Why `response_model=list[ProductOut]` on list?
2. Why doesn't DELETE with code 204 return JSON?
3. How does `model_dump(exclude_unset=True)` differ from a full dump?
4. What changes when moving from a dict to Postgres ([13](13-sqlalchemy-async.md))?

Next lesson: [07. Dependency Injection](07-dependency-injection.md).
