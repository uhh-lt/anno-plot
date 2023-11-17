import logging
import pickle

import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy import and_, exists, not_
from sqlalchemy.orm import Session

from db.models import Embedding, Model, Project, ReducedEmbedding
from db.session import get_db
from project.service import ProjectService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
def get_reduced_embeddings_endpoint(
    project_id: int,
    all: bool = False,
    page: int = 0,
    page_size: int = 100,
    db: Session = Depends(get_db),
):
    reduced_embeddings = []
    project = ProjectService(project_id, db)
    model_entry = project.get_model_entry("reduction_config")
    return_dict = {}
    count = (
        db.query(ReducedEmbedding)
        .filter(ReducedEmbedding.model_id == model_entry.model_id)
        .count()
    )

    if all:
        reduced_embeddings = (
            db.query(ReducedEmbedding)
            .filter(ReducedEmbedding.model_id == model_entry.model_id)
            .all()
        )
    else:
        reduced_embeddings = (
            db.query(ReducedEmbedding)
            .filter(ReducedEmbedding.model_id == model_entry.model_id)
            .offset(page * page_size)
            .limit(page_size)
            .all()
        )
        return_dict.update({"page": page, "page_size": page_size})

    return_dict.update(
        {"length": len(reduced_embeddings), "count": count, "data": reduced_embeddings}
    )

    return return_dict


@router.get("/extract")
def extract_embeddings_reduced_endpoint(project_id: int, db: Session = Depends(get_db)):
    reduced_embeddings = []
    project: ProjectService = ProjectService(project_id, db)

    model_entry, reduction_model = project.get_model("reduction_config")
    embedding_hash = project.get_embedding_hash()
    embedding_model_entry = (
        db.query(Model).filter(Model.model_hash == embedding_hash).first()
    )

    # Main query to find embeddings
    embeddings_todo = (
        db.query(Embedding)
        .join(Model, Model.model_id == Embedding.model_id)
        .join(Project, Project.project_id == Model.project_id)
        .filter(
            and_(
                Project.project_id == project_id,
                Model.model_id == embedding_model_entry.model_id,
            )
        )
        .filter(
            not_(
                exists().where(
                    and_(
                        ReducedEmbedding.embedding_id == Embedding.embedding_id,
                        ReducedEmbedding.model_id == model_entry.model_id,
                    )
                )
            )
        )
        .all()
    )
    if not len(embeddings_todo) == 0:
        embeddings_arrays = np.stack(
            [pickle.loads(embedding.embedding_value) for embedding in embeddings_todo]
        )
        if not reduction_model.fitted:
            reduction_model.fit(embeddings_arrays)
        reduced_embeddings = reduction_model.transform(
            [pickle.loads(embedding.embedding_value) for embedding in embeddings_todo]
        )
        position_mappings = [
            {
                "embedding_id": embedding.embedding_id,
                "model_id": model_entry.model_id,
                "pos_x": float(position_value[0]),
                "pos_y": float(position_value[1]),
            }
            for position_value, embedding in zip(reduced_embeddings, embeddings_todo)
        ]
        db.bulk_insert_mappings(ReducedEmbedding, position_mappings)
        db.commit()
        project.save_model("reduction_config", reduction_model)
        logger.info(f"Extracted {len(embeddings_todo)} reduced embeddings")

    return {"data": len(reduced_embeddings)}
