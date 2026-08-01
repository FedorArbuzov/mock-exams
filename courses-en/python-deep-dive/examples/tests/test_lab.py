import pytest

from lab.decorators import trace_calls
from lab.descriptors import Order
from lab.generators import running_max


def test_trace_preserves_metadata():
    @trace_calls
    def add(a, b):
        """add two numbers"""
        return a + b

    assert add.__name__ == "add"
    assert add.__doc__ == "add two numbers"
    assert add(2, 3) == 5


def test_positive_descriptor():
    o = Order(2, 10.5)
    assert o.quantity == 2
    with pytest.raises(ValueError):
        Order(-1, 1)


def test_running_max():
    assert list(running_max([3, 1, 4, 2])) == [3, 3, 4, 4]
    assert list(running_max([])) == []
