/**
 * §REQ:TWO-PNL-NVGT-OOX-090 — Anteprima del contenuto di un file di testo
 * selezionato.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { createFilesystemClient } from '../api/filesystemClient'
import { createFakeBackend, file, folder } from '../test/fakeBackend'

const tree = {
  '': [folder('documents'), file('readme.txt'), file('logo.png')],
  documents: [file('notes.md')],
}

const README = 'Ciao dal file di testo.\nSeconda riga del contenuto.'

const contents = {
  'readme.txt': README,
  'documents/notes.md': 'appunti di lavoro',
}

function renderApp() {
  const backend = createFakeBackend(tree, contents)
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

describe('§REQ:TWO-PNL-NVGT-OOX-090 previewing the selected text file', () => {
  it("§REQ:TWO-PNL-NVGT-OOX-090 the file's textual content is shown to the user", async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /^view$/i }))

    const preview = await screen.findByRole('dialog', { name: /preview/i })
    expect(within(preview).getByText(/Ciao dal file di testo\./)).toBeInTheDocument()
    expect(within(preview).getByText(/Seconda riga del contenuto\./)).toBeInTheDocument()
    expect(preview).toHaveTextContent(/readme\.txt/)

    const read = backend.requests.find((request) => request.path === '/fs/content')
    expect(read?.method).toBe('GET')
    expect(new URLSearchParams(read?.search ?? '').get('path')).toBe('readme.txt')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-090 the preview can be closed', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /readme\.txt/ }))
    await user.click(screen.getByRole('button', { name: /^view$/i }))

    const preview = await screen.findByRole('dialog', { name: /preview/i })
    await user.click(within(preview).getByRole('button', { name: /close/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /preview/i })).toBeNull()
    })
    expect(screen.queryByText(/Ciao dal file di testo\./)).toBeNull()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-090 the preview reads the ACTIVE panel selection', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const right = await panel(/right panel/i)
    await user.click(await within(right).findByRole('option', { name: /notes\.md/ }))
    await user.click(screen.getByRole('button', { name: /^view$/i }))

    const preview = await screen.findByRole('dialog', { name: /preview/i })
    expect(within(preview).getByText(/appunti di lavoro/)).toBeInTheDocument()
    const read = backend.requests.find((request) => request.path === '/fs/content')
    expect(new URLSearchParams(read?.search ?? '').get('path')).toBe('documents/notes.md')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-090 a file that is not text is reported instead of previewed', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /logo\.png/ }))
    await user.click(screen.getByRole('button', { name: /^view$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/logo\.png/)
    expect(screen.queryByRole('dialog', { name: /preview/i })).toBeNull()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-090 a folder is not previewed', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const left = await panel(/left panel/i)
    await user.click(await within(left).findByRole('option', { name: /\[documents\]/ }))
    await user.click(screen.getByRole('button', { name: /^view$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /preview/i })).toBeNull()
    })
    expect(backend.requests.some((request) => request.path === '/fs/content')).toBe(false)
  })
})
