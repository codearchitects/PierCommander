# CAIP Requirements authoring — universal mode (binding)

A `.feature` is the behavioural requirement of the C4 node whose `@c4-id:` it carries — one
of that node's attachments, alongside its EventStorm board and analysis material. It is the
location's COMPLETE specification: the functional behaviour AND the non-functional
constraints scoped to that location (`@non-functional` scenarios). The C4 diagram itself
stays structural — a location-specific constraint is never left implicit in the diagram.
When the file carries EventStorm signals, the EventStorming rule also applies and takes
precedence on round-trip matters.

## Structure

Standard Gherkin keywords only (`Feature`, `Background`, `Rule`, `Scenario`,
`Scenario Outline` + `Examples`, `Given/When/Then/And/But`) — never invent keywords.
`Background` only when ALL scenarios share the precondition.

1. **One behaviour per scenario** — a single observable outcome. `Login and edit profile` is
   two scenarios.
2. **Declarative, domain-perspective language**: system state and business actions, not
   technical operations; no UI references unless the UI IS the requirement.
3. Every Scenario has at least one Given, one When, one Then. `Given` = state BEFORE;
   `When` = the triggering action (never an expected result); `Then` = an observable
   assertion (never an action); `And`/`But` chain same-type steps.
4. **Observable and deterministic**: no `fast`, `properly`, `correctly`, `as expected`. If it
   cannot be observed, it cannot be verified — reword it until it can.
5. Parametric variants use `Scenario Outline` + `Examples`, never copy-pasted near-duplicates.

## Language rule — English Gherkin + two comments

Gherkin text is ALWAYS English (translate faithfully; domain proper names stay as given).
Every Feature and every Scenario carries TWO `#` comments immediately above its tag line:

1. an **English synthesis** — one line, the essence and the observable outcome;
2. the **author's own language, informal** — the requirement the way that person would
   casually say it, preserving nuance (this is what lets the author recognise their own
   requirement). When the author's language IS English, add the informal line only when it
   captures nuance the synthesis omits.

They are not translations of each other; when the requirement changes, both change. Attach
them with `caipGherkinSetComments`.

## Tags — mandatory on every Scenario

On the tag line above the scenario keyword, in this order:

1. **`@id(<ID>)` — minted, never invented** (see the requirement-ids rule: the mint tool owns
   sequences and scope tokens). A scenario without `@id` is outside the traceability graph:
   the loop cannot select it, code cannot cite it. Upstream requirements it derives from go
   in `@traces(<ID>)`.
2. exactly one of **`@functional`** / **`@non-functional`** (quality attributes — performance,
   security, scalability, availability, compliance — are non-functional, and scoped to the
   node they constrain);
3. exactly one C4 level — `@c4-context` (system ↔ external actors/systems), `@c4-container`
   (one deployable unit), `@c4-component` (internals of a container), `@c4-code`
   (class/function level). When in doubt, the MOST SPECIFIC level that matches. Never at
   Feature level, never duplicated; when modifying a scenario, re-verify its tags.

## Architecture check — automatic, propose-only

After every requirement added or changed, in the same response and without being asked:
read the model at the relevant level(s) (`caipC4ModelerGetActiveLevelDiagram`, read-only) and
check that every actor, external system, container and relationship the scenario implies
exists. Gaps → present a grouped proposal (element, family, level, relationships) and **wait
for authorization — never auto-create model elements**; structure is the architect's lane.
No gaps → say so explicitly ("the current architecture already covers this requirement").
If the user declines, record nothing and do not insist.

Requirement citations outside `.feature` files use the `§REQ:<id>` marker; ids inside stay
bare — the full law lives in the requirement-ids rule.
