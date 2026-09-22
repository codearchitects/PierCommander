/**
 * PierCommander shell: two side-by-side filesystem panels, one of them active.
 *
 * §REQ:TWO-PNL-NVGT-OOX-010 loading the page shows two panels, each with the
 * content of its own current folder.
 * §REQ:TWO-PNL-NVGT-OOX-020 selecting a panel makes it the active panel on which
 * subsequent commands act.
 * §REQ:TWO-PNL-NVGT-OOX-030 opening a subfolder moves ONLY that panel.
 * §REQ:TWO-PNL-NVGT-OOX-040 copying the active panel's selected item to the other
 * panel, from an explicit toolbar control.
 * §REQ:TWO-PNL-NVGT-OOX-050 moving it there, from its own toolbar control.
 * §REQ:TWO-PNL-NVGT-OOX-060 deleting it behind an explicit in-app confirmation.
 * §REQ:TWO-PNL-NVGT-OOX-070 creating a new folder in the active panel's folder.
 * §REQ:TWO-PNL-NVGT-OOX-080 renaming the active panel's selected item.
 * §REQ:TWO-PNL-NVGT-OOX-090 previewing the content of a selected text file.
 * §REQ:TWO-PNL-NVGT-OOX-100 starting every one of those commands from the
 * keyboard alone, through the Norton-Commander function keys.
 */
import { useCallback, useState } from 'react'
import { Panel, panelLabel, type PanelSide } from '../components/Panel'
import { childPath } from '../state/paths'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NameDialog } from '../components/NameDialog'
import { PreviewDialog } from '../components/PreviewDialog'
import { FunctionKeyBar } from '../components/FunctionKeyBar'
import { useCommandShortcuts } from '../state/commandShortcuts'
import { usePanelCommands } from '../state/usePanelCommands'
import type { FilesystemClient } from '../api/filesystemClient'
import type { FsEntry } from '../api/types'
import './app.css'

export interface AppProps {
  client: FilesystemClient
  initialLeftPath?: string
  initialRightPath?: string
}

