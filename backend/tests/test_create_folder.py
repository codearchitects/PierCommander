"""§REQ:FLSY-OPRT-SXK-040 -- Creazione di una nuova cartella.

Given a filesystem folder and a name not yet existing inside it, when the
user requests creation of a new folder with that name, then the new folder
is created inside the given folder, and it appears in the next listing of
that folder's content.
"""


def test_create_folder_is_created_and_appears_in_next_listing(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-040
    response = client.post("/fs/folders", json={"path": "", "name": "archive"})
    assert response.status_code == 201

    assert (fs_root / "archive").is_dir()

    listing = client.get("/fs", params={"path": ""})
    names = [e["name"] for e in listing.json()["entries"]]
    assert "archive" in names
