"""§REQ:FLSY-OPRT-SXK-100 -- Visualizzazione del contenuto testuale di un file.

Given an existing text file in the filesystem, when the user requests
viewing the file's content, then the API returns the file's textual content.
"""


def test_read_text_file_content(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-100
    (fs_root / "notes.txt").write_text("hello world", encoding="utf-8")

    response = client.get("/fs/content", params={"path": "notes.txt"})
    assert response.status_code == 200
    assert response.json()["content"] == "hello world"


def test_read_content_of_missing_file_is_404(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-100
    response = client.get("/fs/content", params={"path": "missing.txt"})
    assert response.status_code == 404


def test_read_content_of_non_text_file_is_rejected(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-100
    (fs_root / "binary.dat").write_bytes(b"\xff\xfe\x00\x01\x80\x81")

    response = client.get("/fs/content", params={"path": "binary.dat"})
    assert response.status_code in (400, 415)
