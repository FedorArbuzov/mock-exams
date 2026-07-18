# 21. Лаба: login и защищённые роуты

## Цель лабы

Реализовать **OAuth2 Password + JWT** на стенде [`deploy/fastapi`](../../deploy/fastapi/README.md): регистрация пользователя, `POST /auth/token`, защита `POST /items` через `get_current_user`, проверка **401/403**.

Теория: [19-oauth2-jwt](19-oauth2-jwt.md), [20-rbac-scopes](20-rbac-scopes.md).

---

## Предварительно

```bash
cd deploy/fastapi
docker compose up -d --build
```

Переменная `JWT_SECRET` уже в `docker-compose.yml`. API: [http://localhost:8090/docs](http://localhost:8090/docs).

---

## Задание 1. Модель User и security utils

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

`app/core/security.py` — `pwd_context`, `create_access_token`, `decode_token` из [19-oauth2-jwt](19-oauth2-jwt.md).

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

## Задание 2. Регистрация (dev-only)

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

**В production** регистрацию закрывают или подтверждают email — здесь учебный endpoint.

---

## Задание 3. Token endpoint

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

Сохраните `access_token` в переменную.

---

## Задание 4. get_current_user и защищённый CRUD

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

Обновите `POST /items`:

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

Проверка:

```bash
# без токена → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8090/api/v1/items \
  -H "Content-Type: application/json" -d '{"title":"x"}'

# с токеном → 201
curl -s -X POST http://localhost:8090/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"owned item"}'
```

---

## Задание 5. Swagger Authorize

1. Откройте [http://localhost:8090/docs](http://localhost:8090/docs).
2. **Authorize** → получите token через `/auth/token` или вставьте Bearer вручную.
3. Вызовите защищённый `POST /items`.

**Что увидите:** замок на операциях с `OAuth2PasswordBearer`.

---

## Задание 6. RBAC (бонус)

Добавьте `require_role("admin")` на `DELETE /users/{id}`. Пользователь `user` → **403**.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| bcrypt `ValueError` на Windows | выполняйте в контейнере: `docker compose exec api ...` |
| 401 при верном пароле | email в form — `username`; проверьте hash в БД |
| `JWT_SECRET` mismatch | один secret в compose и settings |
| 422 на /auth/token | `Content-Type: application/x-www-form-urlencoded`, не JSON |
| Token expired сразу | проверьте `exp` и часовой пояс UTC |

```bash
docker compose logs -f api
docker exec mock-fastapi-postgres psql -U course -d course \
  -c "SELECT id, email, left(hashed_password,20) FROM users;"
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | Пароль в БД только как bcrypt hash |
| 2 | `/auth/token` возвращает JWT, `/me` или create item с Bearer работает |
| 3 | Без Bearer — **401** с `WWW-Authenticate` |
| 4 | `owner_id` проставляется из `current_user.id` |
| 5 | Swagger Authorize работает |

---

## Уборка

Тестовых пользователей: `DELETE FROM users WHERE email='lab@course.local';`

## Вопросы для самопроверки

1. Почему login не принимает JSON body?
2. Где хранить refresh token в браузере?
3. Как отозвать access до `exp`? См. [28-redis-cache](28-redis-cache.md).

Далее: [22-security-checklist](22-security-checklist.md).
