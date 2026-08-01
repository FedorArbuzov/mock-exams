def running_max(nums):
    cur = None
    for x in nums:
        cur = x if cur is None else max(cur, x)
        yield cur
