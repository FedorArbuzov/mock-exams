import pytest
from sqlalchemy import func, select

from shop.models import Category, Product


@pytest.fixture
def seeded_products(db_session):
    if db_session.scalar(select(Category).limit(1)):
        return
    cat = Category(name="Test Books", slug="test-books")
    db_session.add(cat)
    db_session.flush()
    db_session.add(Product(sku="TEST-1", title="Test", price="9.99", category=cat))
    db_session.flush()


def test_product_count(db_session, seeded_products):
    n = db_session.scalar(select(func.count()).select_from(Product))
    assert n >= 1


def test_product_has_category(db_session, seeded_products):
    p = db_session.scalar(select(Product).where(Product.sku == "TEST-1"))
    assert p.category.slug == "test-books"
