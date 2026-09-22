/**
 * Test double for the FilesystemApi HTTP surface: a `fetch`-compatible function
 * serving an in-memory folder tree. Tests inject it into the real HTTP client so
 * the wire contract is exercised without a live backend.
 *
 *   GET    /fs?path=<rel>                            -> { path, entries }
 *   POST   /fs/copy    {sourcePath, destinationPath} -> 201
 *   POST   /fs/move    {sourcePath, destinationPath} -> 200
 *   DELETE /fs?path=<rel>                            -> { path }
 *   POST   /fs/folders {path, name}                  -> 201 { path, entries }
 *   PATCH  /fs         {path, newName}               -> 200 { path, newName }
 *   GET    /fs/content?path=<rel>                    -> 200 { path, content }
 *
 * `destinationPath` is the DESTINATION FOLDER's path. Errors are HTTP
 * 404 / 409 / 400 with a JSON `detail`.
 */
import type { FsEntry } from '../api/types'

export type FolderTree = Record<string, FsEntry[]>

export function folder(name: string): FsEntry {
  return { name, type: 'directory', size: 0, modified: '2026-01-01T00:00:00+00:00' }
}

export function file(name: string, size = 12): FsEntry {
  return { name, type: 'file', size, modified: '2026-01-01T00:00:00+00:00' }
}

export interface FakeRequest {
  method: string
  path: string
  search: string
  body: Record<string, unknown> | null
}

export interface FakeBackend {
  fetch: typeof fetch
  /** Legacy shape kept for the pack-A tests: `pathname + search` per call. */
  calls: string[]
  /** Every call with its method and parsed JSON body. */
  requests: FakeRequest[]
  /** The live in-memory tree, so tests can assert the effect of a mutation. */
  tree: FolderTree
  /** Text content per file path; a path absent here is not a text file (415). */
  contents: Record<string, string>
}

export function createFakeBackend(
  initialTree: FolderTree,
  initialContents: Record<string, string> = {},
): FakeBackend {
  const tree: FolderTree = {}
  for (const [key, entries] of Object.entries(initialTree)) {
    tree[key] = entries.map((entry) => ({ ...entry }))
  }
  const contents: Record<string, string> = { ...initialContents }
  const calls: string[] = []
  const requests: FakeRequest[] = []

  const fakeFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = new URL(String(input), 'http://backend.test')
    const method = (init?.method ?? 'GET').toUpperCase()
    calls.push(url.pathname + url.search)
    requests.push({
      method,
      path: url.pathname,
      search: url.search,
      body: parseBody(init?.body),
    })

    if (method === 'GET' && url.pathname === '/fs' && !url.search.includes('&')) {
      const path = url.searchParams.get('path') ?? ''
      const entries = tree[path]
      if (entries === undefined) {
        return jsonResponse({ detail: `Folder not found: '${path}'` }, 404)
      }
      return jsonResponse({ path, entries }, 200)
    }

    // §REQ:TWO-PNL-NVGT-OOX-090 the text content of one file
    if (method === 'GET' && url.pathname === '/fs/content') {
      const path = url.searchParams.get('path') ?? ''
      if (!locate(tree, path)) {
        return jsonResponse({ detail: `Not found: '${path}'` }, 404)
      }
      const content = contents[path]
      if (content === undefined) {
        return jsonResponse({ detail: `Not a text file: '${path}'` }, 415)
      }
      return jsonResponse({ path, content }, 200)
    }

    // §REQ:TWO-PNL-NVGT-OOX-080 rename one entry in place
    if (method === 'PATCH' && url.pathname === '/fs') {
      const body = parseBody(init?.body) ?? {}
      const path = String(body.path ?? '')
      const newName = String(body.newName ?? '')
      if (newName === '') return jsonResponse({ detail: 'newName is required' }, 400)
      const located = locate(tree, path)
      if (!located) return jsonResponse({ detail: `Not found: '${path}'` }, 404)
      const siblings = tree[located.parent]
      if (siblings.some((entry) => entry.name === newName)) {
        return jsonResponse({ detail: `Already exists: '${newName}'` }, 409)
      }
      const target = join(located.parent, newName)
      for (const key of subtreeKeys(tree, path)) {
        tree[target + key.slice(path.length)] = tree[key]
        delete tree[key]
      }
      if (contents[path] !== undefined) {
        contents[target] = contents[path]
        delete contents[path]
      }
      located.entry.name = newName
      return jsonResponse({ path, newName }, 200)
    }

    if (method === 'POST' && url.pathname === '/fs/copy') {
      return transfer(tree, parseBody(init?.body), { remove: false, status: 201 })
    }

    if (method === 'POST' && url.pathname === '/fs/move') {
      return transfer(tree, parseBody(init?.body), { remove: true, status: 200 })
    }

    if (method === 'DELETE' && url.pathname === '/fs') {
      const path = url.searchParams.get('path') ?? ''
      const located = locate(tree, path)
      if (!located) return jsonResponse({ detail: `Not found: '${path}'` }, 404)
      detach(tree, path)
      return jsonResponse({ path }, 200)
    }

    if (method === 'POST' && url.pathname === '/fs/folders') {
      const body = parseBody(init?.body) ?? {}
      const parent = String(body.path ?? '')
      const name = String(body.name ?? '')
      if (name === '') return jsonResponse({ detail: 'Name is required' }, 400)
      const entries = tree[parent]
      if (entries === undefined) {
        return jsonResponse({ detail: `Folder not found: '${parent}'` }, 404)
      }
      if (entries.some((entry) => entry.name === name)) {
        return jsonResponse({ detail: `Already exists: '${name}'` }, 409)
      }
      entries.push(folder(name))
      tree[join(parent, name)] = []
      return jsonResponse({ path: parent, entries }, 201)
    }

    return jsonResponse({ detail: 'not implemented in the fake backend' }, 501)
  }

  return { fetch: fakeFetch as unknown as typeof fetch, calls, requests, tree, contents }
}

