import hashlib
import json
import os
from typing import Literal
from urllib.parse import unquote

env = {}
with open("../env.json") as f:
    env = json.load(f)


def get_root_path():
    os.makedirs(env["exported_folder"], exist_ok=True)
    return env["exported_folder"]


def get_project_path(project_id: int, type: Literal["models", "plots"]):
    path = os.path.join(env["exported_folder"], "projects", str(project_id), type)
    os.makedirs(path, exist_ok=True)
    return path


def get_file_path(project_id: int, type: Literal["models"], file_name: str):
    return os.path.join(get_project_path(project_id, type), file_name)


def generate_hash(model_dict: dict):
    # Convert dictionary to a string representation
    model_str = str(model_dict)

    # Generate hash using SHA256
    hash_object = hashlib.sha256(model_str.encode())
    return hash_object.hexdigest()
