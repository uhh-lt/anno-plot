from typing import List, Optional

from pydantic import BaseModel


class EmbeddingEntry(BaseModel):
    id: int
    embedding: List[float]


class DataEmbeddingResponse(BaseModel):
    data: EmbeddingEntry


class EmbeddingTable(BaseModel):
    length: int
    page: Optional[int]
    page_size: Optional[int]
    reduce_length: int
    data: List[EmbeddingEntry]
    id: Optional[int]


class EmbeddingData(BaseModel):
    embedding: List[float]
