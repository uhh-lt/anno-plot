from typing import List, Optional

from pydantic import BaseModel


class ClusterData(BaseModel):
    cluster: int


class ClusterEntry(BaseModel):
    id: int
    cluster: int


class ClusterTable(BaseModel):
    length: int
    page: Optional[int]
    page_size: Optional[int]
    data: List[ClusterEntry]


class DataClusterResponse(BaseModel):
    data: ClusterEntry
