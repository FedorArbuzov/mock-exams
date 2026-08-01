# 21. Lab: login and protected routes

## Lab goal

Implement **OAuth2 Password + JWT** on the [`deploy/fastapi`](../../deploy/fastapi/README.md) stand: user registration, `POST /auth/token`, protecting `POST /items` via `get_current_user`, and verifying **401/403**.

Theory: [19-oauth2-jwt](19-oauth2-jwt.md), [20-rbac-scopes](20-rbac-scopes.md).

---

## Prerequisites

```bash
cd deploy/fastapi
docker compose up -d --build
```

The `JWT_SECRET` variable is already in `docker-compose.yml`. API: [http://localhost:8090/docs](http://localhost:8090/docs).

---

## Task 1. The User model and security utils

`app/models/user.py`:

```python
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.item import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String(32), default="user")
```

`app/core/security.py` — `pwd_context`, `create_access_token`, `decode_token` from [19-oauth2-jwt](19-oauth2-jwt.md).

`app/core/settings.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET: str = "change-me"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Task 2. Registration (dev-only)

```python
# app/routers/auth.py
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

@router.post("/auth/register", status_code=201)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    if await get_user_by_email(db, body.email):
        raise HTTPException(400, detail="Email taken")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"id": user.id, "email": user.email}
```

```bash
curl -s -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"lab@course.local","password":"secretpass"}'
```

**In production** registration is closed off or confirmed by email — this is a learning endpoint.

---

## Task 3. Token endpoint

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

@router.post("/auth/token")
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, detail="Incorrect username or password",
                            headers={"WWW-Authenticate": "Bearer"})
    token = create_access_token(str(user.id), settings.JWT_SECRET)
    return {"access_token": token, "token_type": "bearer"}
```

```bash
curl -s -X POST http://localhost:8090/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=lab@course.local&password=secretpass"
```

Save the `access_token` into a variable.

---

## Task 4. get_current_user and protected CRUD

`app/deps/auth.py`:

```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token, settings.JWT_SECRET)
        uid = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(401, detail="Invalid token", headers={"WWW-Authenticate": "Bearer"})
    user = await db.get(User, uid)
    if not user or not user.is_active:
        raise HTTPException(401, detail="Inactive user")
    return user
```

Update `POST /items`:

```python
@router.post("/items", response_model=ItemOut, status_code=201)
async def create_item(
    body: ItemCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = Item(**body.model_dump(), owner_id=user.id)
    ...
```

Verification:

```bash
# without a token → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8090/api/v1/items \
  -H "Content-Type: application/json" -d '{"title":"x"}'

# with a token → 201
curl -s -X POST http://localhost:8090/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"owned item"}'
```

---

## Task 5. Swagger Authorize

1. Open [http://localhost:8090/docs](http://localhost:8090/docs).
2. **Authorize** → get a token via `/auth/token` or paste a Bearer manually.
3. Call the protected `POST /items`.

**What you'll see:** a lock on the operations with `OAuth2PasswordBearer`.

---

## Task 6. RBAC (bonus)

Add `require_role("admin")` to `DELETE /users/{id}`. A `user` → **403**.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| bcrypt `ValueError` on Windows | run it in the container: `docker compose exec api ...` |
| 401 with the correct password | the email is `username` in the form; check the hash in the DB |
| `JWT_SECRET` mismatch | one secret in compose and settings |
| 422 on /auth/token | `Content-Type: application/x-www-form-urlencoded`, not JSON |
| Token expired immediately | check `exp` and the UTC time zone |

```bash
docker compose logs -f api
docker exec mock-fastapi-postgres psql -U course -d course \
  -c "SELECT id, email, left(hashed_password,20) FROM users;"
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | Password in the DB only as a bcrypt hash |
| 2 | `/auth/token` returns a JWT; `/me` or create item with Bearer works |
| 3 | Without Bearer — **401** with `WWW-Authenticate` |
| 4 | `owner_id` is set from `current_user.id` |
| 5 | Swagger Authorize works |

---

## Cleanup

Test users: `DELETE FROM users WHERE email='lab@course.local';`

## Self-check questions

1. Why doesn't login accept a JSON body?
2. Where do you store the refresh token in the browser?
3. How do you revoke an access token before `exp`? See [28-redis-cache](28-redis-cache.md).

Next: [22-security-checklist](22-security-checklist.md).
