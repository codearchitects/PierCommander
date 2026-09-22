/**
 * §REQ:TWO-PNL-NVGT-OOX-010 — Visualizzazione del filesystem in due pannelli indipendenti.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { App } from './App'
import { createFilesystemClient } from '../api/filesystemClient'
import { createFakeBackend, file, folder } from '../test/fakeBackend'

describe('§REQ:TWO-PNL-NVGT-OOX-010 two independent panels', () => {
  const tree = {
    '': [folder('documents'), file('readme.txt')],
    documents: [folder('invoices'), file('notes.md')],
  }

  it('§REQ:TWO-PNL-NVGT-OOX-010 shows two panels when the page is loaded', async () => {
    const backend = createFakeBackend(tree)
    render(<App client={createFilesystemClient({ fetch: backend.fetch, baseUrl: '' })} />)

    expect(await screen.findByRole('region', { name: /left panel/i })).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: /right panel/i })).toBeInTheDocument()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-010 each panel lists the content of its own current folder', async () => {
    const backend = createFakeBackend(tree)
    render(
      <App
        client={createFilesystemClient({ fetch: backend.fetch, baseUrl: '' })}
        initialLeftPath=""
        initialRightPath="documents"
      />,
    )

    const left = await screen.findByRole('region', { name: /left panel/i })
    const right = await screen.findByRole('region', { name: /right panel/i })

    expect(await within(left).findByRole('option', { name: /documents/ })).toBeInTheDocument()
    expect(within(left).getByRole('option', { name: /readme\.txt/ })).toBeInTheDocument()
    expect(within(left).queryByRole('option', { name: /notes\.md/ })).toBeNull()

    expect(await within(right).findByRole('option', { name: /invoices/ })).toBeInTheDocument()
    expect(within(right).getByRole('option', { name: /notes\.md/ })).toBeInTheDocument()
    expect(within(right).queryByRole('option', { name: /readme\.txt/ })).toBeNull()
  })

  it('§REQ:TWO-PNL-NVGT-OOX-010 each panel shows its own current folder path', async () => {
    const backend = createFakeBackend(tree)
    render(
      <App
        client={createFilesystemClient({ fetch: backend.fetch, baseUrl: '' })}
        initialLeftPath=""
        initialRightPath="documents"
      />,
    )

    const left = await screen.findByRole('region', { name: /left panel/i })
    const right = await screen.findByRole('region', { name: /right panel/i })

    expect(await within(left).findByTestId('panel-path')).toHaveTextContent('/')
    expect(await within(right).findByTestId('panel-path')).toHaveTextContent('/documents')
  })
})
