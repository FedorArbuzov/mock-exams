from problems.ch09_hash_map import group_anagrams, longest_consecutive, two_sum


def test_two_sum():
    out = two_sum([2, 7, 11, 15], 9)
    assert sorted(out) == [0, 1]


def test_group_anagrams():
    groups = group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
    normalized = sorted(sorted(g) for g in groups)
    assert normalized == [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]


def test_longest_consecutive():
    assert longest_consecutive([100, 4, 200, 1, 3, 2]) == 4
    assert longest_consecutive([]) == 0
