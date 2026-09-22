/**
 * Browser entrypoint: wiring only (no behaviour of its own).
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { createFilesystemClient } from './api/filesystemClient'

const client = createFilesystemClient({ baseUrl: import.meta.env.VITE_FS_API_URL ?? '' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App client={client} />
  </StrictMode>,
)
