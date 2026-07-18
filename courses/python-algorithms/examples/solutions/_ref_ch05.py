"""Эталон — глава 05. Не импортировать в тесты."""


def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]
        if s < target:
            left += 1
        else:
            right -= 1
    return []


def remove_duplicates_sorted(nums: list[int]) -> int:
    if not nums:
        return 0
    w = 1
    for r in range(1, len(nums)):
        if nums[r] != nums[r - 1]:
            nums[w] = nums[r]
            w += 1
    return w


def max_area_heights(heights: list[int]) -> int:
    left, right = 0, len(heights) - 1
    best = 0
    while left < right:
        h = min(heights[left], heights[right])
        best = max(best, h * (right - left))
        if heights[left] < heights[right]:
            left += 1
        else:
            right -= 1
    return best
