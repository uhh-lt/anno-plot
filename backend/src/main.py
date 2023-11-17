from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from clusters.router import router as clusters_router
from codes.router import router as code_router
from configmanager.router import router as config_router
from dataset.router import router as dataset_router
from db.router import router as db_router
from db.service import init_db
from dynamic.router import router as dynamic_router
from embeddings.router import router as embeddings_router
from plot.router import router as plot_router
from project.router import router as project_router
from reduced_embeddings.router import router as reduced_embeddings_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(db_router, prefix="/databases", tags=["databases"])
app.include_router(project_router, prefix="/projects", tags=["projects"])
app.include_router(
    dataset_router, prefix="/projects/{project_id}/datasets", tags=["datasets"]
)
app.include_router(plot_router, prefix="/projects/{project_id}/plots", tags=["plots"])
app.include_router(code_router, prefix="/projects/{project_id}/codes", tags=["codes"])
app.include_router(
    dynamic_router, prefix="/projects/{project_id}/dynamic", tags=["dynamic"]
)


app.include_router(
    embeddings_router, prefix="/projects/{project_id}/embeddings", tags=["embeddings"]
)
app.include_router(
    reduced_embeddings_router,
    prefix="/projects/{project_id}/reduced_embeddings",
    tags=["reduced_embeddings"],
)
app.include_router(
    clusters_router, prefix="/projects/{project_id}/clusters", tags=["clusters"]
)


app.include_router(config_router, prefix="/configs", tags=["configs"])


@app.get("/")
def read_root():
    return {"status": "online"}


init_db()
