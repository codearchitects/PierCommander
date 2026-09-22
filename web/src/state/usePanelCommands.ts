/**
 * The commands the two panels share, factored away from any particular trigger:
 * the toolbar calls them, and a later keyboard layer can call the very same
 * handlers without restructuring.
 *
 * §REQ:TWO-PNL-NVGT-OOX-040 copy the active panel's selected item into the
 * folder shown in the other panel, then refresh the destination panel.
 * §REQ:TWO-PNL-NVGT-OOX-050 move it there instead, then refresh the source panel.
 * §REQ:TWO-PNL-NVGT-OOX-060 delete it, but only once an explicit confirmation has
 * been requested and granted — the pending confirmation is state, not a callback.
 * §REQ:TWO-PNL-NVGT-OOX-070 create a folder in the folder the active panel shows,
 * after asking the user for its name.
 * §REQ:TWO-PNL-NVGT-OOX-080 rename the active panel's selected item, after asking
 * the user for the new name — the prompt is state, exactly like the others.
 * §REQ:TWO-PNL-NVGT-OOX-090 read the active panel's selected TEXT FILE and hold its
 * content so the shell can show it, until the user closes the preview.
 */
import { useCallback, useState } from 'react'
import type { FilesystemClient } from '../api/filesystemClient'
import type { FsEntry } from '../api/types'
import type { PanelSide } from '../components/Panel'
import { childPath } from './paths'

export type SideMap<T> = Record<PanelSide, T>

export function otherSide(side: PanelSide): PanelSide {
  return side === 'left' ? 'right' : 'left'
}

export interface PanelCommandsOptions {
  client: FilesystemClient
  paths: SideMap<string>
  selection: SideMap<FsEntry | null>
  activeSide: PanelSide
  refresh: (side: PanelSide) => void
}

/** §REQ:TWO-PNL-NVGT-OOX-090 the file currently being previewed. */
export interface FilePreview {
  name: string
  path: string
  content: string
}

/** §REQ:TWO-PNL-NVGT-OOX-080 what a pending rename is about. */
export interface PendingRename {
  side: PanelSide
  name: string
  path: string
}

/** §REQ:TWO-PNL-NVGT-OOX-060 what a pending confirmation is about. */
export interface PendingDelete {
  side: PanelSide
  name: string
  path: string
}

export interface PanelCommands {
  /** §REQ:TWO-PNL-NVGT-OOX-040 copy the selected item to the other panel's folder. */
  copySelection: () => Promise<void>
  /** §REQ:TWO-PNL-NVGT-OOX-050 move the selected item to the other panel's folder. */
  moveSelection: () => Promise<void>
  /** §REQ:TWO-PNL-NVGT-OOX-060 ask for confirmation; issues NOTHING by itself. */
  requestDelete: () => void
  /** §REQ:TWO-PNL-NVGT-OOX-060 the item awaiting confirmation, null when none is. */
  pendingDelete: PendingDelete | null
  /** §REQ:TWO-PNL-NVGT-OOX-060 the user confirmed: delete and refresh the panel. */
  confirmDelete: () => Promise<void>
  /** §REQ:TWO-PNL-NVGT-OOX-060 the user declined: the item stays in place. */
  cancelDelete: () => void
  /** §REQ:TWO-PNL-NVGT-OOX-070 open the name prompt; creates nothing by itself. */
  requestCreateFolder: () => void
  /** §REQ:TWO-PNL-NVGT-OOX-070 true while the name is being asked for. */
  creatingFolder: boolean
  /** §REQ:TWO-PNL-NVGT-OOX-070 create the folder with the name the user gave. */
  submitCreateFolder: (name: string) => Promise<void>
  /** §REQ:TWO-PNL-NVGT-OOX-070 the user declined: nothing is created. */
  cancelCreateFolder: () => void
  /** §REQ:TWO-PNL-NVGT-OOX-080 open the name prompt; renames nothing by itself. */
  requestRename: () => void
  /** §REQ:TWO-PNL-NVGT-OOX-080 the item whose new name is being asked for. */
  pendingRename: PendingRename | null
  /** §REQ:TWO-PNL-NVGT-OOX-080 rename the item to the name the user gave. */
  submitRename: (newName: string) => Promise<void>
  /** §REQ:TWO-PNL-NVGT-OOX-080 the user declined: the item keeps its name. */
  cancelRename: () => void
  /** §REQ:TWO-PNL-NVGT-OOX-090 read the selected text file and open its preview. */
  viewSelection: () => Promise<void>
  /** §REQ:TWO-PNL-NVGT-OOX-090 the file being previewed, null when none is. */
  preview: FilePreview | null
  /** §REQ:TWO-PNL-NVGT-OOX-090 the user closed the preview. */
  closePreview: () => void
  /** Last command failure, in the backend's own words; null when the last command worked. */
  error: string | null
}

