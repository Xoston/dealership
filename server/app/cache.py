from functools import wraps
import time

# Хранилище: { ключ: (данные, время_сохранения) }
_cache = {}
TTL = 30  # время жизни кэша в секундах

def cached(ttl=TTL):
    """Декоратор для кеширования результатов функции"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Ключ – название функции + аргументы
            key = f"{func.__name__}:{args}:{kwargs}"
            now = time.time()
            if key in _cache:
                data, timestamp = _cache[key]
                if now - timestamp < ttl:
                    return data
            result = func(*args, **kwargs)
            _cache[key] = (result, now)
            return result
        return wrapper
    return decorator

def clear_cache():
    """Очистить весь кэш (вызывается при изменении данных)"""
    _cache.clear()

def invalidate_cache(pattern=None):
    """Удалить записи кэша, содержащие указанную строку"""
    if pattern is None:
        clear_cache()
    else:
        to_remove = [k for k in _cache if pattern in k]
        for k in to_remove:
            del _cache[k]