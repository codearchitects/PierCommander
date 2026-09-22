/**
 * One of the two Norton-Commander panels: a titled, focusable region showing the
 * current folder's path, its entries and a cursor on one of them.
 *
 * §REQ:TWO-PNL-NVGT-OOX-010 a panel renders the content of its own current folder.
 * §REQ:TWO-PNL-NVGT-OOX-020 a panel reports whether it is the active one and asks
 * to become active when the user selects it (pointer or keyboard focus).
 * §REQ:TWO-PNL-NVGT-OOX-030 opening a folder entry asks the panel's owner to move
 * THIS panel to that subfolder.
 * §REQ:TWO-PNL-NVGT-OOX-040 the entry under the cursor is the panel's SELECTED
 * item, reported to the owner so the commands can act on it.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { FilesystemClient } from '../api/filesystemClient'
import type { FsEntry } from '../api/types'
import { usePanelFolder } from '../state/usePanelFolder'

export type PanelSide = 'left' | 'right'

export interface PanelProps {
  side: PanelSide
  path: string
  client: FilesystemClient
  isActive: boolean
  onActivate: () => void
  /** §REQ:TWO-PNL-NVGT-OOX-030 the user asked to open a folder entry of this panel. */
  onOpenFolder: (entry: FsEntry) => void
  /** §REQ:TWO-PNL-NVGT-OOX-040 the entry the panel's commands would act on. */
  onSelectionChange?: (entry: FsEntry | null) => void
  /** §REQ:TWO-PNL-NVGT-OOX-040 bumped by the owner after a command changed this folder. */
  reloadToken?: number
}

export function panelLabel(side: PanelSide): string {
  return side === 'left' ? 'Left panel' : 'Right panel'
}

export function displayPath(path: string): string {
  return path === '' ? '/' : `/${path}`
}

export function Panel({
  side,
  path,
  client,
  isActive,
  onActivate,
  onOpenFolder,
  onSelectionChange,
  reloadToken,
}: PanelProps) {
  const folder = usePanelFolder(client, path, reloadToken)
  const label = panelLabel(side)
  const sectionRef = useRef<HTMLElement>(null)
  const [cursor, setCursor] = useState(0)

  // §REQ:TWO-PNL-NVGT-OOX-030 a new folder content starts with the cursor at the top
  useEffect(() => {
    setCursor(0)
  }, [path])

  const entries = folder.entries
  const current = entries[cursor]

  // §REQ:TWO-PNL-NVGT-OOX-040 the owner needs the selected item to run a command on it
  useEffect(() => {
    onSelectionChange?.(current ?? null)
  }, [current, onSelectionChange])

  // §REQ:TWO-PNL-NVGT-OOX-030 only a FOLDER entry changes the panel's current folder
  const open = (entry: FsEntry | undefined) => {
    if (entry && entry.type === 'directory') onOpenFolder(entry)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((index) => Math.min(index + 1, Math.max(entries.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      // §REQ:TWO-PNL-NVGT-OOX-030 Enter opens the entry under the cursor
      event.preventDefault()
      open(current)
    }
  }

  return (
    <section
      ref={sectionRef}
      className={`pc-panel${isActive ? ' pc-panel--active' : ''}`}
      aria-label={label}
      // §REQ:TWO-PNL-NVGT-OOX-020 the selected panel is the one commands act on
      aria-current={isActive}
      tabIndex={0}
      onClick={onActivate}
      onFocus={onActivate}
      onKeyDown={handleKeyDown}
    >
      <header className="pc-panel__header">
        <span className="pc-panel__path" data-testid="panel-path">
          {displayPath(path)}
        </span>
      </header>
      {folder.status === 'error' ? (
        <p role="alert" className="pc-panel__error">
          {folder.error}
        </p>
      ) : (
        <ul
          className="pc-panel__list"
          role="listbox"
          aria-label={`${label} entries`}
          aria-activedescendant={current ? entryId(side, current.name) : undefined}
        >
          {entries.map((entry, index) => (
            <li
              key={entry.name}
              id={entryId(side, entry.name)}
              role="option"
              aria-selected={index === cursor}
              className={`pc-entry pc-entry--${entry.type}${
                index === cursor ? ' pc-entry--cursor' : ''
              }`}
              onClick={() => {
                setCursor(index)
                sectionRef.current?.focus()
              }}
              // §REQ:TWO-PNL-NVGT-OOX-030 double-click opens the entry
              onDoubleClick={() => open(entry)}
            >
              <span className="pc-entry__name">
                {entry.type === 'directory' ? `[${entry.name}]` : entry.name}
              </span>
              <span className="pc-entry__size">
                {entry.type === 'directory' ? '<DIR>' : entry.size}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function entryId(side: PanelSide, name: string): string {
  return `pc-${side}-entry-${encodeURIComponent(name)}`
}