export function usePanelCommands({
  client,
  paths,
  selection,
  activeSide,
  refresh,
}: PanelCommandsOptions): PanelCommands {
  const [error, setError] = useState<string | null>(null)
  // §REQ:TWO-PNL-NVGT-OOX-060 a deletion in waiting: the target is captured when the
  // command starts, so a later selection change cannot redirect the confirmed delete
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  // §REQ:TWO-PNL-NVGT-OOX-070 the name prompt is open
  const [creatingFolder, setCreatingFolder] = useState(false)
  // §REQ:TWO-PNL-NVGT-OOX-080 a rename in waiting: the target is captured when the
  // command starts, so a later selection change cannot redirect it
  const [pendingRename, setPendingRename] = useState<PendingRename | null>(null)
  // §REQ:TWO-PNL-NVGT-OOX-090 the content on display, null while nothing is previewed
  const [preview, setPreview] = useState<FilePreview | null>(null)

  const run = useCallback(async (action: () => Promise<void>) => {
    try {
      await action()
      setError(null)
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }, [])

  // §REQ:TWO-PNL-NVGT-OOX-040 source = the active panel's selection; destination =
  // the folder the OTHER panel currently shows
  const copySelection = useCallback(async () => {
    const entry = selection[activeSide]
    if (!entry) return
    const destination = otherSide(activeSide)
    await run(async () => {
      await client.copyEntry(childPath(paths[activeSide], entry.name), paths[destination])
      // §REQ:TWO-PNL-NVGT-OOX-040 the destination panel refreshes its own content
      refresh(destination)
    })
  }, [client, paths, selection, activeSide, refresh, run])

  // §REQ:TWO-PNL-NVGT-OOX-050 same source and destination as the copy, but the
  // item leaves the active panel — so that panel is the one that must refresh
  const moveSelection = useCallback(async () => {
    const entry = selection[activeSide]
    if (!entry) return
    const destination = otherSide(activeSide)
    await run(async () => {
      await client.moveEntry(childPath(paths[activeSide], entry.name), paths[destination])
      // §REQ:TWO-PNL-NVGT-OOX-050 the source panel refreshes its own content
      refresh(activeSide)
      refresh(destination)
    })
  }, [client, paths, selection, activeSide, refresh, run])

  // §REQ:TWO-PNL-NVGT-OOX-060 starting the command only OPENS the question
  const requestDelete = useCallback(() => {
    const entry = selection[activeSide]
    if (!entry) return
    setPendingDelete({
      side: activeSide,
      name: entry.name,
      path: childPath(paths[activeSide], entry.name),
    })
  }, [selection, activeSide, paths])

  // §REQ:TWO-PNL-NVGT-OOX-060 the deletion happens only here, after the confirmation
  const confirmDelete = useCallback(async () => {
    const target = pendingDelete
    if (!target) return
    setPendingDelete(null)
    await run(async () => {
      await client.deleteEntry(target.path)
      refresh(target.side)
    })
  }, [client, pendingDelete, refresh, run])

  // §REQ:TWO-PNL-NVGT-OOX-060 declining issues nothing at all
  const cancelDelete = useCallback(() => setPendingDelete(null), [])

  // §REQ:TWO-PNL-NVGT-OOX-070 starting the command only asks for the name
  const requestCreateFolder = useCallback(() => setCreatingFolder(true), [])
  const cancelCreateFolder = useCallback(() => setCreatingFolder(false), [])

  // §REQ:TWO-PNL-NVGT-OOX-070 the folder is created in the ACTIVE panel's folder,
  // and that panel refreshes so the new folder appears in it
  const submitCreateFolder = useCallback(
    async (name: string) => {
      const side = activeSide
      setCreatingFolder(false)
      await run(async () => {
        await client.createFolder(paths[side], name)
        refresh(side)
      })
    },
    [client, paths, activeSide, refresh, run],
  )

  // §REQ:TWO-PNL-NVGT-OOX-080 starting the command only asks for the new name
  const requestRename = useCallback(() => {
    const entry = selection[activeSide]
    if (!entry) return
    setPendingRename({
      side: activeSide,
      name: entry.name,
      path: childPath(paths[activeSide], entry.name),
    })
  }, [selection, activeSide, paths])

  // §REQ:TWO-PNL-NVGT-OOX-080 the rename happens only here; the panel then refreshes
  // so the item shows under its new name and no longer under the old one
  const submitRename = useCallback(
    async (newName: string) => {
      const target = pendingRename
      if (!target) return
      setPendingRename(null)
      if (newName === target.name) return
      await run(async () => {
        await client.renameEntry(target.path, newName)
        refresh(target.side)
      })
    },
    [client, pendingRename, refresh, run],
  )

  // §REQ:TWO-PNL-NVGT-OOX-080 declining renames nothing at all
  const cancelRename = useCallback(() => setPendingRename(null), [])

  // §REQ:TWO-PNL-NVGT-OOX-090 only a FILE has textual content to show; a folder
  // selection is not a preview, and issues no read at all
  const viewSelection = useCallback(async () => {
    const entry = selection[activeSide]
    if (!entry || entry.type !== 'file') return
    const path = childPath(paths[activeSide], entry.name)
    await run(async () => {
      const read = await client.readContent(path)
      // §REQ:TWO-PNL-NVGT-OOX-090 the content the backend returned is what is shown
      setPreview({ name: entry.name, path, content: read.content })
    })
  }, [client, paths, selection, activeSide, run])

  // §REQ:TWO-PNL-NVGT-OOX-090 closing the preview leaves the file untouched
  const closePreview = useCallback(() => setPreview(null), [])

  return {
    copySelection,
    moveSelection,
    requestDelete,
    pendingDelete,
    confirmDelete,
    cancelDelete,
    requestCreateFolder,
    creatingFolder,
    submitCreateFolder,
    cancelCreateFolder,
    requestRename,
    pendingRename,
    submitRename,
    cancelRename,
    viewSelection,
    preview,
    closePreview,
    error,
  }
}
