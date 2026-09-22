"""§REQ:FLSY-OPRT-SXK-050 -- Rifiuto della creazione di una cartella con nome già esistente.

Given a folder already containing an element with a certain name, when the
user requests creating a new folder with the same name, then the API rejects
the operation, and the folder's content stays unchanged.
"""


def test_create_folder_rejects_existing_name_and_keeps_content_unchanged(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-050
    (fs_root / "archive").mkdir()
    (fs_root / "archive" / "marker.txt").write_text("original content")

    before = client.get("/fs", params={"path": ""}).json()["entries"]

    response = client.post("/fs/folders", json={"path": "", "name": "archive"})
    assert response.status_code == 409

    after = client.get("/fs", params={"path": ""}).json()["entries"]
    assert before == after
    assert (fs_root / "archive" / "marker.txt").read_text() == "original content"
