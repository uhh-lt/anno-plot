import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from configmanager.schemas import ConfigModel
from configmanager.service import ConfigManager
from db.models import Config  # Import the Config model
# Create a ConfigManager instance with a database session
from db.session import get_db

router = APIRouter()


@router.post("/")  # , response_model=ConfigModel)
def create_config(
    config: ConfigModel = ConfigModel(), db: Session = Depends(get_db)
):  # = ConfigManager.get_default_model()
    config_manager = ConfigManager(db)

    config_json = json.dumps(config.dict())

    new_config = Config(
        name=config.name, config=config_json
    )  # Store the JSON string in the 'config' column
    db_config = config_manager.save_config(new_config)
    db.expunge(db_config)
    db_config.config = json.loads(db_config.config)
    return db_config


@router.get("/")
def get_all_configs(db: Session = Depends(get_db)):
    config_manager = ConfigManager(db)

    configs = config_manager.get_all_configs()
    return configs


@router.get("/{id}")
def get_config(id: int, db: Session = Depends(get_db)):
    config_manager = ConfigManager(db)

    config = config_manager.get_config(id)
    if config:
        return config
    else:
        raise HTTPException(status_code=404, detail=f"Config '{id}' does not exist.")


@router.put("/{id}")
def update_config(
    id: int, config: ConfigModel = ConfigModel(), db: Session = Depends(get_db)
):
    config_manager = ConfigManager(db)

    existing_config = config_manager.get_config(id)
    if existing_config:
        config_json = json.dumps(config.dict())

        existing_config.name = config.name
        existing_config.config = config_json  # Update the 'config' JSON string

        existing_config.embedding_config = config.embedding_config
        existing_config.reduction_config = config.reduction_config
        existing_config.cluster_config = config.cluster_config
        existing_config.default_limit = config.default_limit

        config_manager.save_config(existing_config)

        return {"message": f"Config '{id}' updated successfully."}
    else:
        raise HTTPException(status_code=404, detail=f"Config '{id}' not found.")


@router.delete("/{id}")
def delete_config(id: int, db: Session = Depends(get_db)):
    config_manager = ConfigManager(db)

    config_manager.delete_config(id)
    return {"message": f"Config '{id}' deleted successfully."}
