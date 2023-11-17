"""
This module defines a FastAPI APIRouter for managing codes in a project.
It includes routes for retrieving, creating, updating, merging and deleting codes.
"""

from typing import Optional
import requests
import sqlalchemy
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from codes.schemas import MergeOperation
from codes.service import build_category_tree, has_circular_dependency
from db import models, session

router = APIRouter()

# Route to get all codes for a specific project
@router.get("/")
def get_codes_route(project_id: int, db: Session = Depends(session.get_db)):
    codes = db.query(models.Code).filter(models.Code.project_id == project_id).all()
    if codes is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return {"data": codes}

# Route to get top-level codes for a specific project
@router.get("/roots")
def get_top_level_codes_route(project_id: int, db: Session = Depends(session.get_db)):
    codes = (
        db.query(models.Code)
        .filter(models.Code.project_id == project_id, models.Code.parent_code_id == None)
        .all()
    )
    if codes is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return {"data": codes}

# Route to get leaf codes (codes without children) for a specific project
@router.get("/leaves")
def get_leaf_codes_route(project_id: int, db: Session = Depends(session.get_db)):
    subquery = (
        db.query(models.Code.parent_code_id)
        .filter(models.Code.project_id == project_id)
        .distinct()
    )
    subquery_result = subquery.all()
    code_ids = [item[0] for item in subquery_result if item[0] is not None]
    codes = (
        db.query(models.Code)
        .filter(models.Code.project_id == project_id, ~models.Code.code_id.in_(code_ids))
        .all()
    )
    if codes is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return {"codes": codes}

# Route to get the hierarchical tree structure of codes for a specific project
@router.get("/tree")
def get_code_tree(project_id: int, db: Session = Depends(session.get_db)):
    codes = db.query(models.Code).filter(models.Code.project_id == project_id).all()
    codes = build_category_tree(codes)
    if codes is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return {"codes": codes}


# Route to get a specific code by its id
@router.get("/{id}")
def get_code_route(project_id: int, id: int, db: Session = Depends(session.get_db)):
    data = (
        db.query(models.Code)
        .filter(models.Code.project_id == project_id, models.Code.code_id == id)
        .first()
    )
    if data is None:
        raise HTTPException(status_code=404, detail="Code not found")

    return data

# Route to delete a code by its id
@router.delete("/{id}")
def delete_code_route(project_id: int, id: int, db: Session = Depends(session.get_db)):
    try:
        code = db.query(models.Code).filter(models.Code.code_id == id).first()
        if code:
            db.delete(code)
            db.commit()
            return {"id": id, "deleted": True}
        else:
            return {"id": id, "deleted": False}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Route to insert a new code
@router.post("/")
def insert_code_route(
    project_id: int,
    code_name: str,
    parent_id: Optional[int] = None,
    db: Session = Depends(session.get_db),
):
    try:
        new_code = models.Code(
            parent_code_id=parent_id, project_id=project_id, text=code_name
        )
        db.add(new_code)
        db.commit()
        db.refresh(new_code)
        return new_code
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Foreign key constraint violation.")

# Route to update an existing code
@router.put("/{id}")
def update_code_route(
    project_id: int,
    code_id: int,
    code_name: Optional[str] = None,
    parent_id: Optional[int] = None,
    db: Session = Depends(session.get_db),
):
    try:
        data = (
            db.query(models.Code)
            .filter(models.Code.project_id == project_id, models.Code.code_id == code_id)
            .first()
        )
        if data is None:
            raise HTTPException(status_code=404, detail="Code not found")
        if code_name:
            data.text = code_name
        if parent_id:
            if has_circular_dependency(db, project_id, code_id, parent_id):
                codes_to_update = (
                    db.query(models.Code)
                    .filter(
                        models.Code.project_id == project_id,
                        models.Code.parent_code_id == code_id,
                    )
                    .all()
                )
                for code in codes_to_update:
                    code.parent_code_id = None
            data.parent_code_id = parent_id
        db.add(data)
        db.commit()
        db.refresh(data)
        return data
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Foreign key constraint violation.")

# Route to merge multiple codes into a new code
@router.post("/merge")
def merge_codes_route(
    project_id: int, data: MergeOperation, db: Session = Depends(session.get_db)
):
    try:
        url = f"http://localhost:5500/projects/{project_id}/codes/?code_name={data.new_code_name}"
        new_code_response = requests.post(url)

        new_code_id = new_code_response.json().get("code_id")

        db.query(models.Code).filter(
            models.Code.project_id == project_id,
            models.Code.parent_code_id.in_(data.list_of_codes),
        ).update({models.Code.parent_code_id: new_code_id}, synchronize_session=False)
        db.commit()

        db.query(models.Segment).filter(
            models.Segment.code_id.in_(data.list_of_codes)
        ).update({models.Segment.code_id: new_code_id}, synchronize_session=False)
        db.commit()

        for code_id in data.list_of_codes:
            url = f"http://localhost:5500/projects/{project_id}/codes/{code_id}/"
            response = requests.delete(url)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"HTTP Request error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

    return {"codes": data.list_of_codes, "merged": True, "new_code": new_code_id}
