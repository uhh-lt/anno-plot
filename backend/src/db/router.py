import os
from pathlib import Path as FilePath

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from db.service import (delete_all_tables, delete_table, get_table_info,
                        get_table_names, init_db)
from db.session import get_db
from utilities.string_operations import get_root_path

router = APIRouter()

# Define the root folder where your files are located
root_folder_path = get_root_path()


@router.get("/tables")
def get_table_names_route():
    return get_table_names()


@router.get("/tables/init")
def init_tables_route():
    return {"initialized": list(init_db())}


@router.delete("/tables")
def delete_all_tables_route():
    return {"deleted": delete_all_tables()}


@router.get("/tables/infos")
def get_table_info_route(db: Session = Depends(get_db)):
    return get_table_info(db)


@router.delete("/{table_name}")
async def delete_table_endpoint(table_name: str):
    return {"name": table_name, "deleted": delete_table(table_name)}


def list_files_recursive(folder_path):
    files = []
    for dirpath, dirnames, filenames in os.walk(folder_path):
        for filename in filenames:
            files.append(os.path.relpath(os.path.join(dirpath, filename), folder_path))
    return files


@router.get("/list-files")
async def list_all_files():
    # List all files in the root folder and its subfolders
    files = list_files_recursive(root_folder_path)
    return {"files": files}


@router.get("/download/{file_path:path}")
async def download_file(file_path: str):
    # Ensure the requested file exists
    file_to_download = root_folder_path / FilePath(file_path)
    if file_to_download.is_file():
        return FileResponse(file_to_download)
    else:
        return {"error": "File not found"}
