import pickle
from typing import List

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy import and_
from sqlalchemy.orm import Session, aliased

from db.models import Code, Embedding, ReducedEmbedding, Segment
from db.session import get_db
from dynamic.schema import Correction
from dynamic.service import (delete_old_reduced_embeddings,
                             extract_embeddings_reduced, train_clusters,
                             train_points_epochs)
from embeddings.router import extract_embeddings_endpoint
from project.service import ProjectService
from utilities.locks import db_lock
from utilities.timer import Timer

router = APIRouter()
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.post("/cluster")
async def train_for_clusters(
    project_id: int,
    ids: List[int] = None,
    epochs: int = 10,
    db: Session = Depends(get_db),
):
    """Train dynmaic umap model (if selected in configs) to cluster positions based on code label"""
    with Timer("setup"):
        project = ProjectService(project_id, db=db)
        embedding_model = project.get_model_entry("embedding_config")
        extract_embeddings_endpoint(project_id, db=db)
        embeddings = (
            db.query(Embedding)
            .filter(Embedding.model_id == embedding_model.model_id)
            .all()
        )
        # TODO currently only trains dynamic umap
        dyn_red_entry, dyn_red_model = project.get_model("reduction_config")
        if (
            not hasattr(dyn_red_model, "is_dynamic")
            or getattr(dyn_red_model, "is_dynamic") == False
        ):
            raise Exception("Currently only dynamic reduction is supported.")
    # get all embeddings, get all corresponding segment ids and all labels
    # should stay the same
    with Timer("query data"):
        EmbeddingAlias = aliased(Embedding)
        SegmentAlias = aliased(Segment)
        CodeAlias = aliased(Code)
        query = (
            db.query(SegmentAlias, EmbeddingAlias, CodeAlias)
            .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
            .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
            .filter(EmbeddingAlias.model_id == embedding_model.model_id)
        ).all()

    with Timer("create dataframe"):
        training_dicts = [
            {
                "id": segment.segment_id,
                "label": code.code_id,
                "embedding": pickle.loads(embedding.embedding_value),
            }
            for segment, embedding, code in query
        ]

        data = pd.DataFrame(training_dicts)
    for epoch in range(epochs):
        logger.info(f"Training epoch {epoch}")
        new_model = train_clusters(data, dyn_red_model, ids)
        dyn_red_model = new_model
    async with db_lock:
        delete_old_reduced_embeddings(db, dyn_red_entry)
        extract_embeddings_reduced(project, dyn_red_model, db)
        db.commit()

    # delete_old_reduced_embeddings(db, dyn_red_entry)
    # extract_embeddings_reduced(project, dyn_red_model, db)
    return True


@router.post("/correction")
def train_for_correction(
    project_id: int,
    correction: List[Correction] = list(),
    epochs: int = 10,
    db: Session = Depends(get_db),
):
    """Train dynmaic umap model (if selected in configs) to move selected points to their marked positions (from corrections), all other points should move as little as possible"""
    for i, c in enumerate(correction):
        correction[i] = c.dict()
    print(correction)
    with Timer("setup"):
        project = ProjectService(project_id, db=db)
        embedding_model = project.get_model_entry("embedding_config")
        extract_embeddings_endpoint(project_id, db=db)
        embeddings = (
            db.query(Embedding)
            .filter(Embedding.model_id == embedding_model.model_id)
            .all()
        )
        # TODO currently only trains dynamic umap
        dyn_red_entry, dyn_red_model = project.get_model("reduction_config")
        if (
            not hasattr(dyn_red_model, "is_dynamic")
            or getattr(dyn_red_model, "is_dynamic") == False
        ):
            raise Exception("Currently only dynamic reduction is supported.")
    # get all embeddings, get all corresponding segment ids and all labels
    # should stay the same
    with Timer("query data"):
        EmbeddingAlias = aliased(Embedding)
        SegmentAlias = aliased(Segment)
        CodeAlias = aliased(Code)
        query = (
            db.query(SegmentAlias, EmbeddingAlias, CodeAlias)
            .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
            .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
            .filter(EmbeddingAlias.model_id == embedding_model.model_id)
        ).all()

    with Timer("create dataframe"):
        training_dicts = [
            {
                "id": segment.segment_id,
                "label": code.code_id,
                "embedding": pickle.loads(embedding.embedding_value),
            }
            for segment, embedding, code in query
        ]
        data = pd.DataFrame(training_dicts)

    with Timer("train"):
        dyn_red_model = train_points_epochs(data, epochs, dyn_red_model, correction)

        """for epoch in range(epochs):
            logger.info(f"Training epoch {epoch}")
            new_model = train_points(data, dyn_red_model, correction)
            dyn_red_model = new_model
            # recalculate reduced_embeddings and clusters TODO"""

    data_to_replace = (
        db.query(ReducedEmbedding)
        .filter(ReducedEmbedding.model_id == dyn_red_entry.model_id)
        .all()
    )
    delete_old_reduced_embeddings(db, dyn_red_entry)
    extract_embeddings_reduced(project, dyn_red_model, db)
    return True
