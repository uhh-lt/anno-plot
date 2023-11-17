from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from configmanager.router import create_config, get_config
from db.models import Project
from db.schema import DeleteResponse
from db.session import get_db
from project.schema import ProjectData, ProjectEntry, ProjectsData
from project.service import ProjectService

router = APIRouter()


@router.post("/")
def create_project_route(project_name: str, db: Session = Depends(get_db)) -> ProjectData:
    new_project = Project(project_name=project_name)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    created_config = create_config(db=db)
    set_project_config_route(new_project.project_id, created_config.config_id, db=db)
    return ProjectData(
        data=ProjectEntry(
            project_name=new_project.project_name,
            project_id=new_project.project_id,
            config_id=new_project.config_id,
        )
    )


@router.get("/")
def get_projects_route(db: Session = Depends(get_db)) -> ProjectsData:
    projects = db.query(Project).all()

    return ProjectsData(
        data=[
            ProjectEntry(
                project_name=project.project_name,
                project_id=project.project_id,
                config_id=project.config_id,
            )
            for project in projects
        ],
        length=len(projects),
    )


@router.get("/{project_id}/")
def get_project_route(project_id: int, db: Session = Depends(get_db)) -> ProjectData:
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=404, detail=f"Project '{project_id}' does not exist."
        )
    return ProjectData(
        data=ProjectEntry(
            project_name=project.project_name,
            project_id=project.project_id,
            config_id=project.config_id,
        )
    )


@router.put("/{project_id}/")
def update_project_route(
    project_id: int, project_name: str, db: Session = Depends(get_db)
) -> ProjectData:
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=404, detail=f"Project '{project_id}' does not exist."
        )
    project.project_name = project_name
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectData(
        data=ProjectEntry(
            project_name=project.project_name,
            project_id=project.project_id,
            config_id=project.config_id,
        )
    )


@router.delete("/{project_id}/", response_model=DeleteResponse)
def delete_projects_route(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return {"id": project_id, "deleted": False}
    db.delete(project)
    db.commit()
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if project:
        return {"id": project_id, "deleted": False}
    return {"id": project_id, "deleted": True}


@router.put("/{project_id}/config/{config_id}/")
def set_project_config_route(
    project_id: int, config_id: int, db: Session = Depends(get_db)
) -> ProjectData:
    config = get_config(config_id, db=db)
    project = ProjectService(project_id, db).set_project_config(config.config_id)
    return ProjectData(
        data=ProjectEntry(
            project_name=project.project_name,
            project_id=project.project_id,
            config_id=project.config_id,
        )
    )


@router.get("/project/{project_id}")
def get_project_config(project_id: int, db: Session = Depends(get_db)):
    config = ProjectService(project_id, db).get_project_config()
    if config:
        return config
    else:
        raise HTTPException(
            status_code=404, detail=f"Config for project '{project_id}' does not exist."
        )
