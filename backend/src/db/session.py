import json

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from db.base import Base

env = {}
with open("../env.json") as f:
    env = json.load(f)

DATABASE_URL = env["DATABASE_URL"]
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
SessionLocal = scoped_session(sessionmaker(bind=engine))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_engine():
    return engine


def get_session():
    return SessionLocal()
