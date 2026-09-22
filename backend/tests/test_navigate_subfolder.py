"""§REQ:FLSY-OPRT-SXK-020 -- Navigazione in una sottocartella.

Given a folder containing a subfolder, when the user requests to enter the
subfolder, then the API returns the subfolder's content as the new current
position.
"""


def test_entering_subfolder_returns_its_own_content(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-020
    sub = fs_root / "documents"
    sub.mkdir()
    (sub / "report.pdf").write_text("pdf-bytes")

    response = client.get("/fs", params={"path": "documents"})

    assert response.status_code == 200
    body = response.json()
    assert body["path"] == "documents"
    names = [e["name"] for e in body["entries"]]
    assert names == ["report.pdf"]
