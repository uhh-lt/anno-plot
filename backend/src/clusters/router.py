import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy import and_, exists, not_
from sqlalchemy.orm import Session, aliased

from db.models import (Cluster, Code, Embedding, Model, Project,
                       ReducedEmbedding, Segment, Sentence)
from db.session import get_db
from project.service import ProjectService

router = APIRouter()


@router.get("/extract")
def extract_clusters_endpoint(
    project_id: int,
    all: bool = False,
    page: int = 0,
    page_size: int = 100,
    return_data: bool = False,
    db: Session = Depends(get_db),
):
    """Extract clusters from reduced embeddings"""
    clusters = []
    project: ProjectService = ProjectService(project_id, db)
    model_entry, cluster_model = project.get_model("cluster_config")
    reduction_hash = project.get_reduction_hash()
    reduction_model_entry = (
        db.query(Model).filter(Model.model_hash == reduction_hash).first()
    )

    # get reduced embeddings without clusters
    reduced_embeddings_todo = (
        db.query(ReducedEmbedding)
        .join(Model, Model.model_id == ReducedEmbedding.model_id)
        .join(Project, Project.project_id == Model.project_id)
        .filter(
            and_(
                Project.project_id == project_id,
                Model.model_id == reduction_model_entry.model_id,
            )
        )
        .filter(
            not_(
                exists().where(
                    and_(
                        Cluster.reduced_embedding_id
                        == ReducedEmbedding.reduced_embedding_id,
                        Cluster.model_id == model_entry.model_id,
                    )
                )
            )
        )
        .all()
    )

    if not len(reduced_embeddings_todo) == 0:
        # extract clusters and save to db
        reduced_embeddings_arrays = np.stack(
            [
                np.array([reduced_embedding.pos_x, reduced_embedding.pos_y])
                for reduced_embedding in reduced_embeddings_todo
            ]
        )
        clusters = cluster_model.transform(reduced_embeddings_arrays)
        cluster_mappings = [
            {
                "reduced_embedding_id": reduced_embedding.reduced_embedding_id,
                "model_id": model_entry.model_id,
                "cluster": int(cluster),
            }
            for cluster, reduced_embedding in zip(clusters, reduced_embeddings_todo)
        ]

        db.bulk_insert_mappings(Cluster, cluster_mappings)
        db.commit()

    return_dict = {"extracted": len(reduced_embeddings_todo)}
    if return_data:
        if all:
            clusters = (
                db.query(Cluster).filter(Cluster.model_id == model_entry.model_id).all()
            )
        else:
            clusters = (
                db.query(Cluster)
                .filter(Cluster.model_id == model_entry.model_id)
                .offset(page * page_size)
                .limit(page_size)
                .all()
            )
            return_dict.update({"page": page, "page_size": page_size})
        return_dict.update({"length": len(clusters), "data": clusters})

    return return_dict


@router.get("/")
def get_clusters_endpoint(
    project_id: int,
    all: bool = False,
    page: int = 0,
    page_size: int = 100,
    db: Session = Depends(get_db),
):
    """Get clusters"""
    clusters = []
    project = ProjectService(project_id, db)
    model_entry = project.get_model_entry("cluster_config")
    return_dict = {}
    count = db.query(Cluster).filter(Cluster.model_id == model_entry.model_id).count()

    if all:
        clusters = (
            db.query(Cluster).filter(Cluster.model_id == model_entry.model_id).all()
        )
    else:
        clusters = (
            db.query(Cluster)
            .filter(Cluster.model_id == model_entry.model_id)
            .offset(page * page_size)
            .limit(page_size)
            .all()
        )
        return_dict.update({"page": page, "page_size": page_size})

    return_dict.update({"length": len(clusters), "count": count, "data": clusters})

    return return_dict


@router.get("/errors")
def get_error_endpoint(
    project_id: int,
    max_count: int = 20,
    cutoff: float = 0.7,
    db: Session = Depends(get_db),
):
    """Get clusters with mismatched primary codes"""
    plots = []

    ReducedEmbeddingAlias = aliased(ReducedEmbedding)
    EmbeddingAlias = aliased(Embedding)
    SegmentAlias = aliased(Segment)
    SentenceAlias = aliased(Sentence)
    CodeAlias = aliased(Code)
    ProjectAlias = aliased(Project)

    # get config id from project id
    project: ProjectService = ProjectService(project_id, db)
    model_entry = project.get_model_entry("cluster_config")

    query = (
        db.query(
            Cluster,
            ReducedEmbeddingAlias,
            EmbeddingAlias,
            SegmentAlias,
            SentenceAlias,
            CodeAlias,
            ProjectAlias,
        )
        .filter(ProjectAlias.project_id == project_id)
        .filter(Cluster.model_id == model_entry.model_id)
        .join(
            ReducedEmbeddingAlias,
            Cluster.reduced_embedding_id == ReducedEmbeddingAlias.reduced_embedding_id,
        )
        .join(
            EmbeddingAlias,
            ReducedEmbeddingAlias.embedding_id == EmbeddingAlias.embedding_id,
        )
        .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
        .join(SentenceAlias, SegmentAlias.sentence_id == SentenceAlias.sentence_id)
        .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
        .join(ProjectAlias, CodeAlias.project_id == ProjectAlias.project_id)
    )
    plots = query.all()
    result_dicts = [
        {
            "id": row[3].segment_id,
            "sentence": row[4].text,
            "segment": row[3].text,
            "code": row[5].code_id,
            "reduced_embedding": {"x": row[1].pos_x, "y": row[1].pos_y},
            "cluster": row[0].cluster,
        }
        for row in plots
    ]
    pandas_df = pd.DataFrame(result_dicts)

    labels = pandas_df.groupby("cluster")["code"].value_counts()

    primary_codes = {}
    for cluster, code_counts in labels.groupby(level=0):
        if cluster == -1:
            continue

        total = code_counts.sum()
        primary_code, primary_code_count = code_counts.idxmax(), code_counts.max()
        if primary_code_count / total > cutoff:
            primary_codes[primary_code[0]] = primary_code[1]

    mismatched_ids = []
    for cluster, primary_code in primary_codes.items():
        mismatched_ids.extend(
            pandas_df[
                (pandas_df["cluster"] == cluster) & (pandas_df["code"] != primary_code)
            ]["id"].tolist()
        )

    return {"data": mismatched_ids[:max_count]}
