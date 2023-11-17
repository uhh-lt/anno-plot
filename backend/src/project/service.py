import json
import logging
import os
import pickle

from fastapi import HTTPException
from sqlalchemy.orm import Session

from db.models import Config, Model, Project
from models.model_definitions import MODELS
from utilities.string_operations import generate_hash, get_file_path

logger = logging.getLogger(__name__)


class ProjectService:
    def __init__(self, project_id: int, db: Session):
        self.project_id = project_id
        self.db = db

    def get_project(self):
        if self.project_id is None:
            raise HTTPException(status_code=400, detail="No project id provided")
        try:
            project = (
                self.db.query(Project)
                .filter(Project.project_id == self.project_id)
                .first()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"{str(e)}")
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return project

    def get_project_config(self):
        project = self.get_project()
        config = self.db.query(Config).filter_by(config_id=project.config_id).first()
        return json.loads(config.config)

    def set_project_config(self, config_id):
        project = self.get_project()
        project.config_id = config_id
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def get_embedding_hash(self):
        config = self.get_project_config()
        model_hash = generate_hash(
            {"project_id": self.project_id, "model": config["embedding_config"]}
        )
        model_name = config["embedding_config"]["model_name"]
        return f"embedding_{model_name}_" + model_hash

    def get_reduction_hash(self):
        config = self.get_project_config()
        model_hash = generate_hash(
            {
                "project_id": self.project_id,
                "model": {
                    "embedding_model": config["embedding_config"],
                    "reduction_model": config["reduction_config"],
                },
            }
        )
        model_name = config["reduction_config"]["model_name"]
        return f"reduction_{model_name}_" + model_hash

    def get_cluster_hash(self):
        config = self.get_project_config()
        model_hash = generate_hash(
            {
                "project_id": self.project_id,
                "model": {
                    "embedding_model": config["embedding_config"],
                    "reduction_model": config["reduction_config"],
                    "cluster_model": config["cluster_config"],
                },
            }
        )
        model_name = config["cluster_config"]["model_name"]
        return f"cluster_{model_name}_" + model_hash

    def get_model_hash(self, model_type):
        if model_type == "embedding_config":
            model_hash = self.get_embedding_hash()
        elif model_type == "reduction_config":
            model_hash = self.get_reduction_hash()
        elif model_type == "cluster_config":
            model_hash = self.get_cluster_hash()
        return model_hash

    def get_model_entry(self, model_type):
        model_hash = self.get_model_hash(model_type)
        model_entry = self.db.query(Model).filter(Model.model_hash == model_hash).first()
        return model_entry

    def get_model(self, model_type):
        config = self.get_project_config()
        model_hash = self.get_model_hash(model_type)
        model_entry = self.db.query(Model).filter(Model.model_hash == model_hash).first()
        model_name = config[model_type]["model_name"]
        model_path = get_file_path(self.project_id, "models", f"{model_hash}.pkl")
        if not os.path.exists(model_path):
            model = MODELS[model_name](config[model_type]["args"])
            logger.info(f"Created new model for project {self.project_id}/{model_hash}")
        else:
            with open(model_path, "rb") as f:
                model = pickle.load(f)
            logger.info(f"Loaded model from file {model_path}")
        if model_entry is None:
            model_entry = Model(project_id=self.project_id, model_hash=model_hash)
            self.db.add(model_entry)
            self.db.commit()
            self.db.refresh(model_entry)

        return model_entry, model

    def save_model(self, model_type, model):
        model_hash = self.get_model_hash(model_type)
        model_path = get_file_path(self.project_id, "models", f"{model_hash}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(model, f)
        logger.info(f"Saved model to file {model_path}")

    def delete_model(self, model_name):
        model_path = get_file_path(self.project_id, "models", f"{model_name}.pkl")
        os.remove(model_path)
        logger.info(f"Deleted model from file {model_path}")
