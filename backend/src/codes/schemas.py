"""
This module defines a Pydantic BaseModel for a MergeOperation, which represents the merging of multiple codes into a new code.
"""

from typing import List
from pydantic import BaseModel

# Pydantic BaseModel for a MergeOperation
class MergeOperation(BaseModel):
    list_of_codes: List[int]
    new_code_name: str
