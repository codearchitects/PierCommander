# CAIP Gherkin contract — universal mode (binding)

Scenario metadata IS the state of the requirement pipeline. Read and write it ONLY through
the `caipGherkin*` MCP tools — never by editing `.feature` files' mirrors or sidecars.

## Selection — skip what has not moved

Work ONLY requirements that moved since their last successful elaboration: `updatedAt` after
`aiGeneratedAt`, or `aiGeneratedAt` unset, or error flags set (`aiErrorCount > 0`).
Re-running an unmoved green requirement burns budget and rewrites the very timestamps the
next pass uses to detect real change.

## Stamps — a pair, on every cycle

- Opening a requirement: `aiStartedAt: "now"`, `errorMessage: null`.
- Closing it, ALWAYS: `aiEndedAt: "now"` and `aiRevisionCount` written back as an explicit
  value (read at intake — there is no `+1`).
- Closing it, ALWAYS, in the same write: **who answered** — `aiProvider` (`"anthropic"`,
  `"openai"`, `"ollama"`…) and `aiModel`, the exact model id your runtime DECLARES to you. Never
  guess and never carry the previous cycle's: when your runtime declares no model, omit both and
  the tool records `null`. The tool logs every close to the requirement's change log as
  `AI:<provider>/<model>` by itself — do not append that entry by hand.
- Green only: `aiGeneratedAt: "now"`, `aiErrorCount: 0`. A failed pass is NEVER a successful
  elaboration: on failure `errorMessage` carries the real failure text and `aiGeneratedAt`
  stays untouched.
- A previously green requirement you watched fail is DISPROVEN: clear `aiGeneratedAt`, and
  say so.
- **Never set `createdAt` / `updatedAt`**: a fresh `updatedAt` reads as "the author rewrote
  it" and feeds the loop its own tail.

## Touch discipline

A requirement not processed this round, or processed and passed, stays byte-identical —
never bump timestamps "for consistency". Requirement IDs are cited in code and tests as
`§REQ:<id>`; a citation already in a file is not yours to delete — add yours beside it.
