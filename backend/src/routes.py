"""FastAPI routes for the essential filesystem operations.

Endpoint shape (owned by this pack -- no pre-existing contract to match):
  GET    /fs?path=<relative path>          list a folder's content
  GET    /fs/parent?path=<relative path>   list the parent folder's content
  POST   /fs/folders                       create a new folder
  PATCH  /fs                               rename a file or folder
  DELETE /fs?path=<relative path>          delete a file or folder
  POST   /fs/copy                          copy a file or folder to another folder
  POST   /fs/move                          move a file or folder to another folder
  GET    /fs/content?path=<relative path>  read a text file's content
"""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .config import get_root_dir
from .filesystem import (
    AlreadyExistsError,
    FilesystemError,
    FilesystemService,
    NotFoundError,
    NotTextFileError,
)

router = APIRouter(prefix="/fs", tags=["filesystem"])


def get_filesystem_service(root: Path = Depends(get_root_dir)) -> FilesystemService:
    return FilesystemService(root)


class CreateFolderRequest(BaseModel):
    path: str = ""
    name: str


class RenameRequest(BaseModel):
    path: str
    newName: str


class CopyRequest(BaseModel):
    sourcePath: str
    destinationPath: str


class MoveRequest(BaseModel):
    sourcePath: str
    destinationPath: str


@router.get("")
def list_folder(
    path: str = "",
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-010 listing a folder's content (name/type/size/modified)
    # §REQ:FLSY-OPRT-SXK-020 entering a subfolder is the same listing, at its path
    try:
        entries = service.list_dir(path)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FilesystemError as exc:
        # §REQ:FLSY-OPRT-SXK-110 rejects paths that escape the confined root
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": path, "entries": entries}


@router.get("/parent")
def navigate_to_parent(
    path: str = "",
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-030 navigation to the parent folder as the new current position
    try:
        parent = service.parent_path(path)
        entries = service.list_dir(parent)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FilesystemError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": parent, "entries": entries}


@router.post("/folders", status_code=201)
def create_folder(
    body: CreateFolderRequest,
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-040 creation of a new folder, visible in the next listing
    # §REQ:FLSY-OPRT-SXK-050 rejects creation when the name already exists (409)
    try:
        service.create_folder(body.path, body.name)
        entries = service.list_dir(body.path)
    except AlreadyExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FilesystemError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": body.path, "entries": entries}


@router.patch("")
def rename_element(
    body: RenameRequest,
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-060 renaming a file or folder, accessible under the new name only
    try:
        service.rename(body.path, body.newName)
    except AlreadyExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FilesystemError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": body.path, "newName": body.newName}


@router.delete("")
def delete_element(
    path: str = "",
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-070 deleting a file or folder, absent from the parent's next listing
    try:
        service.delete(path)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FilesystemError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": path}


@router.post("/copy", status_code=201)
def copy_element(
    body: CopyRequest,
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-080 copying a file or folder into a destination folder
    try:
        service.copy(body.sourcePath, body.destinationPath)
    except AlreadyExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FilesystemError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"sourcePath": body.sourcePath, "destinationPath": body.destinationPath}


@router.post("/move")
def move_element(
    body: MoveRequest,
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-090 moving a file or folder: present in the
    # destination folder, absent from the source folder afterwards
    try:
        service.move(body.sourcePath, body.destinationPath)
    except AlreadyExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FilesystemError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"sourcePath": body.sourcePath, "destinationPath": body.destinationPath}


@router.get("/content")
def read_content(
    path: str = "",
    service: FilesystemService = Depends(get_filesystem_service),
):
    # §REQ:FLSY-OPRT-SXK-100 viewing a text file's content
    try:
        content = service.read_text(path)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except NotTextFileError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except FilesystemError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": path, "content": content}
