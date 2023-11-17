from typing import List

from pydantic import BaseModel


class Correction(BaseModel):
    id: int
    pos: List[float]
