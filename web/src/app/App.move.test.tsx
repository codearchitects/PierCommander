/**
 * §REQ:TWO-PNL-NVGT-OOX-050 — Spostamento di un elemento selezionato verso l'altro pannello.
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

describe('§REQ:TWO-PNL-NVGT-OOX-050 moving the selected item to the other panel', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-050 the selected item is moved into the folder shown in the other panel', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /move to other panel/i }))

    const move = backend.requests.find((request) => request.path === '/fs/move')
    expect(move).toBeDefined()
    expect(move?.method).toBe('POST')
    expect(move?.body).toEqual({
      sourcePath: 'readme.txt',
      destinationPath: 'documents',
    })
    expect(backend.tree.documents.map((entry) => entry.name)).toContain('readme.txt')
    expect(backend.tree[''].map((entry) => entry.name)).not.toContain('readme.txt')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-050 the source panel refreshes its own content', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await panel(/left panel/i)
    const right = await panel(/right panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /move to other panel/i }))

    // the moved item is gone from the source panel without reloading the page
    await waitGone(left)
    expect(
      await within(right).findByRole('option', { name: /readme\.txt/ }),
    ).toBeInTheDocument()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-050 the move goes from whichever panel is active to the other one', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const right = await panel(/right panel/i)
    await user.click(await within(right).findByRole('option', { name: /notes\.md/ }))
    await user.click(screen.getByRole('button', { name: /move to other panel/i }))

    const move = backend.requests.find((request) => request.path === '/fs/move')
    expect(move?.body).toEqual({
      sourcePath: 'documents/notes.md',
      destinationPath: '',
    })
    await waitGone(right)
  })
})

async function waitGone(container: HTMLElement) {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(
      within(container).queryByRole('option', { name: /readme\.txt|notes\.md/ }),
    ).toBeNull()
  })
}
