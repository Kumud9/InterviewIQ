import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.config import settings

logger = logging.getLogger(__name__)

class QdrantStore:
    def __init__(self):
        self.client = None
        self.collection_name = "curriculum_chunks"
        self._initialize_client()

    def _initialize_client(self):
        try:
            if settings.QDRANT_URL:
                logger.info(f"Connecting to Qdrant at URL: {settings.QDRANT_URL}")
                self.client = QdrantClient(
                    url=settings.QDRANT_URL, 
                    api_key=settings.QDRANT_API_KEY
                )
            elif settings.QDRANT_HOST:
                logger.info(f"Connecting to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
                self.client = QdrantClient(
                    host=settings.QDRANT_HOST, 
                    port=settings.QDRANT_PORT
                )
            else:
                logger.info("Initializing in-memory Qdrant client")
                self.client = QdrantClient(location=":memory:")
            
            # Ensure collection exists
            self._ensure_collection()
        except Exception as e:
            logger.warning(f"Failed to connect to Qdrant server, falling back to in-memory mode: {e}")
            self.client = QdrantClient(location=":memory:")
            self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = self.client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=1536,  # Standard OpenAI text-embedding-3-small or text-embedding-ada-002 size
                        distance=models.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection: {e}")

    def add_documents(self, documents: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Adds text documents with precomputed embeddings to Qdrant.
        """
        try:
            points = []
            for idx, (doc, vector) in enumerate(zip(documents, embeddings)):
                points.append(
                    models.PointStruct(
                        id=idx + int(datetime.utcnow().timestamp() * 1000) % 10000000,
                        vector=vector,
                        payload=doc
                    )
                )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Successfully added {len(documents)} documents to Qdrant")
            return True
        except Exception as e:
            logger.error(f"Failed to add documents to Qdrant: {e}")
            return False

    def search(self, query_vector: List[float], limit: int = 3) -> List[Dict[str, Any]]:
        """
        Searches Qdrant for documents similar to the query vector.
        """
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit
            )
            return [res.payload for res in results]
        except Exception as e:
            logger.error(f"Qdrant search failed: {e}")
            return []

from datetime import datetime
qdrant_store = QdrantStore()
