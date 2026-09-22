/**
 * Wire shapes of the FilesystemApi container (pure data shapes — no logic).
 * Field names mirror the backend payloads verbatim; nothing here is invented
 * beyond what `GET /fs` already returns.
 */

export type FsEntryType = 'file' | 'directory'

export interface FsEntry {
  name: string
  type: FsEntryType
  size: number
  modified: string
}

/** Payload of `GET /fs?path=<rel>` and `GET /fs/parent?path=<rel>`. */
export interface FolderListing {
  path: string
  entries: FsEntry[]
}

/** Payload of `GET /fs/content?path=<rel>`. */
export interface FileContent {
  path: string
  content: string
}