function transfer(
  tree: FolderTree,
  body: Record<string, unknown> | null,
  options: { remove: boolean; status: number },
): Response {
  const sourcePath = String(body?.sourcePath ?? '')
  const destinationPath = String(body?.destinationPath ?? '')
  const located = locate(tree, sourcePath)
  if (!located) {
    return jsonResponse({ detail: `Not found: '${sourcePath}'` }, 404)
  }
  const destination = tree[destinationPath]
  if (destination === undefined) {
    return jsonResponse({ detail: `Folder not found: '${destinationPath}'` }, 404)
  }
  if (destination.some((entry) => entry.name === located.entry.name)) {
    return jsonResponse({ detail: `Already exists: '${located.entry.name}'` }, 409)
  }
  const target = join(destinationPath, located.entry.name)
  destination.push({ ...located.entry })
  if (located.entry.type === 'directory') {
    for (const key of subtreeKeys(tree, sourcePath)) {
      tree[target + key.slice(sourcePath.length)] = tree[key].map((e) => ({ ...e }))
    }
  }
  if (options.remove) detach(tree, sourcePath)
  return jsonResponse({ path: target }, options.status)
}

function locate(
  tree: FolderTree,
  path: string,
): { parent: string; entry: FsEntry } | null {
  if (path === '') return null
  const cut = path.lastIndexOf('/')
  const parent = cut === -1 ? '' : path.slice(0, cut)
  const name = path.slice(cut + 1)
  const entry = tree[parent]?.find((candidate) => candidate.name === name)
  return entry ? { parent, entry } : null
}

function detach(tree: FolderTree, path: string): void {
  const located = locate(tree, path)
  if (!located) return
  tree[located.parent] = tree[located.parent].filter(
    (entry) => entry.name !== located.entry.name,
  )
  for (const key of subtreeKeys(tree, path)) delete tree[key]
}

function subtreeKeys(tree: FolderTree, path: string): string[] {
  return Object.keys(tree).filter(
    (key) => key === path || key.startsWith(`${path}/`),
  )
}

function join(parent: string, name: string): string {
  return parent === '' ? name : `${parent}/${name}`
}

function parseBody(body: BodyInit | null | undefined): Record<string, unknown> | null {
  if (typeof body !== 'string') return null
  try {
    return JSON.parse(body) as Record<string, unknown>
  } catch {
    return null
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
