import json
import shutil

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import and_, exists, not_
from sqlalchemy.orm import Session

from dataset.schemas import DatasetCreate, DatasetTextOptions
from dataset.service import add_data_to_db, text_to_json
from db import models, session
from db.schema import DeleteResponse

router = APIRouter()


@router.post("/upload")
async def upload_dataset(
    project_id: int,
    dataset_name: str,
    split: str = "\\t",
    sentence_split: str = "\\n\\n",
    word_idx: int = 0,
    label_idx: int = 1,
    label_split: str = "-",
    type: str = "plain",
    file: UploadFile = File(...),
    db: Session = Depends(session.get_db),
):
    # Check if the project exists and belongs to the user
    project = (
        db.query(models.Project).filter(models.Project.project_id == project_id).first()
    )

    options = DatasetTextOptions(
        split=split.encode().decode("unicode_escape"),
        sentence_split=sentence_split.encode().decode("unicode_escape"),
        type=type.encode().decode("unicode_escape"),
        word_idx=word_idx,
        label_idx=label_idx,
        label_split=label_split.encode().decode("unicode_escape"),
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found or you don't have permission to access it.",
        )
    file_content = await file.read()
    file_content = file_content.decode("utf-8")

    # 1. By MIME Type
    if file.filename:
        extension = file.filename.split(".")[-1]
    else:
        extension = "txt"

    if extension == "txt":
        file_type = "PlainText"
        temp_dictionary = text_to_json(file_content, options)
    elif extension == "json":
        file_type = "JSON"
        temp_dictionary = json.loads(file_content)
    else:
        return {"error": "Unsupported file type"}

    add_data_to_db(project_id, dataset_name, temp_dictionary, db)

    return {"filename": file.filename, "content_length": len(file_content)}


@router.get("/")
def get_datasets_route(project_id: int, db: Session = Depends(session.get_db)):
    datasets = (
        db.query(models.Dataset).filter(models.Dataset.project_id == project_id).all()
    )
    return datasets


@router.get("/{dataset_id}/")
def get_dataset_route(
    project_id: int, dataset_id: int, db: Session = Depends(session.get_db)
):
    dataset = (
        db.query(models.Dataset)
        .filter(
            models.Dataset.project_id == project_id
            and models.Dataset.dataset_id == dataset_id
        )
        .first()
    )
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found or you don't have permission to access it.",
        )
    return dataset


@router.put("/{dataset_id}/")
def update_dataset_route(
    project_id: int,
    dataset_id: int,
    dataset_name: str,
    db: Session = Depends(session.get_db),
):
    dataset = (
        db.query(models.Dataset)
        .filter(
            models.Dataset.project_id == project_id
            and models.Dataset.dataset_id == dataset_id
        )
        .first()
    )
    dataset.dataset_name = dataset_name
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.delete("/{dataset_id}/", response_model=DeleteResponse)
def delete_datasets_route(
    project_id: int, dataset_id: int, db: Session = Depends(session.get_db)
):
    dataset = (
        db.query(models.Dataset)
        .filter(
            and_(
                models.Dataset.project_id == project_id,
                models.Dataset.dataset_id == dataset_id,
            )
        )
        .first()
    )
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found or you don't have permission to access it.",
        )
    db.delete(dataset)
    db.commit()
    return {"id": dataset_id, "deleted": True}


@router.get("/{dataset_id}/entries/")
def get_sentences_segments_route(
    project_id: int,
    dataset_id: int,
    page: int = 0,
    page_size: int = 10,
    db: Session = Depends(session.get_db),
):
    # Get sentences with their segments
    dataset = (
        db.query(models.Dataset)
        .filter(
            models.Dataset.project_id == project_id,
            models.Dataset.dataset_id == dataset_id,
        )
        .first()
    )
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found or you don't have permission to access it.",
        )

    # Query for sentences without text_tsv
    sentences = (
        db.query(models.Sentence)
        .filter(
            models.Sentence.dataset_id == dataset_id,
        )
        .offset(page * page_size)
        .limit(page_size)
        .all()
    )

    # Fetch all segments for the selected sentences
    segments = (
        db.query(models.Segment)
        .filter(
            models.Segment.sentence_id.in_(
                [sentence.sentence_id for sentence in sentences]
            )
        )
        .all()
    )

    count = (
        db.query(models.Sentence).filter(models.Sentence.dataset_id == dataset_id).count()
    )

    # Organize the data into a dictionary with sentences and their associated segments
    sentences_dict = {sentence.sentence_id: sentence for sentence in sentences}
    segments_dict = {}
    for segment in segments:
        if segment.sentence_id not in segments_dict:
            segments_dict[segment.sentence_id] = []
        segments_dict[segment.sentence_id].append(segment)

    # Add the segments to the sentences
    for sentence_id, segments in segments_dict.items():
        sentences_dict[sentence_id].segments = segments

    return {
        "length": len(sentences_dict),
        "count": count,
        "data": list(sentences_dict.values()),
    }


@router.delete("/{dataset_id}/sentence/")
def delete_sentence_route(
    project_id: int,
    dataset_id: int,
    sentence_id: int,
    db: Session = Depends(session.get_db),
):
    # Get sentences with their segments
    dataset = (
        db.query(models.Dataset)
        .filter(
            models.Dataset.project_id == project_id,
            models.Dataset.dataset_id == dataset_id,
        )
        .all()
    )
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found or you don't have permission to access it.",
        )

    # Query for sentences with segments
    sentence = (
        db.query(models.Sentence)
        .filter(models.Sentence.sentence_id == sentence_id)
        .first()
    )
    if not sentence:
        raise HTTPException(
            status_code=404,
            detail="Sentence not found or you don't have permission to access it.",
        )

    db.delete(sentence)
    db.commit()

    return {"id": sentence_id, "deleted": True}


@router.put("/{dataset_id}/segment/{segment_id}/")
def update_segment_code(
    project_id: int,
    dataset_id: int,
    segment_id: int,
    code_id: int,
    db: Session = Depends(session.get_db),
):
    # Get sentences with their segments
    dataset = (
        db.query(models.Dataset)
        .filter(
            models.Dataset.project_id == project_id,
            models.Dataset.dataset_id == dataset_id,
        )
        .all()
    )
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found or you don't have permission to access it.",
        )

    # Query for sentences with segments
    segment = (
        db.query(models.Segment).filter(models.Segment.segment_id == segment_id).first()
    )
    if not segment:
        raise HTTPException(
            status_code=404,
            detail="Segment not found or you don't have permission to access it.",
        )

    segment.code_id = code_id
    db.add(segment)
    db.commit()
    db.refresh(segment)

    return segment
