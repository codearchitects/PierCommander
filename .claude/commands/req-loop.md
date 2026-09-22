---
description: Autonomous end-to-end implementation loop for one Gherkin requirement on ANY stack — no codegen, no CAEP scaffolding. RED-first tests, implementation, per-target build+test verification from the workspace's declared targets, bounded retries, BLOCKED report. Drives a whole queue with --queue, batched per feature; packs of up to 4 affine requirements share one implement pass. The universal-profile twin of /req-loop: CAIP projects keep using req-loop.md.
argument-hint: <scenario-id> [documentId=<doc>] | [--parallel[=N]] --queue <file> | --interactive | --help
---

# /req-loop-universal — autonomous requirement implementation, any stack

> **Universal profile.** This is the stack-neutral twin of `/req-loop`, for workspaces running
> with `caep.profile: 'universal'` — a Java service, a Swift app, a Python worker, anything with
> a Gherkin requirements ledger and a test command. It keeps the whole discipline of the CAIP
> loop — the metadata contract, the RED gate, the citation law, the attribution rules, the
> honesty rules, the doctor — and drops everything that presupposes the CAEP stack: no codegen,
> no scaffold, no EF migrations, no Angular/Aspire/browser machinery. There is no Architect
> agent — but there IS a **model lane**: a requirement whose subject is the ARCHITECTURE
> (steps anchored to C4 nodes, demanding structure) is implemented in the model through the
> modeler tools, with its own Definition of Done (Stage 4M).
> **A CAIP workspace keeps using `req-loop.md`; this file never replaces it there.**
> Where the workspace carries the `caip-req` skill, its stamping rules still take precedence;
> otherwise the tables in Stages 3 and 8 below ARE the contract.

Implement one Gherkin requirement end to end. Arguments: `$ARGUMENTS`

**Parse the arguments yourself — never rely on positional placeholders.** They have been observed
substituting the WRONG token, silently aiming the run at the wrong requirement — the most
expensive mistake this command can make. Read `$ARGUMENTS` as a whitespace-separated list and
classify each token by **shape, never by position**:

- `--help` → print the **Help page** below and STOP. It outranks every other token and leaves
  zero footprint: no run opened, no stamp written, not even an MCP call;
- `--interactive` → build the run by asking (see **Interactive mode**), then proceed as if the
  answers had been arguments. Tokens alongside it become question defaults, not errors;
- a leading `--parallel` or `--parallel=N` → parallel mode requested; only BEFORE `--queue`;
- `--queue` → batch run; **everything after it, spaces included, is the queue path**;
- `documentId=…` → the selector; the remaining bare token → the scenario id.

Empty arguments → Interactive mode. A scenario id expected but not identifiable → **stop and
ask**. Never guess, never take the first token. `--parallel` without a batch is an error.

**If the arguments contain `--queue`, jump to "Batch mode" below, then come back here for each
requirement.**

## Help page — `--help`

Print this block verbatim (fill the placeholders from the live session), then STOP.

```
/req-loop-universal — autonomous requirement implementation (any stack)

USAGE
  /req-loop-universal <scenario-id> [documentId=<doc>]      one requirement, end to end
  /req-loop-universal [--parallel[=N]] --queue <file>       a batch, from a queue the IDE wrote
  /req-loop-universal --interactive                         build the run by answering questions
  /req-loop-universal --help                                this page (writes nothing, runs nothing)

WHAT A RUN DOES (stages — numbering matches req-loop.md; 7 is deliberately absent)
  0 preflight → 1 intake (decides the LANE) → 1E charter conversation, when nothing is
  declared yet → 3 open stamp → 2 read-only context →
  4 RED-first implement, or 4M the model lane (structure via the modeler tools) →
  5 verify (per-target build + test from the declared commands — or the model-lane DoD) →
  6 repair (cap 5) → 8 close stamp — or 9 BLOCKED report instead of guessing.

THE DEFINITION OF DONE
  Every target this run touched must build AND test green, by the commands the WORKSPACE
  declares — on the owning C4 container's targetProfile first, .caep/targets.json as the
  fallback — not by commands remembered or invented. Nothing declared yet is settled by
  Stage 1E and recorded, never survived; a declared command that cannot RUN is a block. A MODEL-LANE requirement
  (steps anchored to C4 nodes, demanding structure) proves done in the MODEL instead:
  demanded structure present and quoted, validation delta clean (Stage 4M).

WHAT IT WRITES
  Requirement metadata via the caipGherkin tools; code and tests with §REQ:<id> citations —
  or, in the model lane, C4 structure via the caipC4Modeler tools (add-and-rewire, never
  delete a node); BLOCKED-<id>.md at the repo root when blocked.

THIS SESSION
  model: <your model id> · caip MCP servers: <registered / NOT registered>
```

## Interactive mode — `--interactive`

Build the run by asking — `AskUserQuestion` where available, plain questions otherwise — one
round, few questions, concrete options. Nothing is written until the intake is resolved. Ask, in
order, skipping what is known: **scope** (one requirement · one feature's waiting requirements ·
the workspace's — "waiting" is `aiEnabled` true AND never elaborated, or `updatedAt` later than
`aiEndedAt`, or in error; derive it with `caipGherkinListDocuments` +
`caipGherkinFilterByMetadata`, never by grepping mirrors); **which one(s)** (id + document when
ambiguous, Stage 1 style); **parallelism** (only when ≥2 features; serial is the default, and a
feature with no `@c4-id` stays serial against everything — no evidence of independence is not
independence). Then echo the equivalent direct invocation and proceed — several requirements →
Batch mode, slicing by feature exactly as a queue run would.

---

## The Definition of Done — the declared commands

The CAIP loop proves "done" with the stack it generated. This loop cannot know your stack, so
**the workspace declares it**. It is declared in ONE of two places, and they are read in this
order:

1. **The container's target profile — the primary source wherever the workspace has a model.**
   A deployable unit declares `targetProfile` on its own C4 container: `platform`, `language`,
   `framework`, `cwd` (workspace-relative directory the commands run in) and the `build` /
   `test` / `run` commands. The unit's name IS the target's name in the reports. This is where
   a model-first workspace keeps its truth: the architecture and the commands that prove it
   live on the same node, and neither can drift from the other.
2. **`.caep/targets.json` at the repo root — the fallback**, for workspaces with no model, or
   for units the model does not describe. When both exist for the same unit, the container
   wins and the divergence is reported.

The file's shape, unchanged:

```json
{
  "targets": [
    { "name": "api",    "build": "./gradlew assemble", "test": "./gradlew test" },
    { "name": "worker", "build": "python -m compileall src", "test": "pytest -q", "run": "python -m worker" }
  ]
}
```

- `name` — a label the reports use; `build` and `test` — the commands of truth, run from the
  repo root, judged **by exit code**; `run` — optional, never a verification gate here.
