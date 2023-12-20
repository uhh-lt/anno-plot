from sqlalchemy import (JSON, Column, Computed, Float, ForeignKey, Integer,
                        LargeBinary, String, Text)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import relationship

from db.base import Base
from sqlalchemy import Index

class Project(Base):
    __tablename__ = "Project"

    project_id = Column(Integer, primary_key=True)
    config_id = Column(Integer, ForeignKey("Config.config_id", ondelete="CASCADE"), index=True)

    project_name = Column(String(255), nullable=False)

    datasets = relationship(
        "Dataset", back_populates="project"#, cascade="all, delete, delete-orphan"
    )
    codes = relationship(
        "Code", back_populates="project"#, cascade="all, delete, delete-orphan"
    )
    # config = relationship("Config", cascade="all, delete, delete-orphan", back_populates="project")
    models = relationship(
        "Model", back_populates="project"#, cascade="all, delete, delete-orphan"
    )


class Dataset(Base):
    __tablename__ = "Dataset"

    dataset_id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("Project.project_id", ondelete="CASCADE"), index=True)

    dataset_name = Column(String(255), nullable=False)

    project = relationship("Project", back_populates="datasets")
    sentences = relationship(
        "Sentence", back_populates="dataset"#, cascade="all, delete, delete-orphan"
    )


class Sentence(Base):
    __tablename__ = "Sentence"

    sentence_id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("Dataset.dataset_id", ondelete="CASCADE"), index=True)

    text = Column(Text, nullable=False)
    text_tsv = Column("sentence_tsv", TSVECTOR, Computed("to_tsvector('english', text)"))
    position_in_dataset = Column(Integer)

    dataset = relationship("Dataset", back_populates="sentences")
    segments = relationship(
        "Segment", back_populates="sentence"#, cascade="all, delete, delete-orphan"
    )


class Segment(Base):
    __tablename__ = "Segment"

    segment_id = Column(Integer, primary_key=True)
    sentence_id = Column(Integer, ForeignKey("Sentence.sentence_id", ondelete="CASCADE"), index=True)

    text = Column(Text, nullable=False)
    text_tsv = Column("sentence_tsv", TSVECTOR, Computed("to_tsvector('english', text)"))
    start_position = Column(Integer, nullable=False)
    code_id = Column(Integer, ForeignKey("Code.code_id", ondelete="CASCADE"), index=True)

    sentence = relationship("Sentence", back_populates="segments")
    embedding = relationship(
        "Embedding", back_populates="segment"#, cascade="all, delete, delete-orphan"
    )
    code = relationship("Code", back_populates="segments")


class Embedding(Base):
    __tablename__ = "Embedding"

    embedding_id = Column(Integer, primary_key=True)
    segment_id = Column(Integer, ForeignKey("Segment.segment_id", ondelete="CASCADE"), index=True)
    model_id = Column(Integer, ForeignKey("Model.model_id"), index=True)

    embedding_value = Column(LargeBinary, nullable=False)

    segment = relationship("Segment", back_populates="embedding")
    reduced_embeddings = relationship(
        "ReducedEmbedding",
        back_populates="embedding"
        #, cascade="all, delete, delete-orphan"
    )
    model = relationship("Model")


class ReducedEmbedding(Base):
    __tablename__ = "ReducedEmbedding"

    reduced_embedding_id = Column(Integer, primary_key=True)
    embedding_id = Column(
        Integer, ForeignKey("Embedding.embedding_id", ondelete="CASCADE"), index=True
    )
    model_id = Column(Integer, ForeignKey("Model.model_id"), index=True)

    pos_x = Column(Float, nullable=False)
    pos_y = Column(Float, nullable=False)

    embedding = relationship("Embedding", back_populates="reduced_embeddings")
    model = relationship("Model")


class Code(Base):
    __tablename__ = "Code"

    code_id = Column(Integer, primary_key=True)
    parent_code_id = Column(Integer, ForeignKey("Code.code_id", ondelete="CASCADE"), index=True)
    project_id = Column(Integer, ForeignKey("Project.project_id", ondelete="CASCADE"), index=True)
    color = Column(String(255), nullable=False)

    text = Column(Text, nullable=False)

    project = relationship("Project", back_populates="codes")
    segments = relationship("Segment", back_populates="code")


class Model(Base):
    __tablename__ = "Model"

    model_id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("Project.project_id", ondelete="CASCADE"))
    model_hash = Column(String(255), nullable=False)

    project = relationship("Project", back_populates="models")


class Cluster(Base):
    __tablename__ = "Cluster"

    cluster_id = Column(Integer, primary_key=True)
    reduced_embedding_id = Column(
        Integer, ForeignKey("ReducedEmbedding.reduced_embedding_id", ondelete="CASCADE"), index=True
    )
    model_id = Column(Integer, ForeignKey("Model.model_id"), index=True)
    cluster = Column("cluster", Integer, index=True)


class Config(Base):
    __tablename__ = "Config"

    config_id = Column(Integer, primary_key=True)
    # project_id = Column(Integer, ForeignKey("Project.project_id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)

    config = Column(JSON, nullable=False)
