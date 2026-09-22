"""§REQ:FLSY-OPRT-SXK-010 -- Elenco del contenuto di una cartella.

Given a filesystem folder containing files and subfolders, when the user
requests the listing of that folder's content, then the API returns name,
type, size and last-modified date of every contained element.
"""


def test_list_folder_returns_name_type_size_modified_for_every_element(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-010
    (fs_root / "notes.txt").write_text("hello")
    (fs_root / "photos").mkdir()

    response = client.get("/fs", params={"path": ""})

    assert response.status_code == 200
    body = response.json()
    names = {e["name"]: e for e in body["entries"]}

    assert set(names.keys()) == {"notes.txt", "photos"}

    file_entry = names["notes.txt"]
    assert file_entry["type"] == "file"
    assert file_entry["size"] == 5
    assert "modified" in file_entry and file_entry["modified"]

    dir_entry = names["photos"]
    assert dir_entry["type"] == "directory"
    assert "modified" in dir_entry and dir_entry["modified"]
