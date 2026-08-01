# 12. Lab: error handling

## Lab goal

Add to the CRUD lab ([06-lab-crud](06-lab-crud.md)) a **unified error format** (`AppError` + handler), correct **404/409**, a `response_model` on successful responses, and verify the behavior with `curl`.

## Prerequisites

- [11. Errors and response_model](11-errors-response-model.md).
- The finished base from lesson 06 or a new directory.

```bash
mkdir -p ~/fastapi-errors-lab && cd ~/fastapi-errors-lab
python -m venv .venv && source .venv/bin/activate
pip install "fastapi[standard]"
```

---

## Task 1. Error models and AppError

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

## Task 2. Handler in main.py

A `main.py` fragment (based on the CRUD from lesson 06):

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

## Task 3. A 409 business error

In `store.py`, add a title uniqueness check:

```python
def create_product(data: dict) -> dict:
    for row in _products.values():
        if row["title"].lower() == data["title"].lower():
            raise AppError("duplicate_title", "Product title already exists", 409)
    ...
```

Import `AppError` into `store.py`.

---

## Task 4. HTTPException → 404

In the `get_product` handler:

```python
from fastapi import HTTPException

row = store.get_product(product_id)
if not row:
    raise HTTPException(status_code=404, detail="Product not found")
```

**Why:** we keep 404 standard; domain errors go through `AppError`.

---

## Task 5. response_model

Make sure all successful responses use `ProductOut`:

```python
@app.post("/api/v1/products", response_model=ProductOut, status_code=201)
```

Add an extra field `internal_note` to the store dict — confirm the client **doesn't see** it.

```bash
uvicorn main:app --reload --port 8030
```

---

## Task 6. Scenario verification

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

**What you'll see:**

- `201` + only `ProductOut` fields
- `409` + `{"error":{"code":"duplicate_title",...}}`
- `404` + `{"detail":"Product not found"}`
- `422` + a `detail` array from Pydantic

---

## Task 7. OpenAPI responses (optional)

Add to POST:

```python
responses={409: {"description": "Duplicate title"}}
```

Check it in `/docs`.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| 409 returns 500 | `AppError` doesn't inherit Exception correctly / handler not registered |
| Handler isn't called | exception_handler before `include_router` doesn't matter — but must be on the same `app` |
| 409 with a `detail` body | you raised HTTPException instead of AppError |
| internal_note visible to the client | no `response_model` on the endpoint |
| Circular import store↔errors | keep errors free of store imports |

---

## Success criteria

- [ ] `AppError` → JSON `error.code` / `error.message`
- [ ] Duplicate title → **409**
- [ ] Non-existent id → **404**
- [ ] Invalid price → **422**
- [ ] `internal_note` not in the API response

## Cleanup

```bash
rm -rf ~/fastapi-errors-lab
```

## Self-check questions

1. Why did we keep 404 as `HTTPException` but 409 as `AppError`?
2. Can a single handler cover 404 too? Should it?
3. What ends up in OpenAPI for 422?
4. How do you log an `AppError` without leaking it to the client?

Next lesson: [13. SQLAlchemy async](13-sqlalchemy-async.md).
