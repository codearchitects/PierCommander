/**
 * §REQ:TWO-PNL-NVGT-OOX-030 — Apertura di una sottocartella dal pannello attivo.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { createFilesystemClient } from '../api/filesystemClient'
import { createFakeBackend, file, folder } from '../test/fakeBackend'

const tree = {
  '': [folder('documents'), file('readme.txt')],
  documents: [folder('invoices'), file('notes.md')],
  'documents/invoices': [file('2026-01.pdf')],
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

const panel = (name: RegExp) => screen.findByRole('region', { name })

describe('§REQ:TWO-PNL-NVGT-OOX-030 opening a subfolder in the active panel', () => {
  it('§REQ:TWO-PNL-NVGT-OOX-030 the active panel shows the content of the opened subfolder', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await panel(/left panel/i)
    await user.dblClick(await within(left).findByRole('option', { name: /documents/ }))

    expect(await within(left).findByRole('option', { name: /invoices/ })).toBeInTheDocument()
    expect(within(left).getByRole('option', { name: /notes\.md/ })).toBeInTheDocument()
    expect(within(left).queryByRole('option', { name: /readme\.txt/ })).toBeNull()
    expect(within(left).getByTestId('panel-path')).toHaveTextContent('/documents')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-030 the other panel is unaffected by the navigation', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await panel(/left panel/i)
    const right = await panel(/right panel/i)
    expect(await within(right).findByRole('option', { name: /invoices/ })).toBeInTheDocument()

    await user.dblClick(await within(left).findByRole('option', { name: /documents/ }))
    await within(left).findByRole('option', { name: /invoices/ })

    expect(within(right).getByTestId('panel-path')).toHaveTextContent('/documents')
    expect(within(right).getByRole('option', { name: /invoices/ })).toBeInTheDocument()
    expect(within(right).getByRole('option', { name: /notes\.md/ })).toBeInTheDocument()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-030 a subfolder can be opened from the keyboard in the active panel', async () => {
    const user = userEvent.setup()
    renderApp()

    const right = await panel(/right panel/i)
    const left = await panel(/left panel/i)

    await user.click(await within(right).findByRole('option', { name: /invoices/ }))
    expect(right).toHaveAttribute('aria-current', 'true')
    await user.keyboard('{Enter}')

    expect(await within(right).findByRole('option', { name: /2026-01\.pdf/ })).toBeInTheDocument()
    expect(within(right).getByTestId('panel-path')).toHaveTextContent('/documents/invoices')
    expect(within(left).getByTestId('panel-path')).toHaveTextContent('/')
  })

  it('§REQ:TWO-PNL-NVGT-OOX-030 opening a file entry does not change the panel folder', async () => {
    const user = userEvent.setup()
    renderApp()

    const left = await panel(/left panel/i)
    await user.dblClick(await within(left).findByRole('option', { name: /readme\.txt/ }))

    expect(within(left).getByTestId('panel-path')).toHaveTextContent('/')
    expect(within(left).getByRole('option', { name: /documents/ })).toBeInTheDocument()
  })
})