- **Every target this run touched must end the run with `build` and `test` at exit 0**, real
  output quoted in the closing report. Which targets were touched is decided by the files the
  run wrote (map each written path to the target that owns it; when the mapping is unclear, the
  honest answer is every plausible owner).
- **A missing contract is settled, not survived.** No declared commands in either place for a
  touched unit — no `targetProfile` on its container AND no `.caep/targets.json` entry, or an
  entry with no runnable `test` — sends the run to **Stage 1E**, which declares them and says
  so. What is never negotiable is running them: a unit whose declared `test` command cannot
  be RUN (a dead runner, a refused write, a tool that is not there) is a real
  `infrastructure` block, and that one is doctor material.
- **Read the container, don't reconstruct it.** The target profile is read through the
  `caipC4Modeler*` read tools like any other node property — never by grepping the model's
  YAML, and never inferred from a directory listing that looks like a familiar stack.

## Stage budgets — every stage is bounded, none may hang

| Stage | Budget | Mechanism |
|---|---|---|
| 0 preflight | 2 min | direct `Bash` / MCP calls |
| 1 intake | 5 min | MCP calls |
| 1E charter | one round of questions; 5 min to record | `AskUserQuestion` + MCP calls |
| 2 context (read-only) | 5 min | MCP calls |
| 4 implement | 20 min per sub-agent (one PACK in batch mode) | delegation tool, foreground |
| 5 verify | one bounded foreground call per target's build, one per its test | `Bash` with `timeout` |
| 6 each repair pass | inherits 5 | — |

- `Bash` caps at `timeout: 600000` (10 min). **A target whose test command runs longer is split
  by whatever its runner offers** (a module filter, a project path) into calls that each fit the
  cap — and each call is made in the FOREGROUND: the wait IS the call.
- **Headless sessions never end a turn with a stage open.** A run started from the IDE is
  headless: it ends the instant a turn ends with nothing pending, and its `Monitor`s and
  background tasks die with it. The only wait is a blocking tool call. If a turn ends anyway
  with the run open, the IDE re-invokes the SAME session (`caep.ai.reqLoop.autoResume`): treat
  it as the Resume Protocol in the same session — continue the open stage, do not re-intake.
- **The same rule for delegates:** an `Agent` call whose result the loop needs is FOREGROUND and
  awaited — never `run_in_background`, never "I'll report when the notification arrives". A
  report reading "sub-delegated … waiting for the nested agent" is a failed pass, not a result.
- A stage that blows its budget is not retried blindly: kill it, record the partial output,
  Stage 9 with cause `infrastructure` — never Stage 6.
- Report the heartbeat as it arrives. Never sit silent through a long stage.

## Models — start cheap, escalate on evidence

The launcher chose YOUR model by the ladder the ring uses (clean requirement → base tier, each
genuine prior failure buys a rung). Do not fight it. Delegations climb per phase: a phase's
first attempt runs on the cheapest plausible tier, and **a concrete failure of that phase buys
the next rung for its retry** — "it feels hard" buys nothing. Two rungs climbed without a
verdict → stop climbing; the close stamp's `aiErrorCount` bump IS the escalation. Repair is the
exception that starts HIGH: diagnosis is the densest reasoning in the loop — never delegate it
below your own tier. A workspace can remap everything via `.caep/agent-matrix.json`
(`caep.ai.agentMatrix` fills the gaps); when a report names a model, read it from what was
actually provisioned, not from this document. Report the model of every attempt in the
telemetry: a retried phase is a new iteration of the same step name.

## Batch mode — `--queue <file>`

Everything after `--queue` is the absolute path of a JSON queue written by the extension. Group
it by `documentId` yourself, first-appearance order; a **slice** is every queued requirement of
one `.feature`. The stages that are about the feature run once per slice; the ones about the
requirement stay per requirement:

| Stage | Runs once per | Why |
|---|---|---|
| 0 preflight, concurrency check | **run** | it is about the tree, not the work |
| 1 intake | **requirement** | own metadata, counters, brief |
| 3 open stamp | **requirement** — all before the slice's Stage 2 | the stamp is what fends off the ring |
| 2 read-only context | **slice** | one orientation read serves everyone |
| 4 RED + implement | **pack** — up to 4 affine requirements, fresh sub-agent | one read of feature + code serves every member; RED and citations stay per requirement |
| 5 verify | each requirement's own tests inside its pack; the **full touched-target sweep once per slice** | the sweep dominates the wall clock |
| 6 repair | **slice**, cap 5 | one budget for the slice |
| 8 close stamp | **requirement** | outcomes differ; the counters have no `+1` |
| 9 BLOCKED | per requirement — `infrastructure` stops everything | it would fail every remaining one identically |

Never batch **across** slices. A `packs`-less plan is not a prohibition: chunk each slice's ids
in document order, at most 4 per pack, splitting where existing `§REQ:` citations show disjoint
code areas.

**Packs.** One sub-agent works the members in document order, sharing one read of the feature
and the code — sharing the pass, never the evidence: per member, its own tests RED-gated, its
own `§REQ:<id>` citations, its own targeted run, and **one explicit verdict line**
(`<id>: ok | failed <why>`). A pack pass that ends WITHOUT per-member verdicts (timeout, crash)
is an infrastructure outcome of the PASS, not of its members: re-run them one by one — never
stamp a requirement red because its pack died around it. Split before you time out; a demotion
is never a failure.

**The batch rules**, verbatim in spirit from the CAIP loop:

1. **One pack at a time, in slice order; one slice at a time** — the tree, the build outputs and
   the test runners are shared. Parallel mode relaxes exactly the across-slice half, via
   worktrees, and nothing else.
2. **A fresh sub-agent per pack.** The driver keeps what the slice shares (Stages 0–3); the
   brief is self-contained: read `.claude/commands/req-loop-universal.md`, execute Stage 4 for
   `<id₁>, <id₂>, …` (all with `documentId=<doc>`), work them in one pass, close each with its
   own verdict line and RED evidence. Where the sub-agent cannot delegate further, it does
   Stage 4 itself.
3. **Pass `documentId` verbatim** — ids are not unique across documents, and the ambiguity stop
   would halt a queue nobody is watching.
4. **Attribution: one sweep, so name who broke it.** Every new red walks back to a requirement
   through the `§REQ:<id>` in the failing test's doc. Attributed inside the slice → only that
   requirement is red. Attributed outside → that requirement is a **victim**: its own red, its
   `aiGeneratedAt` cleared, named in the report. Un-attributable (uncited test) → fail-closed
   over the whole slice, quoting the test that could not be attributed. Before the collective
   verdict, spend one bisect: re-run the failing target alone and read the citations.
5. **The repair budget belongs to the slice** — cap 5 passes total; when exhausted, attribute
   what is still red, never blame collectively.
6. **A failure does not stop the queue** — its own Stage 8/9 stamps it and the run moves on.
   Only an **infrastructure** block stops everything.
7. **Report as you go** — one line per requirement as it closes, one block per slice, a final
   table: id · outcome · what it left open.

## Parallel mode — `--parallel[=N]`

