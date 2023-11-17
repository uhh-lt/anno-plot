from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy import and_
from sqlalchemy.orm import Session, aliased

from clusters.router import extract_clusters_endpoint
from dataset.router import upload_dataset
from db.models import (
    Cluster,
    Code,
    Dataset,
    Embedding,
    Model,
    Project,
    ReducedEmbedding,
    Segment,
    Sentence,
)
from db.session import get_db
from embeddings.router import extract_embeddings_endpoint
from plot.file_operations import extract_plot
from plot.schemas import PlotTable
from project.router import create_project_route
from project.service import ProjectService
from reduced_embeddings.router import extract_embeddings_reduced_endpoint
from utilities.locks import db_lock

# TODO: dont use the router, move stuff to services
router = APIRouter()


@router.get("/")
async def get_plot_endpoint(
    project_id: int,
    all: bool = False,
    page: int = 0,
    page_size: int = 100,
    db: Session = Depends(get_db),
) -> PlotTable:
    async with db_lock:
        extract_embeddings_endpoint(project_id, db=db)
        extract_embeddings_reduced_endpoint(project_id, db=db)
        extract_clusters_endpoint(project_id, db=db)
        db.commit()
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
    count = query.count()
    response: PlotTable = {}
    if all:
        plots = query.all()
    else:
        plots = query.offset(page * page_size).limit(page_size).all()
        response.update({"page": page, "page_size": page_size})
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
    response.update({"data": result_dicts, "length": len(result_dicts), "count": count})

    return response


@router.get("/test/")
async def setup_test_environment(db: Session = Depends(get_db)):
    file_os = open("dataset/examples/few_nerd_reduced.txt", "rb")

    file = UploadFile(file_os)
    project = create_project_route(project_name="Test", db=db)
    project_id = project.data.project_id
    await upload_dataset(project_id, dataset_name="few_nerd_reduced", file=file, db=db)
    extract_embeddings_endpoint(project_id, db=db)
    extract_embeddings_reduced_endpoint(project_id, db=db)
    extract_clusters_endpoint(project_id, db=db)
    return {"message": "Test environment setup successfully", "project_id": project_id}


