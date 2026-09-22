# CAIP EventStorming — universal mode (binding)

A `.feature` whose header carries `@eventstorm-ref:<name>` (or whose Scenarios carry
`@eventstorm-node-id:<post-it-id>`) is not a generic spec: it describes the behaviour of
post-its on an EventStorm diagram and round-trips with the EventStorm editor through a strict
id convention. Misreading the post-it kind or breaking the round-trip silently degrades the
tool. These rules override generic Gherkin habits whenever those signals are present.

## Post-it kinds → Gherkin

The kind is encoded in the scenarioRef — `scn-<kind>-<slug>` — **read it from there, never
infer it from the title**:

| Kind | Role | Gherkin position |
|---|---|---|
| **event** | a domain fact that happened (past tense) | `Given` or `Then` |
| **command** | an intent to make something happen (imperative) | `When` |
| **policy** | reactive rule: when event X, do command Y | Given (event) → When (policy fires) → Then (command issued) |
| **aggregate** | consistency boundary carrying state | the noun the `When`/`Then` act on |
| **read-model** | query-side projection | `Given` (data exists) or `Then` (result shown) |
| **actor** | user/role/system issuing commands | subject of `Given`/`When` |
| **external-system** | out-of-scope system | `Given` (it sends X) or `Then` (it is notified) |
| **process** | long-running orchestration | ONE Scenario per step, all sharing the process post-it's `@eventstorm-node-id`; never one scenario with `*` steps, never a Scenario Outline |
| **hotspot** | open question, conflict, risk | **DO NOT specify behaviour** — leave a TODO comment or skip; convert to a real kind first (ask) |
| **other** | catch-all | descriptive only — never auto-generate behaviour; ask |

## The round-trip law

- The scenarioRef convention is `scn-<post-it-kind>-<slug-of-label>` (slug = lowercase,
  non-alphanumerics → dashes, trimmed). The kind prefix disambiguates a `command Validate`
  from a `policy Validate` — never strip it, never invent a ref without it.
- Auto-created scenarios get the seed title `<Kind capitalized> <Label words capitalized>`.
  **Rewriting the title to natural language is GOOD** — but `buildScenarioId(newTitle, idx)`
  must still equal the original scenarioRef: keep the same significant words in the same
  order (capitalisation, punctuation and stop-words don't affect the slug). A rename that
  breaks the round-trip makes the next gherkin-icon click CREATE a duplicate scenario.
- Never remove `@eventstorm-ref` (Feature) or `@eventstorm-node-id` (Scenario) — they are the
  foreign keys back to the diagram. One EventStorm per `.feature`.
- An awkward title born from an awkward LABEL (`Customerinvoice`) is fixed by renaming the
  **post-it in the EventStorm editor** first (the rename round-trips), then refining the
  scenario — never by hand-editing only the `.feature` title.

## Tags on every generated Scenario

Besides `@eventstorm-node-id`, every Scenario carries exactly one of
`@functional`/`@non-functional` and exactly one `@c4-<level>` (see the requirements rule).
Typical pairing: command/policy/process/aggregate/event/read-model → `@functional
@c4-component`; external-system → `@functional @c4-container`; actor → `@functional
@c4-context`; hotspot/other → do not auto-classify. Performance/security/SLA asks on the same
post-it become `@non-functional` scenarios in the same feature, scoped to that node — the
C4 diagram itself stays structural.

## Body skeleton (adapt the arc to the kind)

```gherkin
@eventstorm-node-id:<post-it-id> @functional @c4-component
Scenario: <the intent, in natural language>
  Given <preconditions / prior events on the aggregate(s)>
  When <the actor issues the command | the policy fires>
  Then <observable state change / event emitted / command issued>
  But <the violated precondition that blocks it — or a separate Scenario>
```

## Typed schema (`fields[]`) — the diagram is the source of truth

Post-its of kind aggregate, command, event and read-model can carry a typed `fields[]` schema
on the diagram. That schema is AUTHORITATIVE for the data shape: scenarios may mention field
names as examples, but types and cardinality are never derived from prose, and **no ghost
field is ever invented** because a step mentions a noun. A scenario naming an undeclared
field means either the post-it schema is missing it (suggest adding it — via the EventStorm
editor's fields modal, never by hand-editing the YAML) or the step is prose, which is fine.
When the user asks to "add a field", the right place is the post-it's `fields[]` — not the
scenario text.
