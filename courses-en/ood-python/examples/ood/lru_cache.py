"""Chapter 11 — LRU Cache with O(1) get/put."""


class LRUCache:
    def __init__(self, capacity: int):
        raise NotImplementedError

    def get(self, key: int) -> int:
        """Return value or -1 if missing."""
        raise NotImplementedError

    def put(self, key: int, value: int) -> None:
        raise NotImplementedError
