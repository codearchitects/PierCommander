import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Make the top-level `app` module (backend/app.py) and `src` package importable
# when pytest is invoked from backend/ with `python3 -m pytest`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import api  # noqa: E402
from src.config import get_root_dir  # noqa: E402


@pytest.fixture
def fs_root(tmp_path):
    """A temp directory used as the confined filesystem root for a test."""
    return tmp_path


@pytest.fixture
def client(fs_root):
    api.dependency_overrides[get_root_dir] = lambda: fs_root
    with TestClient(api) as test_client:
        yield test_client
    api.dependency_overrides.pop(get_root_dir, None)
