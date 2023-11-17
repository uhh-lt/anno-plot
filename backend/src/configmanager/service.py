import json
import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from configmanager.schemas import ConfigModel
from db.models import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConfigManager:
    def __init__(self, session: Session):
        self.configs = {}
        self.session = session

    def get_all_configs(self):
        configs = self.session.query(Config).all()
        # parse each config.config in json
        for config in configs:
            self.session.expunge(config)
            config.config = json.loads(config.config)

        return configs

    def get_config(self, id):
        config = self.session.query(Config).filter_by(config_id=id).first()
        if config:
            self.session.expunge(config)
            config.config = json.loads(config.config)
            return config
        else:
            raise HTTPException(status_code=404, detail=f"Config '{id}' does not exist.")

    def save_config(self, config):
        self.session.add(config)
        self.session.commit()
        self.session.refresh(config)
        return config

    def update_config(self, id, new_config):
        config = self.session.query(Config).filter_by(config_id=id).first()
        if config:
            config.name = new_config.name
            config.embedding_config = new_config.embedding_config
            config.reduction_config = new_config.reduction_config
            config.cluster_config = new_config.cluster_config
            self.session.commit()
        else:
            raise Exception(f"Config '{id}' not found")

    def delete_config(self, id):
        config = self.session.query(Config).filter_by(config_id=id).first()
        if config:
            self.session.delete(config)
            self.session.commit()
        else:
            raise Exception(f"Config '{id}' not found")

    @staticmethod
    def get_default_model():
        return ConfigModel()
