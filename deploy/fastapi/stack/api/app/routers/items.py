from fastapi import APIRouter

router = APIRouter(prefix="/items", tags=["items"])

_ITEMS: list[dict] = [
    {"id": 1, "title": "Demo item", "description": "From course stack"},
]


@router.get("")
async def list_items():
    return {"items": _ITEMS, "total": len(_ITEMS)}


@router.get("/{item_id}")
async def get_item(item_id: int):
    for item in _ITEMS:
        if item["id"] == item_id:
            return item
    return {"detail": "Not found"}
