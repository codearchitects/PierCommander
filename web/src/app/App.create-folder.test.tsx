/**
 * §REQ:TWO-PNL-NVGT-OOX-070 — Creazione di una nuova cartella dal pannello attivo.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { createFilesystemClient } from '../api/filesystemClient'
import { createFakeBackend, file, folder } from '../test/fakeBackend'

const tree = {
  '': [folder('documents'), file('readme.txt')],
  documents: [file('notes.md')],
}

function renderApp() {
  const backend = createFakeBackend(tree)
  render(
    <App
      client={createFilesystemClient({ fetch: backend.fetch, baseUrl: '' })}
      initialLeftPath=""
      initialRightPath="documents"
    />,
  )
  return backend
}

const panel = (name: RegExp) => screen.findByRole('region', { name })

describe('§REQ:TWO-PNL-NVGT-OOX-070 creating a new folder from the active panel', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-070 the new folder appears in the active panel', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(left)
    await user.click(screen.getByRole('button', { name: /new folder/i }))

    const dialog = await screen.findByRole('dialog', { name: /new folder/i })
    await user.type(within(dialog).getByRole('textbox', { name: /folder name/i }), 'archive')
    await user.click(within(dialog).getByRole('button', { name: /^create$/i }))

    expect(
      await within(left).findByRole('option', { name: /archive/ }),
    ).toBeInTheDocument()
    const created = backend.requests.find((request) => request.path === '/fs/folders')
    expect(created?.method).toBe('POST')
    expect(created?.body).toEqual({ path: '', name: 'archive' })
    expect(backend.tree[''].map((entry) => entry.name)).toContain('archive')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-070 the folder is created in the folder the ACTIVE panel shows', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const right = await panel(/right panel/i)
    await user.click(right)
    await user.click(screen.getByRole('button', { name: /new folder/i }))

    const dialog = await screen.findByRole('dialog', { name: /new folder/i })
    await user.type(within(dialog).getByRole('textbox', { name: /folder name/i }), 'drafts')
    await user.click(within(dialog).getByRole('button', { name: /^create$/i }))

    expect(
      await within(right).findByRole('option', { name: /drafts/ }),
    ).toBeInTheDocument()
    const created = backend.requests.find((request) => request.path === '/fs/folders')
    expect(created?.body).toEqual({ path: 'documents', name: 'drafts' })

    const left = await panel(/left panel/i)
    expect(within(left).queryByRole('option', { name: /drafts/ })).toBeNull()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-070 cancelling the command creates nothing', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    await user.click(screen.getByRole('button', { name: /new folder/i }))
    const dialog = await screen.findByRole('dialog', { name: /new folder/i })
    await user.type(within(dialog).getByRole('textbox', { name: /folder name/i }), 'archive')
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog', { name: /new folder/i })).toBeNull()
    expect(backend.requests.some((request) => request.path === '/fs/folders')).toBe(false)
    expect(backend.tree[''].map((entry) => entry.name)).not.toContain('archive')
  })
})
