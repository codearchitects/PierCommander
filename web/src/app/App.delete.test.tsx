/**
 * §REQ:TWO-PNL-NVGT-OOX-060 — Cancellazione di un elemento selezionato con
 * richiesta di conferma.
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
const deleteRequests = (backend: ReturnType<typeof createFakeBackend>) =>
  backend.requests.filter((request) => request.method === 'DELETE')

async function selectReadme(user: ReturnType<typeof userEvent.setup>) {
  const left = await panel(/left panel/i)
  await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
  return left
}

describe('§REQ:TWO-PNL-NVGT-OOX-060 deleting the selected item asks for confirmation', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-060 an explicit confirmation is requested and nothing is deleted while it is pending', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await selectReadme(user)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    const dialog = await screen.findByRole('dialog', { name: /confirm deletion/i })
    expect(dialog).toHaveTextContent(/readme\.txt/)
    // nothing has been deleted yet: the command was not issued
    expect(deleteRequests(backend)).toHaveLength(0)
    expect(backend.tree[''].map((entry) => entry.name)).toContain('readme.txt')
    expect(within(left).getByRole('option', { name: /readme\.txt/ })).toBeInTheDocument()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-060 confirming deletes the item and refreshes the panel', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await selectReadme(user)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    const dialog = await screen.findByRole('dialog', { name: /confirm deletion/i })
    await user.click(within(dialog).getByRole('button', { name: /yes, delete/i }))

    await waitFor(() => {
      expect(deleteRequests(backend)).toHaveLength(1)
    })
    expect(deleteRequests(backend)[0].path).toBe('/fs')
    expect(
      new URLSearchParams(deleteRequests(backend)[0].search).get('path'),
    ).toBe('readme.txt')
    expect(backend.tree[''].map((entry) => entry.name)).not.toContain('readme.txt')
    await waitFor(() => {
      expect(within(left).queryByRole('option', { name: /readme\.txt/ })).toBeNull()
    })
    expect(screen.queryByRole('dialog', { name: /confirm deletion/i })).toBeNull()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-060 cancelling leaves the item in place', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await selectReadme(user)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    const dialog = await screen.findByRole('dialog', { name: /confirm deletion/i })
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /confirm deletion/i })).toBeNull()
    })
    expect(deleteRequests(backend)).toHaveLength(0)
    expect(backend.tree[''].map((entry) => entry.name)).toContain('readme.txt')
    expect(within(left).getByRole('option', { name: /readme\.txt/ })).toBeInTheDocument()
  })
})
