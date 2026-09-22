"""§REQ:FLSY-OPRT-SXK-110 -- Le operazioni sul filesystem restano confinate
alla radice consentita.

Given a filesystem root configured for the user, when the user requests an
operation on a path outside that root, then the API rejects the operation.

Each test targets a path that genuinely resolves outside ``fs_root`` (real
sibling files/dirs the unconfined ``_resolve`` would happily reach) so a
missing containment check would make these operations SUCCEED (200/204)
instead of merely 404-ing on a non-existent target.
"""


def test_list_with_traversal_path_escaping_root_is_rejected(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-110
    outside = fs_root.parent / "outside-list-dir"
    outside.mkdir()
    (outside / "secret.txt").write_text("top secret")

    response = client.get(
        "/fs", params={"path": f"../{outside.name}"}
    )
    assert 400 <= response.status_code < 500


def test_read_content_with_absolute_path_outside_root_is_rejected(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-110
    outside = fs_root.parent / "outside-secret.txt"
    outside.write_text("top secret content")

    response = client.get("/fs/content", params={"path": str(outside)})
    assert 400 <= response.status_code < 500


def test_delete_with_traversal_path_escaping_root_is_rejected(client, fs_root):
    # §REQ:FLSY-OPRT-SXK-110
    outside = fs_root.parent / "outside-delete-me.txt"
    outside.write_text("do not delete me")

    response = client.delete("/fs", params={"path": f"../{outside.name}"})
    assert 400 <= response.status_code < 500
    assert outside.exists()
