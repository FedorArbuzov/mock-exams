from shop.tasks import PROCESSED_IDS, add, process_order


def test_add():
    assert add(2, 3) == 5


def test_process_order_idempotent():
    PROCESSED_IDS.clear()
    first = process_order("test-ord-1", "10.00")
    second = process_order("test-ord-1", "10.00")
    assert first["status"] == "completed"
    assert second["status"] == "already_processed"


def test_process_order_completes():
    PROCESSED_IDS.clear()
    result = process_order("test-ord-2", "15.00")
    assert result["status"] == "completed"
    assert result["amount"] == "15.00"
