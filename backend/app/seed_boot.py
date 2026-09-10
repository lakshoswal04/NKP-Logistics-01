"""Boot-time seeding entry point.

Kept separate from ``app.seed`` so the start command reads plainly and so
running the seeder by hand (``python -m app.seed``) stays unconditional, while
the deploy path respects SEED_ON_START.
"""

import asyncio
import logging

from app.seed import seed_if_enabled

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    asyncio.run(seed_if_enabled())
