"""User service with external dependency — mock in tests."""
from dataclasses import dataclass

import httpx


@dataclass
class User:
    id: int
    email: str
    active: bool


class UserService:
    def __init__(self, base_url: str, client: httpx.Client | None = None):
        self.base_url = base_url.rstrip("/")
        self._client = client
        self._owns_client = client is None

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=5.0)
        return self._client

    def get_user(self, user_id: int) -> User:
        client = self._get_client()
        r = client.get(f"{self.base_url}/users/{user_id}")
        r.raise_for_status()
        data = r.json()
        return User(id=data["id"], email=data["email"], active=data["active"])

    def close(self) -> None:
        if self._owns_client and self._client is not None:
            self._client.close()
            self._client = None

    def __enter__(self) -> "UserService":
        return self

    def __exit__(self, *args) -> None:
        self.close()
