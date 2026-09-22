"""§REQ:FLSY-OPRT-SXK-080 -- Copia di un file o di una cartella in un'altra posizione.

Given an existing file or folder and a destination folder different from the
source, when the user requests copying the element to the destination
folder, then the element also appears in the destination folder, and the
original element remains unchanged in the source folder.
"""


def test_copy_file_appears_in_destination_and_source_unchanged(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-080
    (fs_root / "notes.txt").write_text("hello")
    (fs_root / "dest").mkdir()

    response = client.post(
        "/fs/copy", json={"sourcePath": "notes.txt", "destinationPath": "dest"}
    )
    assert response.status_code == 201

    assert (fs_root / "dest" / "notes.txt").read_text() == "hello"
    assert (fs_root / "notes.txt").read_text() == "hello"


def test_copy_folder_recursively_appears_in_destination_and_source_unchanged(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-080
    (fs_root / "archive").mkdir()
    (fs_root / "archive" / "inside.txt").write_text("content")
    (fs_root / "dest").mkdir()

    response = client.post(
        "/fs/copy", json={"sourcePath": "archive", "destinationPath": "dest"}
    )
    assert response.status_code == 201

    assert (fs_root / "dest" / "archive" / "inside.txt").read_text() == "content"
    assert (fs_root / "archive" / "inside.txt").read_text() == "content"