Opt-in concurrency **across slices**, each in its own git worktree, merged back and verified
under ONE battery. Fall back to serial — and say which reason fired — when: the plan is absent
or degraded (an interactive batch derives conflicts itself: same `@c4-id` ownership rules, and
no `@c4-id` = serial against everything); no wave is parallel; the working tree is dirty;
`git worktree list` shows `.caip-reqloop` leftovers (only the Resume Protocol's wave forensics
may reconcile those); a worktree cannot be prepared. The choreography, compressed — the CAIP
loop's serial lane does not exist here (there is no Architect and no regeneration):

1. Stamp Stages 1+3 for every member, Stage 2 per slice, in the main tree — then **commit the
   opening state** (`req-loop: open wave — <ids>`): every recovery below restores commits, and
   an uncommitted stamp reverted by a rollback re-opens the requirement to the ring mid-run.
2. Cut a worktree per slice (`git worktree add ../.caip-reqloop/<slug> -b
   req-loop/<slug>-<wave-stamp> HEAD`), one sub-agent per slice, up to N, cwd = its worktree,
   **file and shell tools only** — no `caipGherkin*`/`caipVscode*` mutations from a worktree:
   the MCP layer operates on the MAIN workspace. It commits per requirement on its branch
   (`§REQ:<id>` in the message).
3. Merge serially (`git merge --no-ff`), recording the pre-merge SHA. Conflict → one bounded
   attempt on trivially disjoint hunks, else abort, slice closes red, branch KEPT, and the pair
   is **recorded** in `.caep/req-loop/learned-conflicts.json` so it never runs side by side
   again. Per-merge gate (10 min): the slice's touched targets' build+test; gate red → hard
   reset to the recorded SHA (safe ONLY because step 1 committed everything — verify
   `git status --porcelain` first), record the pair with `via: "gate: …"`.
4. **ONE full battery for the wave** — Stage 5 semantics over every touched target. Attribute
   by rule 4; when citations do not settle it, walk the wave's commits newest→oldest in a
   detached worktree re-running only the failing tests — the commit after the last passing
   state owns the red. Inconclusive → fail-closed on every slice the walk could not exonerate,
   never on the demonstrably clean ones.
5. Repair and stamps serial in the main tree; **cleanup always** — remove worktrees, delete
   merged branches, KEEP red slices' branches as evidence and list them for a human.

What parallel mode never changes: the stamping contract (driver-only, main tree only), the RED
gate, the never-weaken-a-test law, slice-internal seriality.

## Progress reporting — the IDE is watching

Bracket the run with the `caipPipeline*` tools; the extension observes your tool calls itself —
the `caipPipeline*` calls are for what observation cannot know: which stage you are in and how
it ended.

**OPEN THE RUN FIRST — before any other work.** `caipPipelineRunBegin` once per slice (per
requirement outside batch), `pipe: "req-loop"`, `feature:` the `.feature` path — **pass it every
time, resume included**, or the diary lands in the wrong place — `requirements:` every id
claimed, and `plan:` declaring every stage up front. The canonical step names, fixed here:
`preflight`, `intake`, `context`, `open-stamp`, `implement`, `verify`, `repair`, `close-stamp`,
`blocked` — `context`, `repair` and `blocked` carry `optional: true`. Opening the run costs one
pass and is the only insurance that survives your own budget running out.

`caipPipelineStepBegin`/`StepEnd` around each stage, named EXACTLY canonically (a decorated name
matches no plan row); per-requirement evidence goes in `detail:`. Sub-workflows (the members of
a pack, a fanned-out implement) are children: their own Begin/End with `parent:` set to the open
stage. **Telemetry is not optional**: `model` on every Begin and End; token counts copied
verbatim from every sub-agent result; a "—" is honest, a guessed number is not.
`caipPipelineRunPlan` when the declared shape stops being true — it REPLACES the plan wholesale.
`caipPipelineRunEnd` on **every** outcome; a run left open reads as running forever. Lost
`chainId` → `caipPipelineRunStatus`, never a second run (exception: an extension-host restart
loses the run for good — only then open a new one and disclose it).
`caipPipelineStepEvent` for what happens inside a stage, batched — findings, decisions,
anything done outside the observed tools. If the `caipPipeline*` family is genuinely
unavailable, carry on — the stamps are the contract, this is the view — but prove "unavailable"
first (load by name with `ToolSearch` on Claude Code) and say it loudly, first message and final
report.

## Resume Protocol — MANDATORY at every (re)start

Before Stage 0, determine whether you are RESUMING, and say so:

1. **Probe the ledger** — `caipPipelineRunStatus`. A run `launching: true` → the launcher's
   placeholder for this very session: adopt it. `running: true` → RESUME: reuse its `chainId`,
   never open a second run. No run but `aiStartedAt` set and `aiEndedAt` null → the view was
   lost (host restart): new run, same step names, disclose the split. Neither → `FRESH START`.
2. **Reconstruct** from the diary (`<feature>.ai.log.yaml`), the metadata (`errorMessage` is the
   brief), and `git status` on the areas the diary claims — a clean tree where changes should
   exist means the work was WIPED: recover from the scratchpad patches, do not re-elaborate.
3. **Sweep orphans**: kill test runs older than their stage budget, harvest finished results
   instead of re-running. **Wave forensics** whenever `.caip-reqloop` worktrees, `req-loop/*`
   branches or `MERGE_HEAD` exist: abort a half-finished merge FIRST; a branch whose slice's
   diary says implement closed ok and which is not merged is PARKED work — resume it at the
   merge step, do not redo its Stage 4; merged-but-unverified slices resume at the battery.
4. **Never redo a closed stage.** Trust the diary and the tree, not your memory.
5. **Report the resume once**, then continue silently forward.

## Stage 0 — Preflight: the tools must actually be there

Confirm, in this session, by loading — a listing is not proof:

1. `caipGherkin*` (server `caip-gherkin`) — required by Stages 1, 3, 8.
2. `caipPipeline*` (server `caip-vscode`) — required by the progress reporting.
3. the **delegation tool** — `Agent` on Claude Code, `agent` on Copilot or the CAIP Assistant —
   required by Stage 4's sub-agents (with a fallback: implement inline).
4. `caipC4Modeler*` / `caipGraph*` tools — the read side serves Stage 2 when the workspace
   has a model, and its absence just skips Stage 2; the WRITE side becomes REQUIRED the
   moment Stage 1 declares the model lane — absent then → Stage 9, cause `infrastructure`.

On Claude Code schemas are DEFERRED: load the families by name with `ToolSearch` (`select:` …)
before believing one is missing. On Copilot a missing family is usually the tool cap or the
per-workspace tool cache — the cure is **MCP: Reset Cached Tools**, never a window reload. After
one remedy, retry once. Family 1 still absent → STOP, Stage 9, cause `infrastructure`, saying
what the user must do. Family 2 absent → continue, loudly. Family 3 absent → Stage 4 falls back
inline; say so now.

