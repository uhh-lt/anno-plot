import logging
import pickle

from fastapi import APIRouter, Depends
from sqlalchemy import and_, exists, not_
from sqlalchemy.orm import Session

from db.models import Dataset, Embedding, Project, Segment, Sentence
from db.schema import DeleteResponse
from db.session import get_db
from project.service import ProjectService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
def get_embeddings_endpoint(
    project_id: int,
    all: bool = False,
    page: int = 0,
    page_size: int = 100,
    reduce_length: int = 3,
    db: Session = Depends(get_db),
):
    return_dict = {"reduced_length": reduce_length}
    embeddings = []
    project = ProjectService(project_id, db)
    model_entry = project.get_model_entry("embedding_config")
    count = db.query(Embedding).filter(Embedding.model_id == model_entry.model_id).count()

    if all:
        embeddings = (
            db.query(Embedding).filter(Embedding.model_id == model_entry.model_id).all()
        )
    else:
        embeddings = (
            db.query(Embedding)
            .filter(Embedding.model_id == model_entry.model_id)
            .offset(page * page_size)
            .limit(page_size)
            .all()
        )
        return_dict.update({"page": page, "page_size": page_size})

    result = limit_embeddings_length(
        [
            {
                "id": embedding.embedding_id,
                "embedding": pickle.loads(embedding.embedding_value).tolist(),
            }
            for embedding in embeddings
        ],
        reduce_length,
    )
    return_dict.update({"length": len(result), "count": count, "data": result})

    return return_dict


@router.get("/extract")
def extract_embeddings_endpoint(
    project_id: int = None,
    db: Session = Depends(get_db),
    batch_size: int = 124,
    use_disk_storage: bool = False,
):
    logger.info(f"Extracting embeddings: Project {project_id}")
    embeddings = []
    project = ProjectService(project_id, db)
    model_entry, embedding_model = project.get_model("embedding_config")
    subquery = exists().where(
        and_(
            Embedding.segment_id == Segment.segment_id,
            Embedding.model_id == model_entry.model_id,
        )
    )

    segments_and_sentences = (
        db.query(Segment, Sentence)
        .join(Sentence, Sentence.sentence_id == Segment.sentence_id)
        .join(Dataset, Dataset.dataset_id == Sentence.dataset_id)
        .join(Project, Project.project_id == Dataset.project_id)
        .filter(Project.project_id == project_id)
        .filter(not_(subquery))
        .all()
    )

    if not len(segments_and_sentences) == 0:
        segments, sentences = zip(*segments_and_sentences)
        embeddings = embedding_model.transform(
            segments,
            sentences,
            batch_size=batch_size,
            use_disk_storage=use_disk_storage,
        )

        ## saving

        embedding_mappings = [
            {
                "segment_id": segment.segment_id,
                "model_id": model_entry.model_id,
                "embedding_value": pickle.dumps(embedding_value),
            }
            for embedding_value, segment in zip(embeddings, segments)
        ]

        # Bulk insert embeddings

        db.bulk_insert_mappings(Embedding, embedding_mappings)
        db.commit()
        project.save_model("embedding_config", embedding_model)

    return {"data": len(embeddings)}


def limit_embeddings_length(embeddings, reduce_length):
    embeddings = [
        {"id": embedding["id"], "embedding": embedding["embedding"][:reduce_length]}
        for embedding in embeddings
    ]

    return embeddings
