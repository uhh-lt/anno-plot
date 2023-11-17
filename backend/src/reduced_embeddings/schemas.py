from typing import List, Optional

from pydantic import BaseModel


class ReducedEmbeddingData(BaseModel):
    reduced_embedding: List[float]


class ReducedEmbeddingEntry(BaseModel):
    id: int
    reduced_embedding: List[float]


class ReducedEmbeddingTable(BaseModel):
    length: int
    page: Optional[int]
    page_size: Optional[int]
    data: List[ReducedEmbeddingEntry]


class DataReducedEmbeddingResponse(BaseModel):
    data: ReducedEmbeddingEntry