@router.get("/sentence/")
def search_sentence_route(
    project_id: int,
    search_query: str,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> PlotTable:
    """Search for sentences in a project"""
    plots = []
    ProjectAlias = aliased(Project)
    SentenceAlias = aliased(Sentence)
    SegmentAlias = aliased(Segment)
    DatasetAlias = aliased(Dataset)
    ReducedEmbeddingAlias = aliased(ReducedEmbedding)
    EmbeddingAlias = aliased(Embedding)
    CodeAlias = aliased(Code)
    ClusterAlias = aliased(Cluster)

    datasets = db.query(DatasetAlias).filter(DatasetAlias.project_id == project_id).all()
    dataset_ids = [dataset.dataset_id for dataset in datasets]
    query = (
        db.query(
            ClusterAlias,
            ReducedEmbeddingAlias,
            EmbeddingAlias,
            SegmentAlias,
            SentenceAlias,
            CodeAlias,
            ProjectAlias,
        )
        .filter(ProjectAlias.project_id == project_id)
        .filter(SentenceAlias.dataset_id.in_(dataset_ids))
        .where(SentenceAlias.text_tsv.match(search_query, postgresql_regconfig="english"))
        .join(
            ReducedEmbeddingAlias,
            ClusterAlias.reduced_embedding_id
            == ReducedEmbeddingAlias.reduced_embedding_id,
        )
        .join(
            EmbeddingAlias,
            ReducedEmbeddingAlias.embedding_id == EmbeddingAlias.embedding_id,
        )
        .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
        .join(SentenceAlias, SegmentAlias.sentence_id == SentenceAlias.sentence_id)
        .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
        .join(ProjectAlias, CodeAlias.project_id == ProjectAlias.project_id)
        .limit(limit)
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
    return {"data": result_dicts, "length": len(result_dicts), "limit": limit}


@router.get("/code/")
def search_code_route(
    project_id: int, search_code_id: int, limit: int = 100, db: Session = Depends(get_db)
) -> PlotTable:
    """Search for code in a project"""
    plots = []
    ProjectAlias = aliased(Project)
    SentenceAlias = aliased(Sentence)
    SegmentAlias = aliased(Segment)
    DatasetAlias = aliased(Dataset)
    ReducedEmbeddingAlias = aliased(ReducedEmbedding)
    EmbeddingAlias = aliased(Embedding)
    CodeAlias = aliased(Code)
    ClusterAlias = aliased(Cluster)

    datasets = db.query(DatasetAlias).filter(DatasetAlias.project_id == project_id).all()
    dataset_ids = [dataset.dataset_id for dataset in datasets]
    query = (
        db.query(
            ClusterAlias,
            ReducedEmbeddingAlias,
            EmbeddingAlias,
            SegmentAlias,
            SentenceAlias,
            CodeAlias,
            ProjectAlias,
        )
        .filter(ProjectAlias.project_id == project_id)
        .filter(SentenceAlias.dataset_id.in_(dataset_ids))
        .where(CodeAlias.code_id == search_code_id)
        .join(
            ReducedEmbeddingAlias,
            ClusterAlias.reduced_embedding_id
            == ReducedEmbeddingAlias.reduced_embedding_id,
        )
        .join(
            EmbeddingAlias,
            ReducedEmbeddingAlias.embedding_id == EmbeddingAlias.embedding_id,
        )
        .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
        .join(SentenceAlias, SegmentAlias.sentence_id == SentenceAlias.sentence_id)
        .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
        .join(ProjectAlias, CodeAlias.project_id == ProjectAlias.project_id)
        .limit(limit)
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
    return {"data": result_dicts, "length": len(result_dicts), "limit": limit}


@router.get("/cluster/")
def search_clusters_route(
    project_id: int,
    search_cluster_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> PlotTable:
    """Search for clusters in a project"""
    plots = []
    ProjectAlias = aliased(Project)
    SentenceAlias = aliased(Sentence)
    SegmentAlias = aliased(Segment)
    DatasetAlias = aliased(Dataset)
    ReducedEmbeddingAlias = aliased(ReducedEmbedding)
    EmbeddingAlias = aliased(Embedding)
    CodeAlias = aliased(Code)
    ClusterAlias = aliased(Cluster)

    datasets = db.query(DatasetAlias).filter(DatasetAlias.project_id == project_id).all()
    dataset_ids = [dataset.dataset_id for dataset in datasets]
    query = (
        db.query(
            ClusterAlias,
            ReducedEmbeddingAlias,
            EmbeddingAlias,
            SegmentAlias,
            SentenceAlias,
            CodeAlias,
            ProjectAlias,
        )
        .filter(ProjectAlias.project_id == project_id)
        .filter(SentenceAlias.dataset_id.in_(dataset_ids))
        .where(search_cluster_id == ClusterAlias.cluster)
        .join(
            ReducedEmbeddingAlias,
            ClusterAlias.reduced_embedding_id
            == ReducedEmbeddingAlias.reduced_embedding_id,
        )
        .join(
            EmbeddingAlias,
            ReducedEmbeddingAlias.embedding_id == EmbeddingAlias.embedding_id,
        )
        .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
        .join(SentenceAlias, SegmentAlias.sentence_id == SentenceAlias.sentence_id)
        .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
        .join(ProjectAlias, CodeAlias.project_id == ProjectAlias.project_id)
        .limit(limit)
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
    return {"data": result_dicts, "length": len(result_dicts), "limit": limit}


@router.get("/code/{code_id}/search")
def search_code_segments_route(
    project_id: int,
    code_id: int,
    search_segment_query: str,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> PlotTable:
    """Search for segments text in a code"""
    plots = []
    ProjectAlias = aliased(Project)
    SentenceAlias = aliased(Sentence)
    SegmentAlias = aliased(Segment)
    DatasetAlias = aliased(Dataset)
    ReducedEmbeddingAlias = aliased(ReducedEmbedding)
    EmbeddingAlias = aliased(Embedding)
    CodeAlias = aliased(Code)
    ClusterAlias = aliased(Cluster)

    datasets = db.query(DatasetAlias).filter(DatasetAlias.project_id == project_id).all()
    dataset_ids = [dataset.dataset_id for dataset in datasets]
    query = (
        db.query(
            ClusterAlias,
            ReducedEmbeddingAlias,
            EmbeddingAlias,
            SegmentAlias,
            SentenceAlias,
            CodeAlias,
            ProjectAlias,
        )
        .filter(ProjectAlias.project_id == project_id)
        .filter(SentenceAlias.dataset_id.in_(dataset_ids))
        .where(CodeAlias.code_id == code_id)
        .where(
            SegmentAlias.text_tsv.match(
                search_segment_query, postgresql_regconfig="english"
            )
        )
        .join(
            ReducedEmbeddingAlias,
            ClusterAlias.reduced_embedding_id
            == ReducedEmbeddingAlias.reduced_embedding_id,
        )
        .join(
            EmbeddingAlias,
            ReducedEmbeddingAlias.embedding_id == EmbeddingAlias.embedding_id,
        )
        .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
        .join(SentenceAlias, SegmentAlias.sentence_id == SentenceAlias.sentence_id)
        .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
        .join(ProjectAlias, CodeAlias.project_id == ProjectAlias.project_id)
        .limit(limit)
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
    return {"data": result_dicts, "length": len(result_dicts), "limit": limit}


@router.get("/segment")
def search_segment_route(
    project_id: int,
    search_segment_query: str,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> PlotTable:
    """Search for segments in a project"""
    plots = []
    ProjectAlias = aliased(Project)
    SentenceAlias = aliased(Sentence)
    SegmentAlias = aliased(Segment)
    DatasetAlias = aliased(Dataset)
    ReducedEmbeddingAlias = aliased(ReducedEmbedding)
    EmbeddingAlias = aliased(Embedding)
    CodeAlias = aliased(Code)
    ClusterAlias = aliased(Cluster)

    datasets = db.query(DatasetAlias).filter(DatasetAlias.project_id == project_id).all()
    dataset_ids = [dataset.dataset_id for dataset in datasets]
    search_segment_query = (
        db.query(
            ClusterAlias,
            ReducedEmbeddingAlias,
            EmbeddingAlias,
            SegmentAlias,
            SentenceAlias,
            CodeAlias,
            ProjectAlias,
        )
        .filter(ProjectAlias.project_id == project_id)
        .filter(SentenceAlias.dataset_id.in_(dataset_ids))
        .where(
            SegmentAlias.text_tsv.match(
                search_segment_query, postgresql_regconfig="english"
            )
        )
        .join(
            ReducedEmbeddingAlias,
            ClusterAlias.reduced_embedding_id
            == ReducedEmbeddingAlias.reduced_embedding_id,
        )
        .join(
            EmbeddingAlias,
            ReducedEmbeddingAlias.embedding_id == EmbeddingAlias.embedding_id,
        )
        .join(SegmentAlias, EmbeddingAlias.segment_id == SegmentAlias.segment_id)
        .join(SentenceAlias, SegmentAlias.sentence_id == SentenceAlias.sentence_id)
        .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
        .join(ProjectAlias, CodeAlias.project_id == ProjectAlias.project_id)
        .limit(limit)
    )

    plots = search_segment_query.all()
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
    return {"data": result_dicts, "length": len(result_dicts), "limit": limit}


@router.get("/exportToFiles/")
async def export_plot_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
):
    """Extract plot data to files"""
    plots = await get_plot_endpoint(project_id=project_id, all=True, db=db)
    extract_plot(project_id=project_id, plots=plots["data"])
    return {"message": "Plot data extracted successfully"}


@router.get("/stats/project/")
async def project_endpoint(project_id: int, db: Session = Depends(get_db)):
    """Get project statistics"""
    async with db_lock:
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if project:
            dataset_count = len(project.datasets)
            code_count = len(project.codes)
            model_count = len(project.models)
            sentence_count = (
                db.query(Sentence)
                .join(Dataset)
                .filter(Dataset.project_id == project_id)
                .count()
            )
            segment_count = (
                db.query(Segment)
                .join(Sentence)
                .join(Dataset)
                .filter(Dataset.project_id == project_id)
                .count()
            )
            embedding_count = (
                db.query(Embedding)
                .join(Segment)
                .join(Sentence)
                .join(Dataset)
                .filter(Dataset.project_id == project_id)
                .count()
            )

            result = {
                "project_id": project.project_id,
                "project_name": project.project_name,
                "dataset_count": dataset_count,
                "code_count": code_count,
                "model_count": model_count,
                "sentence_count": sentence_count,
                "segment_count": segment_count,
                "embedding_count": embedding_count,
            }

            return result

        else:
            return {"error": f"Project with ID {project_id} not found."}


@router.get("/stats/code/")
async def stats_endpoint(project_id: int, db: Session = Depends(get_db)):
    """Get code statistics for a project"""
    async with db_lock:
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if project:
            project_service: ProjectService = ProjectService(project_id, db)
            model_entry = project_service.get_model_entry("cluster_config")
            # Count codes with segments
            code_segments_count = {}
            if project.codes:
                code_segments_count["codes"] = []
                for code in project.codes:
                    ProjectAlias = aliased(Project)
                    SentenceAlias = aliased(Sentence)
                    SegmentAlias = aliased(Segment)
                    ReducedEmbeddingAlias = aliased(ReducedEmbedding)
                    EmbeddingAlias = aliased(Embedding)
                    CodeAlias = aliased(Code)
                    if model_entry is None:
                        continue
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
                        .filter(
                            and_(
                                ProjectAlias.project_id == project_id,
                                CodeAlias.code_id == code.code_id,
                            )
                        )
                        .filter(Cluster.model_id == model_entry.model_id)
                        .join(
                            ReducedEmbeddingAlias,
                            Cluster.reduced_embedding_id
                            == ReducedEmbeddingAlias.reduced_embedding_id,
                        )
                        .join(
                            EmbeddingAlias,
                            ReducedEmbeddingAlias.embedding_id
                            == EmbeddingAlias.embedding_id,
                        )
                        .join(
                            SegmentAlias,
                            EmbeddingAlias.segment_id == SegmentAlias.segment_id,
                        )
                        .join(
                            SentenceAlias,
                            SegmentAlias.sentence_id == SentenceAlias.sentence_id,
                        )
                        .join(CodeAlias, SegmentAlias.code_id == CodeAlias.code_id)
                        .join(
                            ProjectAlias, CodeAlias.project_id == ProjectAlias.project_id
                        )
                    )
                    positions = query.all()
                    sum_x = 0
                    sum_y = 0
                    for position in positions:
                        sum_x += position[1].pos_x
                        sum_y += position[1].pos_y
                    segments_count = len(code.segments)
                    code_segments_count["codes"].append(
                        {
                            "code_id": code.code_id,
                            "text": code.text,
                            "segment_count": segments_count,
                            "average_position": {
                                "x": sum_x / segments_count if segments_count != 0 else 0,
                                "y": sum_y / segments_count if segments_count != 0 else 0,
                            },
                        }
                    )

            result = {
                "code_segments_count": code_segments_count,
            }

            return result

        else:
            return {"error": f"Project with ID {project_id} not found."}


@router.get("/stats/cluster/")
async def cluster_endpoint(project_id: int, db: Session = Depends(get_db)):
    """Get cluster statistics for a project"""
    async with db_lock:
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if project:
            clusters = (
                db.query(Cluster)
                .join(ReducedEmbedding)
                .join(Embedding)
                .join(Segment)
                .join(Sentence)
                .join(Dataset)
                .filter(Dataset.project_id == project_id)
                .all()
            )

            cluster_count = len(clusters)
            unique_clusters = set()
            cluster_segments_count = {}

            for cluster in clusters:
                cluster_value = cluster.cluster
                if cluster_value is not None:
                    unique_clusters.add(cluster_value)
                    if cluster_value not in cluster_segments_count:
                        cluster_segments_count[cluster_value] = 1
                    else:
                        cluster_segments_count[cluster_value] += 1

            unique_cluster_count = len(unique_clusters)

            # Convert cluster_segments_count to a list of dictionaries for JSON response
            cluster_info = [
                {"cluster_value": cluster_value, "segment_count": segment_count}
                for cluster_value, segment_count in cluster_segments_count.items()
            ]

            return {
                "project_name": project.project_name,
                "project_id": project.project_id,
                "cluster_count": cluster_count,
                "unique_cluster_count": unique_cluster_count,
                "cluster_info": cluster_info,
            }
        else:
            return {"error": f"Project with ID {project_id} not found."}


@router.get("/recalculate/")
async def recalculate_databases(project_id: int, db: Session = Depends(get_db)):
    """Recalculate all databases for a project"""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    project_service = ProjectService(project_id, db)
    cluster_model = project_service.get_model_entry("cluster_config")
    reduction_model = project_service.get_model_entry("reduction_config")

    if project:
        # Delete all clusters
        db.query(Cluster).filter(Cluster.model_id == cluster_model.model_id).delete()
        # Delete all reduced embeddings
        db.query(ReducedEmbedding).filter(
            ReducedEmbedding.model_id == reduction_model.model_id
        ).delete()
        # Delete models
        db.query(Model).filter(Model.model_id == cluster_model.model_id).delete()
        db.query(Model).filter(Model.model_id == reduction_model.model_id).delete()

        # Commit changes
        db.commit()

        # project_service.delete_model(cluster_model.model_hash)
        project_service.delete_model(reduction_model.model_hash)

        async with db_lock:
            extract_embeddings_endpoint(project_id, db=db)
            extract_embeddings_reduced_endpoint(project_id, db=db)
            extract_clusters_endpoint(project_id, db=db)
            db.commit()

        return {"message": "Databases recalculated successfully"}
    else:
        return {"error": f"Project with ID {project_id} not found."}


@router.get("/segment/{segment_id}")
async def get_segment_plot(
    project_id: int, segment_id: int, db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if project:
        segment = db.query(Segment).filter(Segment.segment_id == segment_id).first()
        if segment:
            return {"segment_id": segment.segment_id, "code_id": segment.code_id}


@router.put("/segment/{segment_id}")
async def update_segment_plot(
    project_id: int, segment_id: int, code_id: int, db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if project:
        segment = db.query(Segment).filter(Segment.segment_id == segment_id).first()
        if segment:
            segment.code_id = code_id
            db.add(segment)
            db.commit()
            db.refresh(segment)
            return {"message": "Segment plot updated successfully"}


@router.delete("/segment/{segment_id}")
async def delete_segment_plot(
    project_id: int, segment_id: int, db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if project:
        segment = db.query(Segment).filter(Segment.segment_id == segment_id).first()
        if segment:
            db.delete(segment)
            db.commit()
            return {"message": "Segment plot deleted successfully"}
