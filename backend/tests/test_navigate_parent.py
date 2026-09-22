"""§REQ:FLSY-OPRT-SXK-030 -- Navigazione alla cartella superiore.

Given the user is in a folder different from the allowed filesystem root,
when the user requests to go up to the parent folder, then the API returns
the parent folder's content as the new current position.
"""


def test_navigate_to_parent_returns_parent_content(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-030
    sub = fs_root / "documents"
    sub.mkdir()
    (fs_root / "readme.txt").write_text("root file")

    response = client.get("/fs/parent", params={"path": "documents"})

    assert response.status_code == 200
    body = response.json()
    assert body["path"] == ""
    names = [e["name"] for e in body["entries"]]
    assert "readme.txt" in names
    assert "documents" in names
