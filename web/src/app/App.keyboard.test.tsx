/**
 * §REQ:TWO-PNL-NVGT-OOX-100 — Esecuzione dei comandi essenziali da tastiera.
 *
 * Every test in this file is driven with the KEYBOARD ONLY: `userEvent.tab` and
 * `userEvent.keyboard`, never `userEvent.click`. A document-level pointer probe
 * asserts that no pointer event was needed to reach the command.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { createFilesystemClient } from '../api/filesystemClient'
import { createFakeBackend, file, folder } from '../test/fakeBackend'

const tree = {
  '': [folder('documents'), file('readme.txt')],
  documents: [file('notes.md')],
}

const contents = {
  'readme.txt': 'Ciao dal file di testo.',
  'documents/notes.md': 'appunti di lavoro',
}

/** §REQ:TWO-PNL-NVGT-OOX-100 counts any pointer interaction reaching the document. */
let pointerEvents = 0
const countPointer = () => {
  pointerEvents += 1
}

beforeEach(() => {
  pointerEvents = 0
  for (const type of ['pointerdown', 'mousedown', 'click', 'dblclick']) {
    document.addEventListener(type, countPointer, true)
  }
})

afterEach(() => {
  for (const type of ['pointerdown', 'mousedown', 'click', 'dblclick']) {
    document.removeEventListener(type, countPointer, true)
  }
})

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
const noPointer = () => expect(pointerEvents).toBe(0)

/**
 * §REQ:TWO-PNL-NVGT-OOX-100 reach the left panel and put the cursor on
 * `readme.txt` using nothing but Tab and the arrow keys.
 */
async function selectReadmeWithKeyboard(user: ReturnType<typeof userEvent.setup>) {
  const left = await panel(/left panel/i)
  await within(left).findByRole('option', { name: /readme\.txt/ })
  await user.tab()
  expect(left).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  await waitFor(() => {
    expect(within(left).getByRole('option', { name: /readme\.txt/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
  return left
}

describe('§REQ:TWO-PNL-NVGT-OOX-100 the essential commands start from the keyboard', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-100 F8 starts the delete command: the confirmation appears and nothing is deleted yet', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    await selectReadmeWithKeyboard(user)
    await user.keyboard('{F8}')

    const dialog = await screen.findByRole('dialog', { name: /confirm deletion/i })
    expect(dialog).toHaveTextContent(/readme\.txt/)
    expect(backend.requests.some((request) => request.method === 'DELETE')).toBe(false)
    expect(backend.tree[''].map((entry) => entry.name)).toContain('readme.txt')
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 F7 starts the create-folder command: the name prompt appears', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    await selectReadmeWithKeyboard(user)
    await user.keyboard('{F7}')

    await screen.findByRole('dialog', { name: /new folder/i })
    expect(backend.requests.some((request) => request.path === '/fs/folders')).toBe(false)
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 Shift+F6 starts the rename command: the name prompt appears', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    await selectReadmeWithKeyboard(user)
    await user.keyboard('{Shift>}{F6}{/Shift}')

    const dialog = await screen.findByRole('dialog', { name: /rename/i })
    expect(within(dialog).getByRole('textbox', { name: /new name/i })).toHaveValue(
      'readme.txt',
    )
    expect(backend.requests.some((request) => request.method === 'PATCH')).toBe(false)
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 F3 starts the view command: the content is shown', async () => {
    const user = userEvent.setup()
    renderApp()

    await selectReadmeWithKeyboard(user)
    await user.keyboard('{F3}')

    const preview = await screen.findByRole('dialog', { name: /preview/i })
    expect(within(preview).getByText(/Ciao dal file di testo\./)).toBeInTheDocument()
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 F5 starts the copy command', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    await selectReadmeWithKeyboard(user)
    await user.keyboard('{F5}')

    await waitFor(() => {
      expect(backend.tree['documents'].map((entry) => entry.name)).toContain('readme.txt')
    })
    expect(backend.tree[''].map((entry) => entry.name)).toContain('readme.txt')
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 F6 starts the move command', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    await selectReadmeWithKeyboard(user)
    await user.keyboard('{F6}')

    await waitFor(() => {
      expect(backend.tree['documents'].map((entry) => entry.name)).toContain('readme.txt')
    })
    expect(backend.tree[''].map((entry) => entry.name)).not.toContain('readme.txt')
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 the shortcut acts on the ACTIVE panel', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    const right = await panel(/right panel/i)
    await within(right).findByRole('option', { name: /notes\.md/ })
    // two tabs: the left panel, then the right one — which becomes the active panel
    await user.tab()
    await user.tab()
    expect(right).toHaveFocus()
    expect(await screen.findByLabelText(/active panel/i)).toHaveTextContent(/right panel/i)

    await user.keyboard('{F8}')

    const dialog = await screen.findByRole('dialog', { name: /confirm deletion/i })
    expect(dialog).toHaveTextContent(/notes\.md/)
    expect(dialog).not.toHaveTextContent(/readme\.txt/)
    expect(backend.requests.some((request) => request.method === 'DELETE')).toBe(false)
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 a shortcut does not fire while a modal dialog is open', async () => {
    const user = userEvent.setup()
    const backend = renderApp()

    await selectReadmeWithKeyboard(user)
    await user.keyboard('{F7}')
    await screen.findByRole('dialog', { name: /new folder/i })

    // the name prompt owns the keyboard: F8 must NOT start a second command
    await user.keyboard('{F8}')
    await user.keyboard('{F3}')

    expect(screen.queryByRole('dialog', { name: /confirm deletion/i })).toBeNull()
    expect(screen.queryByRole('dialog', { name: /preview/i })).toBeNull()
    expect(screen.getByRole('dialog', { name: /new folder/i })).toBeInTheDocument()
    expect(backend.requests.some((request) => request.path === '/fs/content')).toBe(false)
    noPointer()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-100 the key hints are shown, so the shortcuts are discoverable', async () => {
    renderApp()

    const bar = await screen.findByRole('list', { name: /function keys/i })
    for (const [key, command] of [
      ['F3', /view/i],
      ['F5', /copy/i],
      ['F6', /move/i],
      ['Shift\\+F6', /rename/i],
      ['F7', /new folder/i],
      ['F8', /delete/i],
    ] as const) {
      const hint = within(bar).getByText(new RegExp(`^${key}$`))
      expect(hint).toBeInTheDocument()
      expect(hint.closest('li')).toHaveTextContent(command)
    }
  })
})
