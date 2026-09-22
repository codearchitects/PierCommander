---
applyTo: "**"
---
# CAIP Requirement ids & traceability — universal mode (binding)

Requirement ids are the traceability keys of the whole workspace: requirement ↔ model ↔ code
↔ tests navigate through them. Two laws govern them — how an id is BORN, and how it is CITED.

## The `§REQ:` marker — a reference exists only if marked

Outside `.feature` files, **a requirement reference exists only when written as `§REQ:<id>`**
(no space, no extra markup): code and doc-comments, test docs, Markdown, EventStorm YAML
descriptions. An id-shaped token WITHOUT the marker is not a reference and must be ignored —
`SHA-256`, GUID fragments, ticket keys and branch names are not requirements. Inside
`.feature` files ids stay **bare**: in `@id(...)` / `@traces(...)` tags and `#` comments,
everything id-shaped is by definition a requirement.

## The chain is ONE hop

Every artifact cites only the layer immediately above it, never two layers up:

| Artifact | Cites EXACTLY | Never cites |
|---|---|---|
| Tests | the `§REQ:<id>` they verify | C4 nodes, boards, documents |
| Code | the `§REQ:<id>` it satisfies | same |
| Requirement (`.feature`) | its analysis material: the owning C4 node, the EventStorm board, attachments, documents with their section | — this is where those links LIVE |

Analysis material moves and gets renamed; on the requirement the link exists ONCE, maintained
by whoever touches the requirement. **Fallback rule**: if while writing code or a test you
feel the need to cite a document, a node or a board, that link is missing ON THE REQUIREMENT —
go add it there, never compensate with a comment in the code.

How the requirement carries its links (always through the `caipGherkin*` tools, never by
hand-editing mirrors — `caipGherkinSetC4Links` for the C4 node links,
`caipGherkinLinkScenarioToEventstorm` for the board): the owning C4 node in the Feature
header's `@c4-id:` tag; steps MAY additionally anchor the specific nodes they name with
`@c4-id:<node-id>` — those anchors are what the loop's model lane resolves, so they must
point at LIVE nodes. The one-hop rule applies to anchors too: never add an id by inference
from the model's relations.

## Who cites, who is exempt

Anything with real logic cites the requirements it satisfies. Pure data shapes (DTO-like
records, plain config), bootstrap/wiring and EMPTY stubs are exempt — **only while they stay
empty**: the moment a shell gets real logic, citing becomes mandatory. Preserve existing
citations unless explicit evidence reconciliation proves one wrong. That task may add
retrospective citations or correct/remove a disproven marker with a pre-edit snapshot and
reason. Cite only concrete implementing symbols and verifying assertions; a test proving
only a contradiction is observed-behavior evidence, not coverage. Preserve unrelated markers.

Two greps keep the chain honest: every id cited in ≥1 code file AND ≥1 test file (coverage),
and every `§REQ:` citation resolving to an existing `@id(...)` (anti link-rot — citations of
deleted or renamed ids are errors).

## Canonical id form — for every NEW requirement

```
<DOMAIN>-<SCENARIO>-<SCOPE>-<NNN>     e.g. BILLING-INVOICES-KQZ-010
```

| Segment | Rule |
|---|---|
| `DOMAIN` | UPPERCASE mnemonic of the functional domain / owning container (letters only); `SYS` for system-level and cross-cutting |
| `SCENARIO` | UPPERCASE mnemonic of the capability — never omitted: a two-segment id is invalid |
| `SCOPE` | short random UPPERCASE token drawn by the mint tool per batch, so ids minted in parallel merge without collisions; omit when minting manually |
| `NNN` | zero-padded incremental, one sequence per domain-scenario pair; never reused, never renumbered — a deleted scenario retires its number for good |

Rules:

1. **Mint, don't invent.** Obtain every new id from `caipGherkinMintRequirementId` (it owns
   the sequence and the scope token, and may step numbers by 10). Only when no minting tool
   is available: read the ids already assigned for that pair and take the next free number —
   never reclaim a deleted scenario's number.
2. **The C4 level is NOT part of the id** — it lives in the `@c4-context | @c4-container |
   @c4-component | @c4-code` tag; the id form is the same at every level.
3. **The refined parent goes in `@traces(<parent id>)`, never in `@id`.**
4. **Legacy ids are never renumbered.** They are cited across code, tests and mirrors; a mass
   migration breaks that silently. The canonical form binds new ids only; migrating old ones
   is an explicit product decision, never a side effect.
