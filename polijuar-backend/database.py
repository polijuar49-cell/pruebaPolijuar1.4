from pathlib import Path
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load environment variables via config
from config import DATABASE_URL

# Engine and session
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    """Yield a database session per request and close it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
