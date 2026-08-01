"""Chapter 12 — Token bucket rate limiter."""


class TokenBucketLimiter:
    """allow(n_tokens=1) -> True if request allowed else False."""

    def __init__(self, rate: float, capacity: float):
        """
        rate: tokens per second refill
        capacity: max tokens in bucket
        """
        raise NotImplementedError

    def allow(self, tokens: float = 1.0) -> bool:
        raise NotImplementedError
