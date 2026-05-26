import os, sys
# Add the project root to PYTHONPATH so that tests can import polijuar_backend package
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
