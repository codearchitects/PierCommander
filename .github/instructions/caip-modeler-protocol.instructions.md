---
applyTo: "**"
---
# CAIP Modeler protocol — universal mode (binding)

The C4 model is authoritative ONLY through the `caipC4Modeler*` MCP tools. Never edit the
model's YAML files directly, and never conclude anything about the model from grepping them.

## Writing

1. **Read before writing.** Resolve the nodes you are about to touch
   (`caipC4ModelerGetNodesInfo`) and quote the relevant "before" when reporting a change.
2. **Address by ID, never by name.** Names collide and drift; every reference a tool asks for
   is a node ID. When a validator or option list rejects a by-name value, the proven repair is
   the node ID after a fresh read.
3. **Batch related changes** in one `caipC4ModelerUpdateNodes` / `caipC4ModelerCreateEdges`
   call where possible — then **re-read validation**: a result carrying "write introduced N
   validation errors" is YOUR red; repair it before moving on.
4. **One bounded retry** on a transient `Node with id … not found` for a node created
   moments ago: first re-read the node and affected state. Retry only when the node now
   resolves and the requested mutation was not applied. A second failure is real.
5. **Save** (`caipC4ModelerSave`) when the change set is complete. Unsaved writes are a dirty
   tree; a timeout is NOT a verdict — re-read before retrying a mutation.
6. **Add-and-rewire, never demolition.** Rerouting an interaction is rewiring; deleting a NODE
   is not yours to do to satisfy a reference — park the issue and report it
   (park-don't-invent: never create artifacts just to make a reference resolve). **Orphaning
   counts as demolition**: dropping a node from its parent's `children` loses it to the
   architecture even though the file survives. Before creating, check whether a node for the
   same concept already exists (orphaned included): reattach and retype beats
   duplicate-and-abandon. A node under the wrong family is retyped IN PLACE with
   `caipC4ModelerRetypeNodes` (id, name, children, interactions, anchors and position survive;
   pass the properties the new family requires) — never recreated and deleted. An ORPHAN — a
   `model.orphan-file` issue: the file exists, no parent lists it — is repaired with
   `caipC4ModelerReattachNodes({ attachments: [{ nodeId, parentId }] })`, which resolves the node
   anywhere in the project and keeps its id; the issue names the suggested parent. The same tool
   MOVES a node under another parent. An orphan is never recreated with
   `caipC4ModelerCreateNodes`: that mints a new id and breaks every `@c4-id:` anchor. Use
   `dryRun: true` to see the verdict per entry before writing.
7. **Prefer the specific family over the abstract one.** A mobile client is a
   `mobile-application`, a web/SPA client a `web-application`, a database a `database`, an
   API gateway a `gateway`, a broker a `message-bus`. The abstract types are the guaranteed
   fallback for concepts with no matching family — never the default: the type IS
   architecture information.
8. **One container per deployable unit.** A mobile app and a web app are TWO containers even
   when one codebase produces both — the shared codebase is a build-time fact (descriptions,
   shared target-profile cwd), never topology. Distinct clients are never per-target
   components inside one "client" container: components are internals of ONE runtime.

## Universal mode specifics

- Closed option-lists are advisory here (`prop.invalid-option` surfaces as a warning): prefer
  the listed values, never fight a model over one, and never "fix" a warning by inventing
  artifacts.
- The mode itself lives at level 0 of the model (`mode:` in `index.yml`, beside
  `caepVersion`) — never move it into editor settings.
- The whole zoom chain is navigable with the abstract vocabulary (abstract container →
  abstract component → code level, self-nesting); the full palette stays available as
  modeling intent — richness is not CAIP-ness.
