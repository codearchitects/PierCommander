/**
 * §REQ:TWO-PNL-NVGT-OOX-040 — Copia di un elemento selezionato verso l'altro pannello.
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

describe('§REQ:TWO-PNL-NVGT-OOX-040 copying the selected item to the other panel', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-040 the selected item is copied into the folder shown in the other panel', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /copy to other panel/i }))

    const copy = backend.requests.find((request) => request.path === '/fs/copy')
    expect(copy).toBeDefined()
    expect(copy?.method).toBe('POST')
    expect(copy?.body).toEqual({
      sourcePath: 'readme.txt',
      destinationPath: 'documents',
    })
    expect(backend.tree.documents.map((entry) => entry.name)).toContain('readme.txt')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-040 the destination panel refreshes its own content', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await panel(/left panel/i)
    const right = await panel(/right panel/i)
    expect(within(right).queryByRole('option', { name: /readme\.txt/ })).toBeNull()

    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /copy to other panel/i }))

    expect(
      await within(right).findByRole('option', { name: /readme\.txt/ }),
    ).toBeInTheDocument()
    // the source panel still holds the original: a copy, not a move
    expect(within(left).getByRole('option', { name: /readme\.txt/ })).toBeInTheDocument()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-040 the copy goes from whichever panel is active to the other one', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const right = await panel(/right panel/i)
    await user.click(await within(right).findByRole('option', { name: /notes\.md/ }))
    await user.click(screen.getByRole('button', { name: /copy to other panel/i }))

    const copy = backend.requests.find((request) => request.path === '/fs/copy')
    expect(copy?.body).toEqual({
      sourcePath: 'documents/notes.md',
      destinationPath: '',
    })
    const left = await panel(/left panel/i)
    expect(
      await within(left).findByRole('option', { name: /notes\.md/ }),
    ).toBeInTheDocument()
  })
})
