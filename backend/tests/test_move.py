"""§REQ:FLSY-OPRT-SXK-090 -- Spostamento di un file o di una cartella in un'altra posizione.

Given an existing file or folder and a destination folder different from the
source, when the user requests moving the element to the destination folder,
then the element appears in the destination folder, and the element no
longer appears in the source folder.
"""


def test_move_file_appears_in_destination_and_gone_from_source(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-090
    (fs_root / "notes.txt").write_text("hello")
    (fs_root / "dest").mkdir()

    response = client.post(
        "/fs/move", json={"sourcePath": "notes.txt", "destinationPath": "dest"}
    )
    assert response.status_code == 200

    assert (fs_root / "dest" / "notes.txt").read_text() == "hello"
    assert not (fs_root / "notes.txt").exists()


def test_move_folder_appears_in_destination_and_gone_from_source(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-090
    (fs_root / "archive").mkdir()
    (fs_root / "archive" / "inside.txt").write_text("content")
    (fs_root / "dest").mkdir()

    response = client.post(
        "/fs/move", json={"sourcePath": "archive", "destinationPath": "dest"}
    )
    assert response.status_code == 200

    assert (fs_root / "dest" / "archive" / "inside.txt").read_text() == "content"
    assert not (fs_root / "archive").exists()
