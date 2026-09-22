/**
 * Loading state of ONE panel's current folder.
 *
 * §REQ:TWO-PNL-NVGT-OOX-010 each panel holds its own current folder and its own
 * content, independently of the other panel.
 * §REQ:TWO-PNL-NVGT-OOX-040 a panel re-reads its folder when a command changed it
 * (`reloadToken` bumps).
 */
import { useEffect, useState } from 'react'
import type { FilesystemClient } from '../api/filesystemClient'
import type { FsEntry } from '../api/types'

export type PanelStatus = 'loading' | 'ready' | 'error'

export interface PanelFolder {
  status: PanelStatus
  entries: FsEntry[]
  error: string | null
}

export function usePanelFolder(
  client: FilesystemClient,
  path: string,
  /** §REQ:TWO-PNL-NVGT-OOX-040 bumped by the owner to force a refresh. */
  reloadToken = 0,
): PanelFolder {
  const [state, setState] = useState<PanelFolder>({
    status: 'loading',
    entries: [],
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', entries: [], error: null })
    client
      .listFolder(path)
      .then((listing) => {
        // §REQ:TWO-PNL-NVGT-OOX-010 the panel shows the content of ITS current folder
        if (!cancelled) {
          setState({ status: 'ready', entries: listing.entries, error: null })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            entries: [],
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [client, path, reloadToken])

  return state
}