export function App({ client, initialLeftPath = '', initialRightPath = '' }: AppProps) {
  // §REQ:TWO-PNL-NVGT-OOX-010 the two panels keep independent current folders
  const [paths, setPaths] = useState<Record<PanelSide, string>>({
    left: initialLeftPath,
    right: initialRightPath,
  })
  // §REQ:TWO-PNL-NVGT-OOX-020 exactly one side is active at any time
  const [activeSide, setActiveSide] = useState<PanelSide>('left')
  // §REQ:TWO-PNL-NVGT-OOX-040 the item each panel's commands would act on
  const [selection, setSelection] = useState<Record<PanelSide, FsEntry | null>>({
    left: null,
    right: null,
  })
  // §REQ:TWO-PNL-NVGT-OOX-040 bumping a side's token makes that panel re-read its folder
  const [reloadTokens, setReloadTokens] = useState<Record<PanelSide, number>>({
    left: 0,
    right: 0,
  })

  const refresh = useCallback((side: PanelSide) => {
    setReloadTokens((previous) => ({ ...previous, [side]: previous[side] + 1 }))
  }, [])

  const selectLeft = useCallback(
    (entry: FsEntry | null) => setSelection((p) => ({ ...p, left: entry })),
    [],
  )
  const selectRight = useCallback(
    (entry: FsEntry | null) => setSelection((p) => ({ ...p, right: entry })),
    [],
  )

  const commands = usePanelCommands({
    client,
    paths,
    selection,
    activeSide,
    refresh,
  })

  // §REQ:TWO-PNL-NVGT-OOX-100 while a modal dialog is open it owns the keyboard:
  // the dialog IS the started command, and a function key must not start another
  const dialogOpen =
    commands.creatingFolder ||
    commands.pendingRename !== null ||
    commands.pendingDelete !== null ||
    commands.preview !== null

  // §REQ:TWO-PNL-NVGT-OOX-100 the same handlers the toolbar calls, from the keys
  useCommandShortcuts(commands, !dialogOpen)

  const activateLeft = useCallback(() => setActiveSide('left'), [])
  const activateRight = useCallback(() => setActiveSide('right'), [])

  // §REQ:TWO-PNL-NVGT-OOX-030 the opened subfolder replaces that panel's current
  // folder — the other panel's state is left untouched
  const openFolder = useCallback((side: PanelSide, entry: FsEntry) => {
    setPaths((previous) => ({
      ...previous,
      [side]: childPath(previous[side], entry.name),
    }))
  }, [])

  const openLeft = useCallback(
    (entry: FsEntry) => openFolder('left', entry),
    [openFolder],
  )
  const openRight = useCallback(
    (entry: FsEntry) => openFolder('right', entry),
    [openFolder],
  )

  return (
    <main className="pc-app" aria-label="PierCommander">
      <div className="pc-panels">
        <Panel
          side="left"
          path={paths.left}
          client={client}
          isActive={activeSide === 'left'}
          onActivate={activateLeft}
          onOpenFolder={openLeft}
          onSelectionChange={selectLeft}
          reloadToken={reloadTokens.left}
        />
        <Panel
          side="right"
          path={paths.right}
          client={client}
          isActive={activeSide === 'right'}
          onActivate={activateRight}
          onOpenFolder={openRight}
          onSelectionChange={selectRight}
          reloadToken={reloadTokens.right}
        />
      </div>
      {/* §REQ:TWO-PNL-NVGT-OOX-040 explicit controls for the panel commands */}
      <div className="pc-toolbar" role="toolbar" aria-label="Panel commands">
        {/* §REQ:TWO-PNL-NVGT-OOX-090 */}
        <button type="button" onClick={() => void commands.viewSelection()}>
          View
        </button>
        <button type="button" onClick={() => void commands.copySelection()}>
          Copy to other panel
        </button>
        {/* §REQ:TWO-PNL-NVGT-OOX-050 */}
        <button type="button" onClick={() => void commands.moveSelection()}>
          Move to other panel
        </button>
        {/* §REQ:TWO-PNL-NVGT-OOX-060 starting the command only asks the question */}
        <button type="button" onClick={commands.requestDelete}>
          Delete
        </button>
        {/* §REQ:TWO-PNL-NVGT-OOX-070 */}
        <button type="button" onClick={commands.requestCreateFolder}>
          New folder
        </button>
        {/* §REQ:TWO-PNL-NVGT-OOX-080 starting the command only asks for the new name */}
        <button type="button" onClick={commands.requestRename}>
          Rename
        </button>
      </div>
      {/* §REQ:TWO-PNL-NVGT-OOX-070 the name is asked for before anything is created */}
      {commands.creatingFolder ? (
        <NameDialog
          label="New folder"
          fieldLabel="Folder name"
          submitLabel="Create"
          onSubmit={(name) => void commands.submitCreateFolder(name)}
          onCancel={commands.cancelCreateFolder}
        />
      ) : null}
      {/* §REQ:TWO-PNL-NVGT-OOX-100 the keys and the commands they start */}
      <FunctionKeyBar />
      {/* §REQ:TWO-PNL-NVGT-OOX-090 the content is shown in the application itself */}
      {commands.preview ? (
        <PreviewDialog
          name={commands.preview.name}
          content={commands.preview.content}
          onClose={commands.closePreview}
        />
      ) : null}
      {/* §REQ:TWO-PNL-NVGT-OOX-080 the new name is asked for before anything is renamed */}
      {commands.pendingRename ? (
        <NameDialog
          label="Rename"
          fieldLabel="New name"
          submitLabel="Rename"
          initialValue={commands.pendingRename.name}
          onSubmit={(name) => void commands.submitRename(name)}
          onCancel={commands.cancelRename}
        />
      ) : null}
      {/* §REQ:TWO-PNL-NVGT-OOX-060 the confirmation is part of the application UI */}
      {commands.pendingDelete ? (
        <ConfirmDialog
          label="Confirm deletion"
          question={`Delete "${commands.pendingDelete.name}"? This cannot be undone.`}
          confirmLabel="Yes, delete"
          onConfirm={() => void commands.confirmDelete()}
          onCancel={commands.cancelDelete}
        />
      ) : null}
      {commands.error ? (
        <p role="alert" className="pc-error">
          {commands.error}
        </p>
      ) : null}
      {/* §REQ:TWO-PNL-NVGT-OOX-020 the active panel is stated, not merely implied */}
      <p className="pc-status" role="status" aria-label="Active panel">
        {panelLabel(activeSide)}
      </p>
    </main>
  )
}
