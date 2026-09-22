/**
 * The Norton-Commander function-key bar.
 *
 * §REQ:TWO-PNL-NVGT-OOX-100 the shortcuts are discoverable: every key and the
 * command it starts are written in the UI. The bar is a legend, not a control —
 * it takes no focus, so it never sits between the user and the two panels.
 */
import { commandShortcuts } from '../state/commandShortcuts'

export function FunctionKeyBar() {
  return (
    <ul className="pc-fnbar" aria-label="Function keys">
      {commandShortcuts.map((shortcut) => (
        <li key={shortcut.hint} className="pc-fnbar__item">
          <kbd className="pc-fnbar__key">{shortcut.hint}</kbd>
          <span className="pc-fnbar__label">{shortcut.label}</span>
        </li>
      ))}
    </ul>
  )
}
