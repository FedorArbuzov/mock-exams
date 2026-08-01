from problems.ch05_two_pointers import max_area_heights, remove_duplicates_sorted, two_sum_sorted


def test_two_sum_sorted():
    assert two_sum_sorted([2, 7, 11, 15], 9) == [0, 1]
    assert two_sum_sorted([1, 2, 3], 7) == []


def test_remove_duplicates():
    nums = [1, 1, 2, 2, 3]
    assert remove_duplicates_sorted(nums) == 3
    assert nums[:3] == [1, 2, 3]


def test_max_area():
    assert max_area_heights([1, 8, 6, 2, 5, 4, 8, 3, 7]) == 49
    assert max_area_heights([1, 1]) == 1
