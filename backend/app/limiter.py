"""Shared rate-limiter instance.

A single ``Limiter`` is created here so both ``main.py`` (which registers the
global exception handler and stores it on ``app.state``) and individual route
modules (which apply per-route ``@limiter.limit(...)`` decorators) can import
the same instance.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.constants import GLOBAL_RATE_LIMIT

limiter = Limiter(key_func=get_remote_address, default_limits=[GLOBAL_RATE_LIMIT])
