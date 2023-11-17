from typing import List, Optional

from pydantic import BaseModel


class Reduced_embedding(BaseModel):
    x: float
    y: float


class PlotData(BaseModel):
    sentence: str
    segment: str
    code: int
    cluster: Optional[int]
    reduced_embedding: Optional[Reduced_embedding]


class PlotEntry(BaseModel):
    id: int
    sentence: str
    segment: str
    code: int
    reduced_embedding: Optional[Reduced_embedding]
    cluster: Optional[int]


class PlotTable(BaseModel):
    length: int
    count: Optional[int]
    limit: Optional[int]
    page: Optional[int]
    page_size: Optional[int]
    data: List[PlotEntry]


class DataPlotResponse(BaseModel):
    data: PlotEntry
