from __future__ import annotations

from decimal import Decimal
from typing import Any

from shop_aws.clients import client, resource
from shop_aws.config import settings


class DynamoDBRepository:
    def __init__(self):
        self.table_name = settings.shop_table
        self._ddb = client("dynamodb")
        self._table = resource("dynamodb").Table(self.table_name)

    def ensure_table(self) -> None:
        existing = self._ddb.list_tables().get("TableNames", [])
        if self.table_name in existing:
            return
        self._ddb.create_table(
            TableName=self.table_name,
            KeySchema=[{"AttributeName": "pk", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "pk", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        waiter = self._ddb.get_waiter("table_exists")
        waiter.wait(TableName=self.table_name)

    def put_item(self, pk: str, data: dict[str, Any]) -> None:
        item = {"pk": pk, **data}
        item = {k: (v if isinstance(v, Decimal) else v) for k, v in item.items()}
        self._table.put_item(Item=item)

    def get_item(self, pk: str) -> dict | None:
        resp = self._table.get_item(Key={"pk": pk})
        return resp.get("Item")

    def delete_item(self, pk: str) -> None:
        self._table.delete_item(Key={"pk": pk})
