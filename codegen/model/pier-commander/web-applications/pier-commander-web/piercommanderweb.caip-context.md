---
c4Id: f6f303a3-7b2f-9935-2132-54e040412e5f
name: PierCommanderWeb
level: container
---

## Wire vocabulary with FilesystemApi — entry type is `directory`, never `folder`

`GET /fs` and `GET /fs/parent` return each entry's `type` as either `"file"` or
**`"directory"`** (the value is produced in `backend/src/filesystem.py`, which maps
`child.is_dir()` to the literal string `"directory"`). The web client's `FsEntryType`
in `web/src/api/types.ts`, and the in-memory test double in `web/src/test/fakeBackend.ts`,
must both use that literal.

This is recorded because it has already cost one repair pass. During the implementation of
the two-panel navigation feature the client was written against `"folder"`, and the test
double encoded the same wrong value — so the whole jsdom suite passed while the real
application could not open a single directory. A test double that mirrors the client's
assumption rather than the server's behaviour cannot detect a contract mismatch; only the
live-stack smoke found it. Whenever a new endpoint is consumed, take the payload shape from
the backend source or from a live response, never from prose describing it.

## Dev-time coupling to the FilesystemApi port

`web/vite.config.ts` proxies `/fs` to `http://127.0.0.1:8000` because FilesystemApi declares
`run: uvicorn app:api` without a port. That address is the one runtime fact binding the two
containers and it currently lives only in a build config the model does not know about. If
the backend's port is ever declared on its container, derive the proxy target from it instead.

## Keyboard command set

The essential commands use the Norton Commander function keys — F3 view, F5 copy, F6 move,
Shift+F6 rename, F7 new folder, F8 delete — chosen because the feature's premise is an
explicit imitation of that interface. Shortcuts are suppressed while a modal dialog is open,
and a shortcut only ever *starts* a command: F8 opens the confirmation rather than deleting.

## Session log

### 2026-09-22T15:17:07.888Z — lo lanciamo ?
- Session: conv-mucselan-92lw#7
- Scope: node
- Provider: claude-cli:opus · mode bypassPermissions · effort medium
- Outcome: ok
