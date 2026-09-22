/**
 * §REQ:TWO-PNL-NVGT-OOX-020 — Selezione del pannello attivo.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { createFilesystemClient } from '../api/filesystemClient'
import { createFakeBackend, file, folder } from '../test/fakeBackend'

const tree = {
  '': [folder('documents'), file('readme.txt')],
  documents: [folder('invoices'), file('notes.md')],
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
}

describe('§REQ:TWO-PNL-NVGT-OOX-020 active panel selection', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-020 exactly one of the two panels is active on load', async () => {
    renderApp()

    const left = await screen.findByRole('region', { name: /left panel/i })
    const right = await screen.findByRole('region', { name: /right panel/i })

    expect(left).toHaveAttribute('aria-current', 'true')
    expect(right).toHaveAttribute('aria-current', 'false')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-020 selecting the other panel makes it the active one', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await screen.findByRole('region', { name: /left panel/i })
    const right = await screen.findByRole('region', { name: /right panel/i })

    await user.click(right)

    expect(right).toHaveAttribute('aria-current', 'true')
    expect(left).toHaveAttribute('aria-current', 'false')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-020 the active panel is announced as the target of subsequent commands', async () => {
    const user = userEvent.setup()
    renderApp()

    const status = await screen.findByRole('status', { name: /active panel/i })
    expect(status).toHaveTextContent(/left/i)

    await user.click(await screen.findByRole('region', { name: /right panel/i }))
    expect(status).toHaveTextContent(/right/i)
  })

  it('§REQ:TWO-PNL-NVGT-OOX-020 the panel can be selected from the keyboard', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await screen.findByRole('region', { name: /left panel/i })
    const right = await screen.findByRole('region', { name: /right panel/i })

    await user.tab()
    expect(left).toHaveAttribute('aria-current', 'true')
    await user.tab()
    expect(right).toHaveAttribute('aria-current', 'true')
    expect(left).toHaveAttribute('aria-current', 'false')
  })
})
