import functools


def trace_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"call {func.__name__}")
        return func(*args, **kwargs)

    return wrapper
