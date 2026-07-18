import pytest


@pytest.fixture
def empty_cart():
    from shop.cart import Cart

    return Cart()