**A budget-exhausted delegate is RESUMED, never restarted** — `continueFrom="<id>"` with a brief
saying what to do NEXT. One retry per step, then escalate; say the count out loud
(`RETRY: <step> leg 2 of 2`). And when a delegate returns, **verify the TREE, never the
delegate's word**: re-read what it claims it changed; a clean tree where changes should exist
means the work was wiped — re-apply from the patch, do not re-elaborate.

**Concurrency — one driver per tree, and exactly one.** The extension's dispatcher admits runs
via `.caep/req-loop/dispatch.lock.json`; your preflight is the last net for runs that bypassed
it. Look for another driver (lock pid alive and not yours, `pgrep -fl "claude -p /req-loop"` minus your own pid — never a chat that merely mentions req-loop,
foreign running `req-loop` chains in the ledger). Two drivers found → the tie-break is the
queue stamp: **the EARLIER continues, the later yields** — and the yielder hands its work back
first (`caipVscodeExecuteCommand` with `caep.req-queue-file` and its own queue path, or
`caep.req-queue-scenario` for a single requirement), then writes the one-paragraph BLOCKED
report naming who continues. Never "both yield", never "both continue". **The yielder's report
says WAIT — it never proposes a kill**: a driver whose window is gone is an orphan at work, not a
leftover (2026-09-10: a yielder's "let it exit, or `kill 6199`" cost a driver at slice 5 of 26);
only a process whose CPU time AND transcript have not moved across two samples ≥ 60 s apart may be
called "appears hung", and the kill stays with the human. Probe activity portably —
`find <dirs> -mmin -10 -type f`, never `-newermt "-10 minutes"`, which BSD `find` matches to
nothing and nothing reads as idleness. Hostile tree (another
session on different documents): snapshot every write immediately
(`git diff -- <area> > <scratchpad>/<req>-<area>.patch`, verify non-empty) before running
suites, and re-check the tree after every sub-agent returns and before Stage 8.

### The queue is a photograph — the tree is the fact

Your queue file was written when the work was PICKED, not when you were handed it, and between
those two instants requirements move: the run before you elaborated them, a hand-started driver
did, the author did. So **re-derive the work list from the live metadata at intake, before you
claim anything** — `caipGherkinGetScenario` per id, or `caipGherkinFilterByMetadata` per document
— and drop what is no longer eligible by the Select rule (`updatedAt` after `aiGeneratedAt`, or
`aiGeneratedAt` unset, or an error on the last attempt). Say in one line how many you dropped and
why; a queue whose `state` field disagrees with the metadata is the queue being stale, never the
metadata being wrong.

Observed 2026-09-11: a queue of 28 requirements in which 25 had been stamped forty minutes
earlier by the run that had just finished. The driver caught it at intake and re-verified instead
of re-scaffolding over working code — which is the behaviour this rule makes obligatory rather
than fortunate. The extension now drops them before composing too; the two nets are independent
on purpose, because a driver started by hand passes through neither dispatcher.

### The baseline is measured without fail-fast

A test command that stops at the first failure tells you about ONE red, and every delegate you
brief with that number will call a second pre-existing red a regression of its own making — or,
worse, absorb it. Measure the baseline with the whole suite: `cargo test --workspace
--no-fail-fast`, `npm test` with the runner's continue-on-failure flag, `dotnet test` per project.
Then brief the delegates with the FULL list of known reds.

Observed 2026-09-11: a driver briefed its packs with one known red because `cargo test` fails
fast; two delegates independently checked the slice base commit, found the second, and told it.
"Delta zero" was honest only because they did.

## Stage 1 — Intake: resolve the scenario, never guess it

Resolve the id with `caipGherkinGetScenario`. Ids are NOT unique across documents: on
`ambiguous across N documents`, use the `documentId=` selector or **stop and ask**, quoting the
candidates. Then, in order:

1. Read the scenario body **and its metadata verbatim** — `aiRevisionCount`, `aiErrorCount`,
   `aiErrorTotal`: Stage 8 writes explicit values back; there is no `+1`.
2. Read the `*.feature.ai.memory.md` beside the mirror and its ancestors — read-only.
3. Treat an existing `errorMessage` as your brief — you are continuing a cycle. **But first
   check whether the requirement moved**: `updatedAt` later than `aiEndedAt` means the text was
   rewritten after that verdict and the brief is STALE — re-read from scratch, say what changed,
   and expect the ring's gate to have re-opened: reach Stage 3 and stamp before it claims it.

   **A prior `infrastructure` block is RE-DERIVED, never re-affirmed.** That block was a
   statement about the ENVIRONMENT, and the environment moves without the requirement
   moving: a target profile completed, a contract written, a base scaffolded, these very
   rules updated since. Re-read the declaration sources and quote what is missing NOW —
   "unchanged, identical to the earlier report" is a claim about a world you did not look
   at, and it is how a workspace somebody just repaired gets told nothing has changed.
   An existing `BLOCKED-*.md` is evidence of the last reading, never a substitute for this
   one.
4. **Check the DoD contract now**, in the order the DoD declares: the owning container's
   `targetProfile` first (read it with the modeler tools — `cwd` and a runnable `test` are
   what matter), `.caep/targets.json` after. Neither → **Stage 1E**, the charter
   conversation, before any code is written — cheap now, expensive at Stage 5. A block is
   what Stage 1E falls back to, never what it starts with.
   **The contract is a CODE-lane demand**: a requirement step 7 assigns to the model lane
   alone needs no targets contract — a model-first workspace (all model, no code yet) runs
   its architecture requirements with no `.caep/targets.json` at all, and the
   missing-contract block fires only when a CODE-lane requirement is in the run. A missing
   entry for a unit whose base THIS run will scaffold (Stage 4, gate D) is not a block
   either: the baseline step writes the entry as part of the base.
5. Grep the existing `§REQ:<id>` citations for this id across the tree and record the count as
   the baseline.
6. **Then look for the FILES — never infer their absence from the citations.** A feature can be
   fully built and carry no marker at all (built by hand, or before this loop). Derive search
   terms from the feature name and the domain nouns (stemmed), search the tree, report what you
   found with sizes, and compare against a settled sibling of the same shape. "Searched
   <terms>, found nothing" is a finding; "no X exists" drawn from a citation count is the
   defect this step exists for.

   **The unit's home is declared, not discovered.** Where the owning container declares
   `targetProfile.cwd`, that directory IS the unit — search there, and its emptiness means
   the base is missing (gate D), never that the work belongs elsewhere. A codebase found
   OUTSIDE this workspace — a sibling repository, another checkout — is never adopted as the
   unit because its name matches: a same-named tree on ANOTHER stack is a look-alike, and
   pointing the run at it moves the work into a tree nobody authorized. Report it as a note
   and let the model's declaration decide.
7. **Decide which job this is, from the FILES**: no code, no citations → first implementation
   — and when the owning container declares a technology whose base is absent from the
   unit's directory, the first implementation BEGINS with the framework baseline (Stage 4,
   gate D); code and citations → re-verification (below); **code without citations → attribution and
   verification, not construction** — read the existing implementation, judge it against the
   steps, add the missing `§REQ:` markers, implement only what is genuinely absent, and never
   re-scaffold over it.

   And decide the **LANE, from the STEPS**: steps anchored to C4 nodes (`@c4-id:` on the
   steps or the feature header) demanding **structure** — which nodes exist, how requests
   route, what an element declares — observable in the MODEL and in no test command, make a
   **model-lane requirement**: Stage 4 happens in the modeler (Stage 4M) and Stage 5's DoD is
   the model itself. Steps demanding executable behaviour keep the code lane. A requirement
   demanding both runs the model lane FIRST, then the code lane, one open/close pair around
   both. Steps naming no observable of either kind → cause `decision`, never a guess — and
   never a code-lane "already green" verdict on a requirement whose demand no test could
   possibly observe.
