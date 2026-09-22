"""Filesystem operations service, confined to a configured root directory.

This module owns the pure filesystem logic (listing, path resolution,
folder creation); the FastAPI routes in ``src.routes`` are a thin HTTP
layer on top of it. Root confinement / traversal protection (a later
requirement, SXK-110) will tighten ``_resolve`` without needing to
reshape this class -- the root is already a constructor parameter,
never a hardcoded path.
"""
from __future__ import annotations

import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath


class FilesystemError(Exception):
    """Raised for any filesystem-service-level failure (client-facing)."""


class NotFoundError(FilesystemError):
    pass


class AlreadyExistsError(FilesystemError):
    pass


class PathOutsideRootError(FilesystemError):
    """Raised when a resolved path would escape the configured root
    (§REQ:FLSY-OPRT-SXK-110)."""


class NotTextFileError(FilesystemError):
    """Raised when a file's content cannot be decoded as UTF-8 text
    (§REQ:FLSY-OPRT-SXK-100)."""


@dataclass
class Entry:
    name: str
    type: str  # "file" | "directory"
    size: int
    modified: str  # ISO-8601 UTC timestamp

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "type": self.type,
            "size": self.size,
            "modified": self.modified,
        }


class FilesystemService:
    def __init__(self, root: Path):
        self.root = Path(root).resolve()

    def _resolve(self, relative_path: str) -> Path:
        """Resolve a path to an absolute path beneath the configured root.

        Accepts either a root-relative POSIX-style path ("" == root) or an
        absolute path, but §REQ:FLSY-OPRT-SXK-110 requires every operation
        that goes through here to stay confined to ``self.root``: any
        candidate that resolves outside of it (via ".." traversal or an
        absolute path escaping the root) is rejected.
        """
        relative_path = (relative_path or "").strip("/")
        candidate = (self.root / relative_path).resolve() if relative_path else self.root

        # §REQ:FLSY-OPRT-SXK-110
        if candidate != self.root and self.root not in candidate.parents:
            raise PathOutsideRootError(
                f"Path escapes the filesystem root: {relative_path!r}"
            )
        return candidate

    # §REQ:FLSY-OPRT-SXK-010 §REQ:FLSY-OPRT-SXK-020
    def list_dir(self, relative_path: str = "") -> list[dict]:
        """List the content (files and subfolders) of a folder, returning
        each element's name, type, size and last-modified date."""
        target = self._resolve(relative_path)
        if not target.exists() or not target.is_dir():
            raise NotFoundError(f"Folder not found: {relative_path!r}")

        entries: list[Entry] = []
        for child in sorted(target.iterdir(), key=lambda p: p.name):
            stat = child.stat()
            entries.append(
                Entry(
                    name=child.name,
                    type="directory" if child.is_dir() else "file",
                    size=0 if child.is_dir() else stat.st_size,
                    modified=datetime.fromtimestamp(
                        stat.st_mtime, tz=timezone.utc
                    ).isoformat(),
                )
            )
        return [e.to_dict() for e in entries]

    # §REQ:FLSY-OPRT-SXK-030
    def parent_path(self, relative_path: str) -> str:
        """Compute the root-relative parent path of ``relative_path``."""
        relative_path = (relative_path or "").strip("/")
        if not relative_path:
            # Already at the root: there is no folder above it.
            raise FilesystemError("Already at the filesystem root")
        parent = str(PurePosixPath(relative_path).parent)
        return "" if parent == "." else parent

    # §REQ:FLSY-OPRT-SXK-040 §REQ:FLSY-OPRT-SXK-050
    def create_folder(self, relative_path: str, name: str) -> None:
        """Create a new folder named ``name`` inside ``relative_path``.

        Rejects the operation (§REQ:FLSY-OPRT-SXK-050) when an element with
        that name already exists in the target folder, leaving the folder's
        content unchanged.
        """
        if not name or "/" in name or name in (".", ".."):
            raise FilesystemError(f"Invalid folder name: {name!r}")

        parent = self._resolve(relative_path)
        if not parent.exists() or not parent.is_dir():
            raise NotFoundError(f"Folder not found: {relative_path!r}")

        new_folder = parent / name
        if new_folder.exists():
            raise AlreadyExistsError(f"{name!r} already exists in {relative_path!r}")

        os.makedirs(new_folder)

    # §REQ:FLSY-OPRT-SXK-060
    def rename(self, relative_path: str, new_name: str) -> None:
        """Rename the file or folder at ``relative_path`` to ``new_name``,
        keeping it in the same parent folder."""
        if not new_name or "/" in new_name or new_name in (".", ".."):
            raise FilesystemError(f"Invalid name: {new_name!r}")

        source = self._resolve(relative_path)
        if not source.exists():
            raise NotFoundError(f"Not found: {relative_path!r}")

        destination = source.parent / new_name
        if destination.exists():
            raise AlreadyExistsError(f"{new_name!r} already exists")

        os.rename(source, destination)

    # §REQ:FLSY-OPRT-SXK-070
    def delete(self, relative_path: str) -> None:
        """Delete the file or folder at ``relative_path``."""
        relative_path = (relative_path or "").strip("/")
        if not relative_path:
            raise FilesystemError("Cannot delete the filesystem root")

        target = self._resolve(relative_path)
        if not target.exists():
            raise NotFoundError(f"Not found: {relative_path!r}")

        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()

    # §REQ:FLSY-OPRT-SXK-080
    def copy(self, source_path: str, destination_path: str) -> None:
        """Copy the file or folder at ``source_path`` into the folder at
        ``destination_path``, keeping the original name."""
        source = self._resolve(source_path)
        if not source.exists():
            raise NotFoundError(f"Not found: {source_path!r}")

        destination_parent = self._resolve(destination_path)
        if not destination_parent.exists() or not destination_parent.is_dir():
            raise NotFoundError(f"Folder not found: {destination_path!r}")

        destination = destination_parent / source.name
        if destination.exists():
            raise AlreadyExistsError(f"{source.name!r} already exists in {destination_path!r}")

        if source.is_dir():
            shutil.copytree(source, destination)
        else:
            shutil.copy2(source, destination)

    # §REQ:FLSY-OPRT-SXK-090
    def move(self, source_path: str, destination_path: str) -> None:
        """Move the file or folder at ``source_path`` into the folder at
        ``destination_path``, keeping the original name. The element no
        longer appears at ``source_path`` afterwards."""
        source = self._resolve(source_path)
        if not source.exists():
            raise NotFoundError(f"Not found: {source_path!r}")

        destination_parent = self._resolve(destination_path)
        if not destination_parent.exists() or not destination_parent.is_dir():
            raise NotFoundError(f"Folder not found: {destination_path!r}")

        destination = destination_parent / source.name
        if destination.exists():
            raise AlreadyExistsError(f"{source.name!r} already exists in {destination_path!r}")

        shutil.move(str(source), str(destination))

    # §REQ:FLSY-OPRT-SXK-100
    def read_text(self, relative_path: str) -> str:
        """Return the textual (UTF-8) content of the file at
        ``relative_path``."""
        target = self._resolve(relative_path)
        if not target.exists() or not target.is_file():
            raise NotFoundError(f"Not found: {relative_path!r}")

        try:
            return target.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            raise NotTextFileError(
                f"Not a UTF-8 text file: {relative_path!r}"
            ) from exc
