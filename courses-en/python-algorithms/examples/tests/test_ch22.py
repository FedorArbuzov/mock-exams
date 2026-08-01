from problems.ch22_dp import climb_stairs, coin_change, length_of_lis


def test_climb_stairs():
    assert climb_stairs(1) == 1
    assert climb_stairs(3) == 3
    assert climb_stairs(5) == 8


def test_coin_change():
    assert coin_change([1, 2, 5], 11) == 3
    assert coin_change([2], 3) == -1


def test_lis():
    assert length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]) == 4
    assert length_of_lis([0, 1, 0, 3, 2, 3]) == 4
