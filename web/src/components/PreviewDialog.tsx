/**
 * A modal, in-app viewer showing one text file's content verbatim.
 *
 * §REQ:TWO-PNL-NVGT-OOX-090 the view command shows the textual content of the
 * selected file to the user, and the user can close it again.
 */
import { useEffect, useRef } from 'react'

export interface PreviewDialogProps {
  /** Name of the previewed file, shown so the user knows what they are reading. */
  name: string
  /** §REQ:TWO-PNL-NVGT-OOX-090 the file's textual content, rendered verbatim. */
  content: string
  onClose: () => void
}

export function PreviewDialog({ name, content, onClose }: PreviewDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div
      className="pc-dialog pc-preview"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${name}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <p className="pc-preview__name">{name}</p>
      {/* §REQ:TWO-PNL-NVGT-OOX-090 the content itself, line breaks preserved */}
      <pre className="pc-preview__content" data-testid="preview-content">
        {content}
      </pre>
      <div className="pc-dialog__actions">
        <button type="button" ref={closeRef} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
