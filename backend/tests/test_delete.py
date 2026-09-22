"""§REQ:FLSY-OPRT-SXK-070 -- Cancellazione di un file o di una cartella.

Given an existing file or folder, when the user requests deleting the
element, then the element no longer appears in the listing of the folder
that contained it.
"""


def test_delete_file_removed_from_parent_listing(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-070
    (fs_root / "notes.txt").write_text("hello")

    response = client.delete("/fs", params={"path": "notes.txt"})
    assert response.status_code == 200

    listing = client.get("/fs", params={"path": ""}).json()["entries"]
    names = [e["name"] for e in listing]
    assert "notes.txt" not in names


def test_delete_non_empty_folder_removed_from_parent_listing(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-070
    (fs_root / "archive").mkdir()
    (fs_root / "archive" / "inside.txt").write_text("content")

    response = client.delete("/fs", params={"path": "archive"})
    assert response.status_code == 200

    listing = client.get("/fs", params={"path": ""}).json()["entries"]
    names = [e["name"] for e in listing]
    assert "archive" not in names
