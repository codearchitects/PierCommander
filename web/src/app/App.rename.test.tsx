/**
 * §REQ:TWO-PNL-NVGT-OOX-080 — Rinomina di un elemento selezionato.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

describe('§REQ:TWO-PNL-NVGT-OOX-080 renaming the selected item', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-080 the item appears under the new name and the old name is gone', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /^rename$/i }))

    const dialog = await screen.findByRole('dialog', { name: /rename/i })
    const field = within(dialog).getByRole('textbox', { name: /new name/i })
    await user.clear(field)
    await user.type(field, 'leggimi.txt')
    await user.click(within(dialog).getByRole('button', { name: /^rename$/i }))

    expect(
      await within(left).findByRole('option', { name: /leggimi\.txt/ }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(within(left).queryByRole('option', { name: /readme\.txt/ })).toBeNull()
    })
    expect(backend.tree[''].map((entry) => entry.name)).toContain('leggimi.txt')
    expect(backend.tree[''].map((entry) => entry.name)).not.toContain('readme.txt')

    const renamed = backend.requests.find((request) => request.method === 'PATCH')
    expect(renamed?.path).toBe('/fs')
    expect(renamed?.body).toEqual({ path: 'readme.txt', newName: 'leggimi.txt' })
  })

  it('§REQ:TWO-PNL-NVGT-OOX-080 the rename acts on the ACTIVE panel selection', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const right = await panel(/right panel/i)
    await user.click(await within(right).findByRole('option', { name: /notes\.md/ }))
    await user.click(screen.getByRole('button', { name: /^rename$/i }))

    const dialog = await screen.findByRole('dialog', { name: /rename/i })
    const field = within(dialog).getByRole('textbox', { name: /new name/i })
    await user.clear(field)
    await user.type(field, 'appunti.md')
    await user.click(within(dialog).getByRole('button', { name: /^rename$/i }))

    expect(
      await within(right).findByRole('option', { name: /appunti\.md/ }),
    ).toBeInTheDocument()
    const renamed = backend.requests.find((request) => request.method === 'PATCH')
    expect(renamed?.body).toEqual({ path: 'documents/notes.md', newName: 'appunti.md' })
  })

  it('§REQ:TWO-PNL-NVGT-OOX-080 cancelling the command renames nothing', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /^rename$/i }))

    const dialog = await screen.findByRole('dialog', { name: /rename/i })
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /rename/i })).toBeNull()
    })
    expect(backend.requests.some((request) => request.method === 'PATCH')).toBe(false)
    expect(backend.tree[''].map((entry) => entry.name)).toContain('readme.txt')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-080 a name already taken is reported and nothing is renamed', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /^rename$/i }))

    const dialog = await screen.findByRole('dialog', { name: /rename/i })
    const field = within(dialog).getByRole('textbox', { name: /new name/i })
    await user.clear(field)
    await user.type(field, 'documents')
    await user.click(within(dialog).getByRole('button', { name: /^rename$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/documents/)
    expect(backend.tree[''].map((entry) => entry.name)).toContain('readme.txt')
  })
})
