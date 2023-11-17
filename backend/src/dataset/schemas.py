from pydantic import BaseModel


class DatasetCreate(BaseModel):
    name: str
    file_path: str


class DatasetTextOptions(BaseModel):
    split: str = "\\t"
    sentence_split: str = "\\n\\n"
    word_idx: int = 1
    label_split: str = "None"
    label_idx: int = 0
    type: str = "B-I-O"
