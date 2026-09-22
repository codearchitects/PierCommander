/**
 * A modal, in-app confirmation: the question is part of the application UI, so
 * it can be read, labelled and asserted on.
 *
 * §REQ:TWO-PNL-NVGT-OOX-060 the delete command requests an explicit confirmation
 * before anything is deleted.
 */
import { useEffect, useRef } from 'react'

export interface ConfirmDialogProps {
  label: string
  question: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  label,
  question,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  return (
    <div
      className="pc-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <p className="pc-dialog__question">{question}</p>
      <div className="pc-dialog__actions">
        <button type="button" ref={confirmRef} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}
