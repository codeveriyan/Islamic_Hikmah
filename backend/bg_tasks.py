"""Background task helpers for the FastAPI server."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Coroutine

logger = logging.getLogger(__name__)


def safe_bg_task(coro: Coroutine[Any, Any, Any]) -> None:
    """Schedule a coroutine without blocking the current request path."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # Sync context (e.g. some unit-test helpers): drop work cleanly.
        if asyncio.iscoroutine(coro):
            coro.close()
        return

    def _log_done(task: asyncio.Task) -> None:
        try:
            exc = task.exception()
        except asyncio.CancelledError:
            return
        if exc is not None:
            logger.warning("Background task failed: %s", exc)

    task = loop.create_task(coro)
    task.add_done_callback(_log_done)
