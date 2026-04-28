"""
database.py
Configuración de la conexión a MySQL con SQLAlchemy.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

# --- Cadena de conexión -------------------------------------------------------
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "polijuar_db")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    "?charset=utf8mb4"
)

# --- Engine y sesión ----------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # verifica la conexión antes de usarla
    pool_recycle=3600,        # recicla conexiones cada hora
    echo=False,               # cambiar a True para ver SQL en consola (debug)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- Base declarativa ---------------------------------------------------------
class Base(DeclarativeBase):
    pass


# --- Dependencia para FastAPI (inyección de sesión) ---------------------------
def get_db():
    """Genera una sesión de BD por request y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
