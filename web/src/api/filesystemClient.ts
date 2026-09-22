/**
 * HTTP client for the FilesystemApi container.
 *
 * The transport is injected (`fetch`), so tests drive the real request/response
 * handling against a double instead of a live backend.
 */
import type { FileContent, FolderListing } from './types'

export interface FilesystemClient {
  /**
   * §REQ:TWO-PNL-NVGT-OOX-010 a panel's current folder content
   * §REQ:TWO-PNL-NVGT-OOX-030 the same listing, at the subfolder's path
   */
  listFolder(path: string): Promise<FolderListing>

  /**
   * §REQ:TWO-PNL-NVGT-OOX-040 copy the item at `sourcePath` INTO the folder
   * `destinationFolderPath` — the path of the destination FOLDER, not of the
   * copied item.
   */
  copyEntry(sourcePath: string, destinationFolderPath: string): Promise<void>

  /**
   * §REQ:TWO-PNL-NVGT-OOX-050 move the item at `sourcePath` INTO the folder
   * `destinationFolderPath`; the source path stops existing.
   */
  moveEntry(sourcePath: string, destinationFolderPath: string): Promise<void>

  /** §REQ:TWO-PNL-NVGT-OOX-060 delete the item at `path`, once the user confirmed it. */
  deleteEntry(path: string): Promise<void>

  /**
   * §REQ:TWO-PNL-NVGT-OOX-070 create a folder named `name` inside the folder
   * `parentPath`, and return that folder's refreshed listing.
   */
  createFolder(parentPath: string, name: string): Promise<FolderListing>

  /**
   * §REQ:TWO-PNL-NVGT-OOX-080 rename the item at `path` to `newName`, leaving it
   * in the same parent folder.
   */
  renameEntry(path: string, newName: string): Promise<void>

  /** §REQ:TWO-PNL-NVGT-OOX-090 the textual content of the file at `path`. */
  readContent(path: string): Promise<FileContent>
}

export interface FilesystemClientOptions {
  /** Injected transport; defaults to the global `fetch`. */
  fetch?: typeof fetch
  /** Origin of the FilesystemApi; empty for a same-origin / proxied deployment. */
  baseUrl?: string
}

export class FilesystemApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'FilesystemApiError'
    this.status = status
  }
}

export function createFilesystemClient(
  options: FilesystemClientOptions = {},
): FilesystemClient {
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis)
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')

  return {
    // §REQ:TWO-PNL-NVGT-OOX-010 each panel reads the content of its own current folder
    // §REQ:TWO-PNL-NVGT-OOX-030 opening a subfolder is the same read, at the child path
    async listFolder(path: string): Promise<FolderListing> {
      const query = new URLSearchParams({ path }).toString()
      const response = await doFetch(`${baseUrl}/fs?${query}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        throw new FilesystemApiError(
          response.status,
          await readErrorDetail(response),
        )
      }
      return (await response.json()) as FolderListing
    },

    // §REQ:TWO-PNL-NVGT-OOX-040 the copy command of the active panel
    async copyEntry(sourcePath: string, destinationFolderPath: string): Promise<void> {
      await postJson(doFetch, `${baseUrl}/fs/copy`, {
        sourcePath,
        destinationPath: destinationFolderPath,
      })
    },

    // §REQ:TWO-PNL-NVGT-OOX-050 the move command of the active panel
    async moveEntry(sourcePath: string, destinationFolderPath: string): Promise<void> {
      await postJson(doFetch, `${baseUrl}/fs/move`, {
        sourcePath,
        destinationPath: destinationFolderPath,
      })
    },

    // §REQ:TWO-PNL-NVGT-OOX-060 issued ONLY after the user confirmed the deletion
    async deleteEntry(path: string): Promise<void> {
      const query = new URLSearchParams({ path }).toString()
      const response = await doFetch(`${baseUrl}/fs?${query}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        throw new FilesystemApiError(response.status, await readErrorDetail(response))
      }
    },

    // §REQ:TWO-PNL-NVGT-OOX-070 the create-folder command of the active panel
    async createFolder(parentPath: string, name: string): Promise<FolderListing> {
      return (await postJson(doFetch, `${baseUrl}/fs/folders`, {
        path: parentPath,
        name,
      })) as FolderListing
    },

    // §REQ:TWO-PNL-NVGT-OOX-080 the rename command of the active panel
    async renameEntry(path: string, newName: string): Promise<void> {
      const response = await doFetch(`${baseUrl}/fs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ path, newName }),
      })
      if (!response.ok) {
        throw new FilesystemApiError(response.status, await readErrorDetail(response))
      }
    },

    // §REQ:TWO-PNL-NVGT-OOX-090 the view command reads the file's text content
    async readContent(path: string): Promise<FileContent> {
      const query = new URLSearchParams({ path }).toString()
      const response = await doFetch(`${baseUrl}/fs/content?${query}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        throw new FilesystemApiError(response.status, await readErrorDetail(response))
      }
      return (await response.json()) as FileContent
    },
  }
}

/** Shared POST-with-JSON-body plumbing for the filesystem commands. */
async function postJson(
  doFetch: typeof fetch,
  url: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const response = await doFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new FilesystemApiError(response.status, await readErrorDetail(response))
  }
  return response.json().catch(() => null)
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') return body.detail
  } catch {
    /* a non-JSON error body is reported by status alone */
  }
  return `Request failed with status ${response.status}`
}
