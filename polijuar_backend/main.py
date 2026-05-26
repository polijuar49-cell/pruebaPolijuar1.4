# Re-export the FastAPI app from the original backend directory
import os, sys
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'polijuar-backend'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Import the app defined in the original main.py
from main import app