8. **Write the open stamp NOW** — Stage 3, before Stage 2's reading. Only a Stage 0 tool block
   or the ambiguity stop leave a requirement unstamped.

**Re-entry — the requirement is already green.** `aiGeneratedAt` set and `updatedAt` not later
than `aiEndedAt` → this run is a **re-verification**: the RED gate does not apply (do NOT
manufacture a red or weaken a test to produce one); go to Stage 5 against the existing code; it
verifies → close green; it does not → genuine failure AND **clear `aiGeneratedAt`** — the
earlier green is disproven, and leaving it would mark as satisfied something you watched fail.

## Stage 1E — the charter conversation: decide, record, then proceed

A missing declaration is not always a broken machine. When what stands between the run and
the work is a DECISION nobody has taken — where this unit's code lives, how containers talk,
what the security and operational shape is — the loop does not file a block and wait: it
proposes, asks what it genuinely cannot know, records the answers where they will still be
true next month, and goes on. **A workspace should need a human once, not once per run.**

**What may be settled, and what must be asked — the line that decides everything here.**
Block only on what could produce a FALSE VERDICT or an IRREVERSIBLE ACT. Everything that is
merely undecided is settled by you, recorded, and announced. A folder in the wrong place is a
`git mv`; a green stamp on an unproven requirement is a lie that outlives the run.

| Class | What is in it | What you do — attended or not |
|---|---|---|
| **Settle** | the unit's home and folder layout · the `build`/`test`/`run` commands OF A DECLARED STACK (they follow from the framework, they are not invented) · scaffolding the base in the declared home · the dependency manifest that pins the declared version · **equipping** a unit that cannot run yet — a gateway, a worker, a service — with its `run`, `port` and `health` and the minimal config they need, derived from the model (the units it fronts, their ports) and from an installed expertise pack for its stack when there is one | apply it, record it, say it loudly in the report. Never block, never ask permission. The RED gate is what makes this safe: a command that runs nothing leaves the new test green at RED, and a test green at RED fails the gate. An equipped unit is PROVEN (started, health hit, stopped) before it is called settled. |
| **Ask** | interop technology across containers, when the model shows none · the security/authorization model, when nothing declares one · installing expertise packs (software on the machine) · anything the steps demand that no code and no model expresses | attended → ONE round of questions, each opening with your proposal. Unattended → take what the MODEL already shows; where it shows nothing AND the answer is load-bearing for this requirement, that is cause `decision` with the options named — not `infrastructure`. |

**Attended is a fact, not a mood**: a session with `AskUserQuestion` (or an interactive
equivalent) whose user has spoken in it is attended; an IDE-dispatched queue run is not. It
changes only the **Ask** row. The **Settle** row is done either way — an unattended run that
stops because nobody told it where to put a folder has converted a convention into a wall.

**The workspace is the only tree.** `targetProfile.cwd` is workspace-relative by definition,
so the unit is always inside this workspace. A same-named codebase in another repository or
another checkout is never the unit, is never proposed as "the intended target", and never
appears in a How-to-unblock: pointing a run at a tree it was not launched in is not an
unblock, it is a scope violation with extra steps. Note its existence once, as a fact, and
carry on here.

**Read before asking — an answer already given is never asked twice.** The model
(`targetProfile`, container families, interactions, `data.multitenancy`), the node's context
document (`caipC4NodeContextRead`, `inherited: true`), the profiles of siblings already
placed, and the existing `.feature` files hold most of it. Ask ONLY what none of them
answers, and open every question with the answer you would give: a proposal to accept or
correct, never a blank field. Questions are capped at FIVE and asked in ONE round.

| What you settle | The default you propose |
|---|---|
| **the unit's home** | `<kind>/<container-name-in-kebab-case>/` — ONE folder per container holding everything that unit needs: source, tests, dependency manifest, container file. A sibling already placed decides the shape instead. |
| **who writes the code** | this loop, here, at the declared version — naming what will be created, so "yes" is informed consent and not a shrug |
| **how containers talk** | the interop a sibling interaction already uses; otherwise the declared stack's least surprising choice, named WITH its artifact (REST + an OpenAPI document, gRPC + a proto, a broker + its topics) |
| **the cross-cutting shape** | what the model already says — multi-tenancy, sidecar, an authentication container, an observability target — restated as a proposal, plus the one gap it implies (an auth mechanism for a tenant-scoped API, say) |
| **expertise to install** | the craft pack for the declared stack when `.caep/expertise.json` carries none for it — named with its source and the commit SHA you would pin, proposed, **never installed without a yes** (the `caip-expertise` rule is the whole law: text only, provenance recorded, craft never overrules process) |

Silence, a dismissed prompt or an answer you cannot parse is a **NO to every open question**
and turns the run unattended from that point: file the block with the proposals below. A
half-applied charter is worse than none.

**Then record BEFORE acting — three surfaces, in this order:**

1. **The model — what is machine truth.** `targetProfile` (`cwd`, `build`, `test`, `run`,
   `platform`, `language`, `framework`) on every container the conversation settled, plus any
   — with the vocabulary the schema means: `platform` is the FAMILY the unit ships on
   (`headless` for a service, `web`, `mobile`, `desktop`, `cli`, `worker`), never the
   language; `language` is `python`/`typescript`/…; `framework` is `django`/`svelte`/…
   (`platform: python` is a language in the wrong field, and the Expertise view keys
   on the right ones) —
   structure it implied, written through the modeler tools under the Stage 4M discipline and
   saved. The commands must be the ones that will exist once the base is scaffolded — not
   aspirational, not remembered from another repo.
2. **The node's context document — the WHY.** `caipC4NodeContextWrite` (`mode: "append"`) on
   the container that owns the decision, or on the ancestor when it binds a whole subtree:
   what was decided, what was REJECTED and why, what the answer assumes. This is the memory
   that stops the next session asking again, and the only place a rejected option survives at
   all. A decision recorded nowhere will be re-litigated by whoever comes next.
