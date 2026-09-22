# CAIP Schema & Graph tools — universal mode (binding)

Two read-only data sources exist BESIDE the live modeler, plus a per-node knowledge file.
Pick the right one:

| You need… | Use |
|---|---|
| create/edit/rewire the live diagram | `caipC4Modeler*` tools (modeler protocol rule binds) |
| what properties a type supports, which fields are mandatory | **Schema tools** |
| hierarchy (what is inside what) and who talks to whom | **Graph tools** |
| blast radius before a risky change | `caipGraphGetImpactArea` |
| what an agent must know about ONE node | **Node context** (`caipC4NodeContext*`) |

Schema and Graph read the **persisted, last-saved** state; the modeler tools read the live
one. After unsaved changes, trust the modeler tools. Refresh tools
(`caipToolsRefreshSchema`, `caipGraphRefreshGraph`) exist but are rarely needed — files are
watched. In universal mode the schema may be served from the **extension's bundled copy**
(a workspace `codegen/model.schema.json`, when present, always wins) — same tools, same
answers, no codegen setup required.

## Schema tools — the type system

- `caepListSchemaTypes` — the discovery step: every type name. Call it before naming a type.
- `caepGetSchemaSlice(typeName, maxDepth=2)` — the full shape of one type with nested `$ref`
  expansion; use before creating an instance of it.
- `caepGetSchemaProperties(typeName)` — flat property summary (names, types, required,
  enums); lighter when nesting is not needed.
- `caepGetRequiredProperties(typeName)` — only the mandatory fields; the pre-creation check.

## Graph tools — the structural map

- `caipGraphGetGraphContext({ nodeId, includeAncestors: true, includeDescendants: true, includeIncomingInteractions: true, includeOutgoingInteractions: true })` — parent, children, ancestors, descendants,
  incoming/outgoing interactions; the orientation read ("what is inside this system?",
  "who depends on this service?"). Depth caps available.
- `caipGraphGetImpactArea({ nodeId })` — all potentially affected nodes plus `requiresApproval`:
  `true` means the impact reaches BEYOND the node's own descendants (external nodes interact
  with it — contracts may break). Run it **before any risky rewiring**, and report the
  summary to the user before proceeding.
- `caipGraphGetGraphChildren({ nodeId })` / `caipGraphGetGraphInteractions({ nodeId })` — the light
  single-purpose variants when one level or one direction is enough.

Typical flows: *orientation* — GraphContext with ancestors+interactions, then a SchemaSlice
per interesting type; *pre-change check* — ImpactArea, and on `requiresApproval: true`
report and ask; *type discovery* — ListSchemaTypes → SchemaSlice → RequiredProperties.

## Node context — per-node knowledge, inherited

A node can own an AI context document (`*.caip-context.md`): responsibilities, domain rules,
constraints, decisions already taken — the durable counterpart of a conversation.

- **Read before you act** on a node: `caipC4NodeContextRead({ c4Id, inherited: true })` —
  the chain composes Project → Context → Container → Component → Code, outermost first.
  **Closest-to-the-node wins** on contradictions; a contradiction that looks like a mistake
  rather than a deliberate override is reported, never silently resolved.
- **Write only the node's own section** (`caipC4NodeContextWrite`, `mode: "append"` as the
  safe default). Knowledge that holds for a whole subtree goes on the ancestor that owns it —
  duplicating it on every child is drift waiting to happen. Never rewrite the frontmatter:
  it binds the file to the node across renames.
- Anything the user tells you that will still be true next week belongs in the document, not
  in chat scrollback. Stay inside the session's anchored node/diagram — what you notice
  elsewhere is reported, not fixed in passing.
- **Close the loop**: `caipC4NodeContextLogOutcome` with one or two factual sentences (what
  changed, what is open) — and read the log before starting, to avoid redoing what a prior
  session did. A `null` outcome means that session never reported back: treat its effects as
  unverified.
