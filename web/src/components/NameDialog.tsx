/**
 * A modal, in-app prompt for one name.
 *
 * §REQ:TWO-PNL-NVGT-OOX-070 the create-folder command asks the user for the new
 * folder's name before creating anything.
 * §REQ:TWO-PNL-NVGT-OOX-080 the rename command asks for the new name, offering
 * the current one as the starting point.
 */
import { useEffect, useId, useRef, useState } from 'react'

export interface NameDialogProps {
  label: string
  fieldLabel: string
  submitLabel: string
  cancelLabel?: string
  /** §REQ:TWO-PNL-NVGT-OOX-080 the value the field starts with (the current name). */
  initialValue?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

export function NameDialog({
  label,
  fieldLabel,
  submitLabel,
  cancelLabel = 'Cancel',
  initialValue = '',
  onSubmit,
  onCancel,
}: NameDialogProps) {
  const [name, setName] = useState(initialValue)
  const fieldId = useId()
  const fieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fieldRef.current?.focus()
    fieldRef.current?.select()
  }, [])

  return (
    <div className="pc-dialog" role="dialog" aria-modal="true" aria-label={label}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          // §REQ:TWO-PNL-NVGT-OOX-070 an empty name is not a command
          if (name.trim() !== '') onSubmit(name.trim())
        }}
      >
        <label htmlFor={fieldId}>{fieldLabel}</label>
        <input
          id={fieldId}
          ref={fieldRef}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="pc-dialog__actions">
          <button type="submit">{submitLabel}</button>
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
