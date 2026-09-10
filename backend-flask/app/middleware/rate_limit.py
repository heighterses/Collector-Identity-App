import time
from functools import wraps
from collections import defaultdict, deque

from flask import request, jsonify

# In-memory sliding-window counters keyed by "scope:ip". This is intentionally
# dependency-free and per-process — enough to blunt brute-force / abuse on
# sensitive endpoints in a single-worker deployment. For multi-worker/production
# scale, back this with Redis (or Flask-Limiter) later.
_hits = defaultdict(deque)


def _client_ip():
    fwd = request.headers.get('X-Forwarded-For', '')
    if fwd:
        return fwd.split(',')[0].strip()
    return request.remote_addr or 'unknown'


def rate_limit(max_calls, per_seconds, scope='global'):
    """
    Allow at most `max_calls` per `per_seconds` window per client IP for this
    scope. Returns HTTP 429 when exceeded. Limits are generous by design so a
    normal user never hits them — only abusive bursts do.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            key = f'{scope}:{_client_ip()}'
            now = time.time()
            window = _hits[key]

            # Drop timestamps outside the window.
            cutoff = now - per_seconds
            while window and window[0] <= cutoff:
                window.popleft()

            if len(window) >= max_calls:
                return jsonify({
                    'error': 'Too many requests. Please wait a moment and try again.'
                }), 429

            window.append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator
