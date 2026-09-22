---
description: Evidence reconciliation of existing requirements, implementation and tests in a bounded document batch; read-only audit by default.
argument-hint: documentId=<id> [mode=audit|link] [batch=5] [ids=<id,id>]
---

# Reconcile existing requirement evidence

Requested arguments: $ARGUMENTS

This is a procedure for the Assistant to carry out with its existing tools. It delivers
instructions to the model; it is not an executable engine or a guarantee of model compliance.
Use the same procedure in CAEP and Universal workspaces. This task reconstructs what exists.
Never implement missing code or change behavior to make a recovered requirement true.
Never silently change a contradictory contract.

## 1. Bound the request before doing work

Parse the supplied `key=value` arguments. Require one `documentId`; default `batch=5`.
`batch` is a positive integer limiting the number of eligible scenarios processed in this
invocation. Optional `ids` is a comma-separated list of exact scenario IDs in that document;
it narrows selection, never expands to other documents. Reject unknown arguments, invalid
values, duplicate keys and IDs absent from the document; report the correction needed before
any writes. Do not silently substitute a different document or broaden to the whole catalog.

Default mode: audit (read-only).
In audit mode, read and report evidence only: no source, test, requirement, comment, relation
or metadata writes, including no attempt timestamps or persisted ledger. Return findings in
the response; persisting evidence requires link mode or a separate explicit request.

Link mode authorizes only evidence-backed citations, relationships and comments.
`mode=link` explicitly authorizes this limited retrospective reconciliation. It authorizes no
new tests, assertion changes, implementation, refactoring, code generation or contract rewrite.
If code is missing or disagrees with the requirement, preserve and report the difference;
future implementation or a contract change needs a separate task. Tests may be added later.

Discover applicable roles, commands and skills with `skill_list`, then load them with
`skill_read`. Follow the workspace's requirements-hardening guidance when available, together
with the requirement-ID, generation-strategy and Gherkin metadata rules. Use the installed
CAIP Developer for source/assertion analysis and CAIP Analyst for requirement relations;
Universal workspaces use universal-developer and universal-analyst. Preserve their role
boundaries: a delegated reader returns evidence; no reconciliation role writes pipeline metadata.

## 2. Read authoritative requirements and select incrementally

Discover the registered Gherkin/model tools and their current schemas before invoking them
(the CAIP facade exposes `caipListTools`, `caipDescribeTool` and `caipInvoke`). Read the chosen
document and scenario metadata through `caipGherkinReadDocuments` / `caipGherkinGetScenario`
and the registered metadata read tools. Never inspect or edit requirement mirrors, `.feature`
files or model YAML directly. A disconnected bridge is a reported blocker, not permission
to bypass MCP.

Eligibility is exactly: `updatedAt > aiGeneratedAt`, or `aiGeneratedAt` is unset, or
`hasError: true` / `aiErrorCount > 0`. Intersect with optional `ids`, preserve document order,
then take at most `batch` entries. Report unchanged successful entries as skipped; do not
stamp them again. Report the remaining eligible IDs as the next batch, without scheduling it.

Read analysis comments with `caipGherkinGetComments`. Do not infer comment ownership from
`ReadDocuments` or `GetScenario` steps: those responses can include the next scenario's
leading comments in the previous scenario's final steps. Use the dedicated comment tool
before and after any comment write; do not repair that parser as part of this task.

For each selected scenario, preserve its exact ID, title, steps, metadata and comments in an
evidence snapshot held in memory during audit; persist it only when link mode or a separate
request authorizes writes. Resolve the most specific existing C4 owner with read tools where possible.
An unresolved C4 owner stays an explicit gap; never invent a node or use the root as a shortcut.

## 3. Establish three separate kinds of evidence

Search the workspace's code graph first, then read current source at the resolved locations;
stale graph spans require current file reads. Resolve generation strategy before any edits.
Read the actual branch and assertion, not just a citation or a matching test title.

| Kind | Required record | What it establishes |
| --- | --- | --- |
| Source evidence | file, symbol, branch/line, observable result and relevant scenario clause | Existing implementation correspondence (`implements`) |
| Assertion evidence | file, exact test case, exact assertion/line, tested fixture and relevant clause | What an existing test distinguishes (`verifies`) |
| Execution evidence | command, date, revision plus dirty-file hashes, exit status/counts and log artifact | Which tests actually ran against which source (`executed`) |

A dependency is only `may-impact`, not coverage. A parent's coverage never automatically
covers a child requirement. A source citation is not a test, a read assertion is not an
execution, and a passing mocked test does not prove the live process/UI. Preserve pre-existing
tests and others' uncommitted work. Do not manufacture RED evidence for tests that already
existed; label them as read, reverified, not run or environment-blocked, as appropriate.

Map every relevant implementing symbol and verifying assertion within the bounded scope.
A test proving only the opposite behavior belongs in observed behavior/difference evidence,
not `verifies` and not a new requirement citation. A mixed test can cite the clause it really
verifies only if its limits and contradicting assertions are separately recorded. No setup-only,
file-header or suite-wide stamping. Missing evidence in one scoped area is not global absence.

## 4. Classify honestly before linking

Report one evidence label per scenario, preserving additional gaps and differences separately:

- `contradictory`: concrete source or assertion disagrees with a clause; record both sides.
- `missing-implementation`: no implementing source was found in the inspected scope; name
  that scope and any areas still uninspected. Do not satisfy the text by writing code.
- `missing-test`: existing code corresponds to the requirement, but a discriminating assertion
  is absent or only partial. Keep this gap explicit; do not add tests in this invocation.
- `unverified`: evidence cannot establish correspondence, or required execution/environment
  checks have not been completed. Record why, including tool or ownership gaps.
- `implemented`: concrete source correspondence and verifying assertions are established,
  with the required checks completed. State exactly what was executed and its limits.

These labels describe the evidence reviewed, not the outcome of an implementation pass.
In audit mode, return them only in the report. In authorized link mode they may be persisted:
Evidence labels belong in comments or the ledger, never in pipeline metadata.
Even `implemented` does not authorize marking the product successful or clearing existing errors.

Source correspondence is required even when tests exist. Never make a recovered requirement
look implemented by citing an unrelated test. Missing tests can be addressed in a later task;
they do not authorize inventing source correspondence or changing product behavior here.

## 5. Reconcile only in link mode

Before any edit, snapshot the affected file or MCP state; retain a reviewable patch and hashes.
Respect NoOverwrite/Merge/Inject boundaries and retain every generation marker. On real
implementing members and verifying cases, use only canonical `§REQ:<id>` citations in the
appropriate member comments. Explicit evidence reconciliation permits adding missing
retrospective citations and correcting or removing a proven wrong citation: record the old
marker, the contrary evidence, the reason and the snapshot. Preserve unrelated markers.

Persist available native requirement relations through MCP, with the evidence and rationale:
`traces` to real prerequisite/origin IDs, verified existing C4 links, and analysis comments
with document path and section. Do not fabricate IDs, relationships or unsupported metadata
fields. Keep evidence that cannot be represented natively in a small linked ledger, not an
alternate authoritative requirement database. Do not rewrite scenario text in this mode.

Read before writes, write sequentially, and re-read through MCP after each mutation. If a tool
reports a change applied but save failed, stop all further writes to that document. Preserve
the response and snapshot, report a partial-save blocker, and compare authoritative state
after recovery before retrying. Never blindly overwrite or recreate newly minted IDs.

In audit and link modes, preserve all pipeline metadata unchanged:
`aiStartedAt`, `aiEndedAt`, `aiRevisionCount`, `aiGeneratedAt`,
`errorMessage`, `aiErrorCount`, `aiErrorTotal`, and any schema error flag such as `hasError`.
Never increment, reset or clear pipeline metadata during reconciliation.
The Requirement Processing Loop's start/end/revision and success/failure stamps belong to
verification/implementation passes; evidence reconciliation does not enter that cycle.
Even start/end timestamps alone can change derived implementation status. Preserve real
pre-existing errors, successful stamps and counters rather than interpreting audit labels
as product success, failure or escalation.
Only a separately authorized verification or implementation pass may decide product outcomes.

Never manually write `createdAt` or `updatedAt`.
Report native metadata changes caused automatically by MCP relationship/comment mutations
using before/after reads; do not fabricate timestamps, manually compensate for native changes,
or use a relationship mutation to force eligibility. If a tool unexpectedly changes pipeline
metadata, stop affected writes and report the difference instead of treating it as authorized.
Never touch skipped or merely consulted scenarios.

Operational errors belong in logs; stop the affected writes and report what failed.
Do not repurpose product outcome fields for tool failures or partial saves, and do not attest
that a failed write succeeded. Link mode may record attempt details in the evidence ledger;
audit mode returns them in the response only. Preserve the MCP response and pre-write snapshot
for review without stamping a product attempt.

## 6. Verify and hand back the bounded result

In link mode, verify the delta respects the authorized citation/relationship/comment scope,
validate changed Gherkin through MCP and run the project's scoped traceability checks. Use
existing targeted tests and required repository checks as appropriate; log the actual result.
Do not call a citation, a test title or an old green run proof of current execution. Never
reload VS Code or restart the extension host. Live checks remain distinct from unit checks.

Return a compact report: ID, evidence label, source evidence, assertion evidence, execution evidence,
observed differences, scope limits, links changed and any native metadata changes. In link mode,
the report may also be saved as the evidence ledger with snapshot, patch and log paths.
Audit reports use available evidence locations without creating artifacts. Include unresolved
C4 ownership, skipped IDs and the next eligible batch. Report
partial completion explicitly. The App Hosts pilot is the selected `aspire-app-host-view`
document (41 existing scenarios), not permission to reconcile the entire requirements catalog.
