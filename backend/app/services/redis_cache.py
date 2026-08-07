import json
import logging
from typing import Any, Optional
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        self.redis_client = None
        self.local_cache = {}  # Fallback in-memory cache
        self._initialize_client()

    def _initialize_client(self):
        if settings.REDIS_URL:
            try:
                logger.info(f"Connecting to Redis at: {settings.REDIS_URL}")
                self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                logger.info("Successfully connected to Redis")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis, falling back to local memory cache: {e}")
                self.redis_client = None
        else:
            logger.info("No Redis URL configured, using local in-memory cache")

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                data = self.redis_client.get(key)
                return json.loads(data) if data else None
            except Exception as e:
                logger.error(f"Redis get failed: {e}")
                return None
        else:
            return self.local_cache.get(key)

    def set(self, key: str, value: Any, expire_seconds: int = 3600) -> bool:
        if self.redis_client:
            try:
                self.redis_client.set(
                    key, 
                    json.dumps(value), 
                    ex=expire_seconds
                )
                return True
            except Exception as e:
                logger.error(f"Redis set failed: {e}")
                return False
        else:
            self.local_cache[key] = value
            # Simulating expiration could be added here, but for local testing standard storage is fine
            return True

    def delete(self, key: str) -> bool:
        if self.redis_client:
            try:
                self.redis_client.delete(key)
                return True
            except Exception as e:
                logger.error(f"Redis delete failed: {e}")
                return False
        else:
            if key in self.local_cache:
                del self.local_cache[key]
            return True

redis_cache = RedisCache()