3. **Gherkin — what must stay true.** Every answer that is a REQUIREMENT rather than a
   setting — a security rule, a tenancy guarantee, an interop contract, an availability
   promise — becomes a `@non-functional` scenario on the node that owns it, id minted, tags
   and comments per the requirements rule. An architectural intention nobody can verify is a
   promise, and this loop keeps only the promises it can test.

Only then does the run continue: gate D now has a declared home and a declared version, and
scaffolds the base there.

**Unattended — settle, record, proceed; report what you decided.** No conversation is
possible, so the **Settle** row is applied on your own judgement and the run continues: the
home, the commands, the base, the manifest, all three recordings made, and a
**Charter** section in the final report listing every decision with the evidence it was drawn
from — a reader must be able to overturn any of them in one gesture. Only an **Ask**-row
question that is load-bearing for this very requirement, and that the model does not already
answer, stops the run — cause `decision`, options named, never `infrastructure`.

**`infrastructure` is for broken machines, not for empty fields.** A missing declaration
that Stage 1E can settle is not an infrastructure block and never was; that cause belongs to
a dead runner, a refused write, a tool that is not there. Filing an undeclared workspace as
`infrastructure` is what sent three runs in a row to a doctor that had nothing to repair.

**What Stage 1E is never allowed to become:** a survey. It does not ask what it can read, it
does not ask the same thing twice across a queue (settle it once for the workspace, and per
unit only what is genuinely per unit), it does not ask a question whose answer changes
nothing it is about to do, and it never asks for permission to keep its own discipline — the
RED gate, the citation law and the stamps are not negotiable and are not on the table.

## Stage 2 — Read-only context (optional)

If the workspace has a C4 model and the feature carries `@c4-id`, spend one bounded read for
orientation: the owning node, its neighbours, the blast radius
(`caipC4ModelerGetActiveLevelDiagram`, `caipGraphGetGraphContext`, `caipGraphGetImpactArea`) —
it tells the implement pass where the code lives and which targets a change will touch.

**The declared shapes are not decoration — read them before inventing entities.** A container
whose subtree carries contracts, DTOs, data definitions or mappings (`caipGraphGetGraphChildren`
on the container, then `caipC4ModelerGetNodesInfo` on what it returns) has already had its data
shapes decided: those names, those fields, those relations are the ones the implementation
must carry, and a shape the model declares is never re-invented under a different name from
the prose of a step. Fifty declared contracts and twelve hand-invented entities is not an
implementation of that container, it is a parallel one. What the steps demand and the model
does not declare is a genuine gap: implement it and SAY so in the report, so the shape can be
modelled after the fact instead of silently diverging.

**The code lane never writes the model** — orientation only; there is no Architect hand-off,
no gap list, no regeneration. The MODEL LANE does write it, in Stage 4M, and with it the
`model` cause returns to this command's vocabulary (Stage 9). A requirement whose steps imply
a product decision nobody has taken (a mechanism no code and no model expresses anywhere) is
cause `decision` — ask when attended (`AskUserQuestion`), name the options in the report when
not; never resolve it by picking one. A stale or absent model is a note in the report for the
code lane — and an `infrastructure` block for the model lane, which cannot work without one.

## Stage 3 — Open stamp (the START of the AI cycle)

`caipGherkinSetMetadata`: `set: { aiStartedAt: "now", errorMessage: null }`.

One half of a **pair**: every cycle that opens with `aiStartedAt` closes with `aiEndedAt` at
Stage 8, on every outcome — a scenario with `aiStartedAt` set and `aiEndedAt` null looks
in-flight forever. **Never set `createdAt` / `updatedAt`**: a fresh `updatedAt` reads as "the
author rewrote it", re-opens the ring's gate, and feeds the loop its own tail.

## Stage 4 — RED first, then the code

Delegate a pack to a fresh sub-agent (Batch rule 2) with a self-contained brief — the
provisioned **`universal-developer`** agent where the delegation tool can target agents by
name, a generic sub-agent otherwise; inline when no delegation tool exists. When the pack's members land in disjoint targets with disjoint write
scopes, the halves may run concurrently — both delegations in one message, both awaited; what
is forbidden is a delegate nobody awaits, never two awaited together. Verdict-bearing suites
belong to Stage 5, after the join; a half's own targeted tests are its cheap gate.

**Two gates before writing anything:**

- **A — the authority gate.** Name what this fix must change. Anything outside what you may
  edit (a vendored tree, a protected path, a system outside the repo) → Stage 9, cause
  `infrastructure`, now — Stage 5 has exactly one verdict for a red suite and it is *the
  requirement's fault*; reaching it with a fix you were never allowed to apply walks an
  innocent requirement toward give-up.
- **B — the negative-assertion pre-check.** About to ADD something? Grep the guard tests of the
  targets you will touch for assertions that FORBID exactly that, naming the same artifact. One
  found, belonging to a **different** requirement → cause `contradiction`, both assertions
  quoted with file:line and `§REQ:` ids. One minute of grep against meeting it later as a red
  you will read as your own regression.
- **C — the pilot, whenever the edit repeats** over N similar elements: apply to ONE, run the
  targeted tests, compare the delta against the prediction; only on a match apply the N−1.
- **D — the baseline gate.** A first implementation landing in a deployable unit whose
  declared technology (the container's target profile — `targetProfile.*`, or
  `target.framework` + `target.version`) has no recognizable project base in the unit's
  directory scaffolds the base FIRST: the stack's official scaffolder, at the DECLARED
  version, pinned in the stack's own manifest (requirements/pyproject, pubspec, csproj,
  package.json); the base created in the declared `cwd` — never in a directory chosen by
  the run; the unit's `build`/`test`/`run` declared in the same step (on the container's
  `targetProfile` where the workspace has a model, in `.caep/targets.json` otherwise) — a
  base born without its contract re-creates the Stage 1.4 block one run later; the fresh
  base proven by its real test command before the first RED test is written.

  **A base also declares what nobody should see.** Its dependency and build trees — a
  virtualenv, `node_modules`, a build directory — are ignored in the stack's own ignore
  file AND excluded in the workspace's `.vscode/settings.json` (`files.exclude`,
  `search.exclude`, `files.watcherExclude`). Git ignoring them is not enough: one Django
  service put eleven thousand virtualenv files into an explorer, a search index and a file
  watcher that had a hundred real ones to show. Add the entries, never rewrite the maps —
  another container's exclusions are already in there. Scaffolding over an existing base is forbidden (step 7's attribution rule owns
  that case), and a version mismatch against an existing base is counsel, never a silent
  upgrade.

Then, per member, in document order:

1. Write tests covering **only this scenario**, each test's doc citing `§REQ:<id>`. An uncited
   red is un-attributable and, fail-closed, blames the requirement you are implementing. The
   one-hop rule: never add an id by inference from the model's relations. **A citation already
   in the file is not yours to delete** — if your work makes the test prove your requirement
   too, ADD your id beside the existing one (`§REQ:A, §REQ:B`); removing an id is legitimate
   only when the test genuinely no longer proves it, said explicitly in the report.
