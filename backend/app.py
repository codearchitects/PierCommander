"""Top-level ASGI entrypoint: `uvicorn app:api` from backend/.

Assembles the FastAPI instance from the `src` package -- the actual
application code lives there, this module only wires it up so the
declared run command resolves.
"""
from fastapi import FastAPI

from src.routes import router as filesystem_router

api = FastAPI(title="FilesystemApi")
api.include_router(filesystem_router)
