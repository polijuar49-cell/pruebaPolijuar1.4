from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Secret key for JWT
SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
# Algorithm used for JWT encoding/decoding
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
# Access token expiration in minutes (default 30)
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
# Refresh token expiration in days (default 7)
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
# Database URL (SQLALCHEMY)
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://user:password@localhost/polijuar",
)