2. **RED gate**: run the new tests before the production code exists and show they fail for the
   intended reason — quote the failing ids. A test green at RED tests nothing. (Not applicable
   on a re-verification run; say so.)
3. Implement, citing `§REQ:<id>` **as you write** — never retroactively.
4. **Citation integrity gate** — no edit of this pass may make a `§REQ:` id DISAPPEAR from a
   file it touched:

   ```bash
   git diff -U0 -- <touched files> | grep -oE '^-.*§REQ:[A-Z0-9-]+' | grep -oE '§REQ:[A-Z0-9-]+' | sort -u > /tmp/req-gone
   git diff -U0 -- <touched files> | grep -oE '^\+.*§REQ:[A-Z0-9-]+' | grep -oE '§REQ:[A-Z0-9-]+' | sort -u > /tmp/req-kept
   comm -23 /tmp/req-gone /tmp/req-kept   # anything here is a citation you destroyed
   ```

   Non-empty output blocks the pack like a failing test: restore the id, keeping yours beside
   it.

## Stage 4M — the model lane: the structure IS the implementation

For a model-lane requirement the edit happens in the C4 model, through the `caipC4Modeler*`
tools — never by touching the model's YAML files directly. Delegate the lane to the
provisioned **`universal-architect`** agent where the delegation tool can target agents by
name (its mandate IS this discipline; you still own the stamps and the verdict); inline
otherwise. The discipline mirrors the code lane's:

1. **Read before writing.** Resolve every `@c4-id` anchor to a live node
   (`caipC4ModelerGetNodesInfo`); an anchor resolving to nothing is the model-lane RED —
   quote it. Read the structure you are about to change and quote it in the report (the
   "before").
2. **Add-and-rewire, never demolition.** Create missing nodes, update properties, REWIRE
   interactions when the requirement demands the routing (replacing a direct edge with a
   routed one is rewiring, not deletion) — but never delete a NODE, and never ORPHAN one:
   dropping a node from its parent's `children` is demolition under another name. A node the
   requirement makes obsolete is reported, not removed; a node for the same concept that
   already exists (orphaned included) is reattached and retyped, never duplicated. **Prefer
   the specific family over the abstract one** (mobile-application, web-application,
   database, gateway, message-bus … — the abstract types are the fallback, and the type IS
   architecture information). Batch related updates in one `caipC4ModelerUpdateNodes` call
   where possible, and repair by node ID after a fresh read, never by name.
3. **Re-read the validation after every write.** A result carrying "write introduced N
   validation errors" is a red of this lane: repair it here before moving on. A transient
   "Node with id … not found" on a node created moments ago is a KNOWN read-after-write gap:
   retry the IDENTICAL call once before believing it.
4. **Save** (`caipC4ModelerSave`) once the structure is complete — unsaved model writes are
   this lane's dirty tree.

**The model-lane Definition of Done** (its Stage 5): re-read the touched nodes and QUOTE the
resulting structure — the demanded routing and attributes are actually there; the scope's
`caipC4ModelerGetValidationIssues` shows **no NEW errors** against the pre-edit reading
(warnings tolerated — the universal mode keeps option-lists advisory); every step anchor
resolves. A model-lane-only run touches no code target, and the `.caep/targets.json` sweep is
then legitimately skipped — said out loud ("model lane only: no code targets touched"). When
both lanes ran, BOTH DoDs gate the green.

Blocked in this lane — write tools missing, writes refused, validation errors the
add-and-rewire discipline cannot resolve — is **cause `model`**: machine-read like the
others, and doctor material when the cause is the modeler infrastructure rather than the
model's content.

