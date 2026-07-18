import pytest
from sqlalchemy import event
from shop.db import sync_engine
from shop.db import SyncSessionLocal


@pytest.fixture
def db_session():
    connection = sync_engine.connect()
    transaction = connection.begin()
    session = SyncSessionLocal(bind=connection)
    connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart(sess, trans):
        if trans.nested and not trans._parent.nested:
            connection.begin_nested()

    yield session
    session.close()
    transaction.rollback()
    connection.close()
