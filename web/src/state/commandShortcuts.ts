/**
 * The Norton-Commander function keys, declared ONCE so the handler that runs a
 * command and the bar that advertises it can never drift apart.
 *
 * §REQ:TWO-PNL-NVGT-OOX-100 each essential command has a keyboard shortcut that
 * starts exactly the same command its toolbar button starts — F3 view, F5 copy,
 * F6 move, Shift+F6 rename, F7 create folder, F8 delete.
 */
import { useEffect } from 'react'
import type { PanelCommands } from './usePanelCommands'

export interface CommandShortcut {
  /** How the key is written in the function-key bar. */
  hint: string
  /** The command's name, as the toolbar button names it. */
  label: string
  /** `KeyboardEvent.key` of the function key. */
  key: string
  /** Whether Shift must be held — Shift+F6 is the Commander's rename. */
  shift: boolean
  /** §REQ:TWO-PNL-NVGT-OOX-100 START the command; never a different code path. */
  run: (commands: PanelCommands) => void
}

export const commandShortcuts: CommandShortcut[] = [
  // §REQ:TWO-PNL-NVGT-OOX-090 the view command, §REQ:TWO-PNL-NVGT-OOX-100 from F3
  { hint: 'F3', label: 'View', key: 'F3', shift: false, run: (c) => void c.viewSelection() },
  // §REQ:TWO-PNL-NVGT-OOX-040 the copy command, §REQ:TWO-PNL-NVGT-OOX-100 from F5
  { hint: 'F5', label: 'Copy', key: 'F5', shift: false, run: (c) => void c.copySelection() },
  // §REQ:TWO-PNL-NVGT-OOX-050 the move command, §REQ:TWO-PNL-NVGT-OOX-100 from F6
  { hint: 'F6', label: 'Move', key: 'F6', shift: false, run: (c) => void c.moveSelection() },
  // §REQ:TWO-PNL-NVGT-OOX-080 the rename command, §REQ:TWO-PNL-NVGT-OOX-100 from Shift+F6
  { hint: 'Shift+F6', label: 'Rename', key: 'F6', shift: true, run: (c) => c.requestRename() },
  // §REQ:TWO-PNL-NVGT-OOX-070 the create-folder command, §REQ:TWO-PNL-NVGT-OOX-100 from F7
  {
    hint: 'F7',
    label: 'New folder',
    key: 'F7',
    shift: false,
    run: (c) => c.requestCreateFolder(),
  },
  // §REQ:TWO-PNL-NVGT-OOX-060 the delete command — F8 only ASKS, as the button does
  { hint: 'F8', label: 'Delete', key: 'F8', shift: false, run: (c) => c.requestDelete() },
]

/** §REQ:TWO-PNL-NVGT-OOX-100 the shortcut a key press stands for, if any. */
export function findShortcut(event: {
  key: string
  shiftKey: boolean
}): CommandShortcut | undefined {
  return commandShortcuts.find(
    (shortcut) => shortcut.key === event.key && shortcut.shift === event.shiftKey,
  )
}

/**
 * §REQ:TWO-PNL-NVGT-OOX-100 the shortcuts listen on the whole document, so the
 * command is reachable without the mouse from wherever the focus sits — but only
 * while `enabled`: a modal dialog owns the keyboard and no shortcut fires under it.
 *
 * The commands themselves read the ACTIVE panel's selection, so a shortcut acts on
 * the active panel exactly as the toolbar button does. Only the function keys are
 * intercepted, leaving the panels' own ArrowUp/ArrowDown/Enter handling untouched.
 */
export function useCommandShortcuts(commands: PanelCommands, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = findShortcut(event)
      if (!shortcut) return
      // §REQ:TWO-PNL-NVGT-OOX-100 the browser's own F-key behaviour must not win
      event.preventDefault()
      shortcut.run(commands)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [commands, enabled])
}