**The counsel flows through.** The lane's specialist owes one bounded advisory look after
the work (its mandate caps and shapes it: observation → why → what I would do → trade-off;
advice is never a write, never blocks, declined advice is not repeated). YOU relay it:
attended run → ask the user (one round, concrete options — "is the direct exposure intended,
or is a gateway wanted?"); unattended → a **Recommendations** section in the final report,
verbatim from the specialist. A recommendation is never a verdict and never a stamp.

## Stage 5 — Verify: the touched targets, whole

Per requirement, inside its pack: its own tests, targeted. Per slice, once, after the last
pack: **every touched target's `build`, then `test`, from its declared commands** — foreground,
bounded, exit code is the verdict, real output quoted. Partial verification is not
verification; the two honest exceptions (nothing was written; the machine is under load —
quiesce first or declare the suite not run) must be stated, never taken silently.

- **The commands come from the contract, never from memory.** A script name remembered from
  another repo, or from this file, is how a suite reports green while running nothing. Read
  the container's `targetProfile` (then `.caep/targets.json`), and run each command in the
  declared `cwd`; a touched unit with no declared `test` at this point is Stage 1E arriving
  late — settle it there and say so, rather than judging the requirement by a command
  nobody declared.
- **Known red debt: only the delta is yours.** Capture each touched target's test result BEFORE
  your first edit (Stage 4 opens with it when Stage 1 could not), compare after, and say
  explicitly the comparison is against that hand-taken reading. A sweep of "83 failed of 1376"
  says nothing on its own; the question is which of those were green before this run.
- **Quiesce rule**: suites measured under load LIE, in both directions. Never judge a red — or
  a green — measured while another sweep or the app stack runs; re-run the failing target
  **alone** before believing it.
- Attribute every new red through the `§REQ:` in the failing test's doc — Batch rule 4;
  **victims** (other requirements whose tests you broke) get their own red and their
  `aiGeneratedAt` cleared, said in the report.
- Re-grep this run's `§REQ:<id>` citations and compare against the Stage 1 baseline: the new
  tests and code carry them, and nothing existing lost one (the Stage 4 gate proved it per
  pack; this is the slice-level re-check).

**What licenses the green stamp, without a browser stage.** There is no Stage 7 here — that
machinery is CAIP's. `aiGeneratedAt` is licensed by the conjunction the RED gate makes honest:
the requirement's OWN tests were watched failing for the intended reason and now pass, inside a
touched-target sweep that is green by the declared commands. The RED gate is what makes the
test an observation of the behaviour rather than a tautology — which is why weakening it is the
one unrecoverable failure mode, and why a re-verification (no RED possible) that cannot
otherwise observe the behaviour closes with `aiEndedAt` only and says "re-verified by suite,
not re-observed". When a target declares a `run` command and the acceptance steps name
externally observable behaviour, a bounded smoke through it is worth its minutes — as report
evidence, never as the gate. **For a model-lane requirement the license is Stage 4M's DoD** —
the demanded structure present and quoted with a clean validation delta; the test suite has
nothing to observe there, and a green suite licenses nothing about the model.

## Stage 6 — Repair loop, capped at 5

Classify (compile / assertion / runtime) → failing test → scenario → fix → re-run targeted,
then the touched targets. Each pass starts from the previous report. **Cap: 5 passes per
slice**; then stop and report — attribute what is still red, never blame collectively.

**Never disable, delete, weaken or skip a test to reach green** — the one unrecoverable failure
mode: it converts a red suite into a false green with a passing stamp. The one narrow
exception — two guard tests provably mutually exclusive, each traced to a **different** `§REQ:`
id, with a demonstration that satisfying one breaks the other — is **not yours to resolve**:
Stage 9, cause `contradiction`, both quoted; deciding which requirement's guard encodes the
defect is a specification judgement. Infrastructure failures (runner crash, timeout, port
conflict) consume no pass and do not count against the requirement — Stage 9, cause
`infrastructure`.

## Stage 8 — Close stamp (the END of the AI cycle) — mandatory on BOTH outcomes

Write back explicit values from the counters read at Stage 1. `aiRevisionCount` always +1.
**`aiEndedAt: "now"` on EVERY row.** `aiGeneratedAt` is a different thing: `aiEndedAt` says the
cycle stopped, `aiGeneratedAt` says the requirement is satisfied — only green sets both.

**Who answered — `aiProvider` + `aiModel`, on EVERY row, in the same closing write.** Name the
provider (`"anthropic"`, `"openai"`, `"ollama"`…) and the exact model id your runtime DECLARES to
you; when the work was delegated, name the model that served the implement pass, not the driver.
Never guess and never inherit the previous cycle's value: when no model is declared, omit both and
the tool records `null`. `caipGherkinSetMetadata` itself logs every close to the requirement's change
log as `AI:<provider>/<model>` with outcome and revision — do not append that entry by hand.

| Outcome | `aiEndedAt` | `aiGeneratedAt` | `errorMessage` | `aiErrorCount` | `aiErrorTotal` |
|---|---|---|---|---|---|
| green — the lane's DoD holds (code: RED-gated tests inside a green sweep · model: demanded structure present, validation delta clean) | `"now"` | `"now"` | `null` | **0** | unchanged |
| genuine failure (bad impl, red suite) | `"now"` | untouched | `"<verify/implement>: …"` | prev + 1 | prev + 1 |
| **was green, now disproven** (re-verification failed) | `"now"` | **`null` — CLEAR it** | `"<verify>: …"` | prev + 1 | prev + 1 |
| infrastructure (missing contract, dead runner, budget blown) | `"now"` | untouched | `"<infrastructure>: …"` | **prev — unchanged** | prev + 1 |
| contradictory specification (gate B, Stage 6 exception) | `"now"` | untouched | `"<contradiction>: …"` | **prev — unchanged** | prev + 1 |
| needs a product decision, not code | `"now"` | untouched | `"<decision>: …"` | **prev — unchanged** | prev + 1 |
| model lane blocked (tools, refused writes, unresolvable validation) | `"now"` | untouched | `"<model>: …"` | **prev — unchanged** | prev + 1 |

`aiErrorCount` escalates the model and walks toward give-up, so it moves **only when the
requirement itself is at fault**. **Escalate authority, not the model**, on the last four
rows: a bigger model reaches the same wall — name what you need (a contract written, a person
to arbitrate, a decision taken) and stop. A failed pass is never a successful elaboration, and
"untouched" assumes it was never set — a disproven green is CLEARED, and said.

Stamp every claimed scenario, one call each — the counters have no `+1`, so a value read for
one is wrong for the next — **then save all**: Gherkin writes stay dirty until saved.

## Stage 9 — BLOCKED report, instead of guessing

Write `BLOCKED-<scenario-id>.md` at the repo root: **Scenario** (id, document, owning node when
known) · **Cause** — one of `infrastructure` / `budget` / `contradiction` / `decision` /
`model` (the model lane's own block — Stage 4M), with
the evidence verbatim (the tool error, the missing `.caep/targets.json` entry, the killed stage
and its partial output, the two quoted assertions) · **What was done** (files touched, left or
reverted) · **Stamp written** — blocked at Stage 0 or the ambiguity stop → **no metadata at
all** (nothing was claimed; a lifetime `aiErrorTotal` for a requirement nothing was attempted
on is the harm this rule prevents); blocked at Stage 2 or later → the Stage 8 row for the
cause, `aiEndedAt` included · **How to unblock** — the concrete next action. Then **stop**: a
half-built path with a green stamp is worse than a clean block.

**The cause word is machine-read — write it where the machine looks.** The queue's dispatcher
reads the cause out of the run-level closing detail and the `blocked`/`close-stamp` step
details: the final close of a blocked slice MUST carry the token verbatim — `infrastructure` —
in its detail text. A blocked close naming no token waits for a human, which on a genuine
baseline block wastes exactly the automation built for it.

**Nothing DECLARED is not an infrastructure block** — Stage 1E settles the conventions and the
run continues; only a load-bearing product decision the model does not answer stops it, and
that is cause `decision`, with the options named and your recommendation among them. A
`decision` report's **How to unblock** is the answer someone has to give, never a repository
they have to go find.

### After an `infrastructure` block: the doctor pass

An `infrastructure` block does not end the story. The QUEUE notices the settled block,
re-suspends the slice held, and commissions a **doctor pass**: a separate conversation with a
baseline-repair-only mandate — make the workspace **build and test again by its own declared
commands** (`.caep/targets.json` is exactly the kind of contract a doctor may write when its
absence was the block), touch no requirement metadata and no `.feature` file, prove the repair
with the real commands, close with the machine-read `VERDICT:` line. `VERDICT: fixed` → the
queue releases the slice for ONE more try; anything else parks it for a human. One pass per
block, ever.

Two binding consequences for YOU, the driver:

- **Never repair out-of-slice debt yourself.** The doctor exists precisely so the slice passing
  by does not moonlight on somebody else's broken baseline — attribution dies there. Write the
  honest block with the cause token and the evidence, and stand down.
- **Never draft or propose the doctor's prompt yourself.** The queue commissions the pass,
  staffs it (the `caep.ai.reqLoop.doctorModel` rung — deliberately stronger than a cheap
  driver) and sends it by itself (`caep.ai.reqLoop.doctorAutoSend`). Your entire contribution
  is the cause token and the evidence; everything after that is the machine's.
- **If you ARE the doctor pass** (your conversation opens with "DOCTOR PASS"), the mandate in
  your instructions is the whole job: baseline only, no features, no stamps, verdict line last.

## Final report

Files changed · RED evidence (ids failing before the code existed) · per-target build+test
results with the real output quoted and the **delta vs the pre-edit reading** · regressions
with the requirement each was attributed to, victims included · citation check (baseline vs
now) · stamps written (scenario id → fields) · **Charter** (what Stage 1E settled or was
answered, each with the evidence it came from, and where it was recorded — so any of it can
be overturned in one gesture) · **Recommendations** (the specialists' counsel,
verbatim — advisory, never part of any verdict) · what is still open.

State plainly which of these actually ran. Never report done on an unverified suite, and never
report a requirement satisfied on evidence that could not observe it — say what was proven, by
which command, and leave `aiGeneratedAt` alone where the proof fell short.
