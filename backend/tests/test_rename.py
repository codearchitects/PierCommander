"""§REQ:FLSY-OPRT-SXK-060 -- Rinomina di un file o di una cartella.

Given an existing file or folder and a new name with no conflict, when the
user requests renaming the element with the new name, then the element is
accessible under the new name, and it is no longer accessible under the
previous name.
"""


def test_rename_file_is_accessible_under_new_name_only(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-060
    (fs_root / "notes.txt").write_text("hello")

    response = client.patch("/fs", json={"path": "notes.txt", "newName": "renamed.txt"})
    assert response.status_code == 200

    assert (fs_root / "renamed.txt").is_file()
    assert not (fs_root / "notes.txt").exists()

    listing = client.get("/fs", params={"path": ""}).json()["entries"]
    names = [e["name"] for e in listing]
    assert "renamed.txt" in names
    assert "notes.txt" not in names


def test_rename_folder_is_accessible_under_new_name_only(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-060
    (fs_root / "archive").mkdir()

    response = client.patch("/fs", json={"path": "archive", "newName": "old-archive"})
    assert response.status_code == 200

    assert (fs_root / "old-archive").is_dir()
    assert not (fs_root / "archive").exists()
