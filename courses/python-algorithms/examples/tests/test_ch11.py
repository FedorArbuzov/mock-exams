from problems.ch11_binary_search import find_min_rotated, search_rotated


def test_search_rotated():
    assert search_rotated([4, 5, 6, 7, 0, 1, 2], 0) == 4
    assert search_rotated([4, 5, 6, 7, 0, 1, 2], 3) == -1


def test_find_min():
    assert find_min_rotated([3, 4, 5, 1, 2]) == 1
    assert find_min_rotated([2, 1]) == 1
