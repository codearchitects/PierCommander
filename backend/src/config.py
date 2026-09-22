"""Configuration for the filesystem service.

The confined root directory is NEVER hardcoded: it is read from the
FS_ROOT environment variable (falling back to a local ./data directory
for convenience during manual runs). Keeping the root a configurable
setting -- rather than a constant baked into the service -- is what
lets a later requirement (root confinement / traversal protection) add
its checks without reshaping this module.
"""
from __future__ import annotations

import os
from pathlib import Path


def get_root_dir() -> Path:
    """Resolve (and ensure) the configured filesystem root.

    A FastAPI dependency so tests can override it per-request via
    ``app.dependency_overrides`` without touching process environment.
    """
    root = os.environ.get("FS_ROOT", "./data")
    path = Path(root).resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path
