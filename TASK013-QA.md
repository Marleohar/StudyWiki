# TASK 013 - Q13-2 Permanent Expiry Correction

**READY FOR INDEPENDENT RE-QA — NOT MERGED.**

Existing PR: https://github.com/Marleohar/StudyWiki/pull/13; branch `feat/task013-category-batch-creation`.
Rejected HEAD: `5d2c25893fde9e434d520ac5576a7a29e5c24c24`.
Verified unchanged main: `2eb9777e0d281a522c93ab5c7b9cdb1babc61407`.
Tested implementation commit: `0dd329369c0a337d8f09ef263b340bad9a56817c`.
The final delivery adds this report only; its exact immutable HEAD is recorded in the PR and `../evidence/q13-2/delivery.json`. Independent QA must approve that final HEAD.

## Reproduced cause and correction

Read the complete independent re-QA report and preserved all previous development, QA and re-QA artifacts. Before production edits, verified exact local/remote rejected HEAD and main, then reproduced both failures using actual native controls, in separate disposable local and mocked-cloud processes:

1. Open category x batch, type a pending name, click Add; change category notes in the existing graph record; click Create and observe rejection; restore the original notes exactly; retry the same native Create. Before fix: a new object and modification entry are persisted.
2. Retain the current category creation button and original listener, change graph metadata, activate native button/listener and observe rejection; restore original graph values and identities; retry the same button and directly captured listener. Before fix: the rejected binding opens a new batch.

Snapshot/reference equality checks were reversible: neither the error message nor a failed binding check recorded permanent revocation. Frozen outer batch/binding objects prevented adding a simple mutable flag directly to those objects.

The fix stores exact batch and binding objects in a task-local, lazily initialized WeakSet (`expiredCategoryAuthorities`) when observed invalid. The set only gains entries; restoring graph data, category, library, revision, references or view cannot remove expiry. Weak references allow discarded controls/states to be collected. This authority state is UI memory only, never part of the graph or persistence payload/schema.

`categoryAuthorityValid()` first rejects expired authority, then applies the original complete context validator, and records a failed check permanently. Native button listeners validate their exact binding and current connected DOM identity. Add, Remove and Create validate the exact batch authority; Create also rechecks after preparing collision-checked IDs. Closing a batch and replacing a binding explicitly retire those exact authorities. Old callbacks retain their old objects and cannot affect a fresh batch or new current control.

Legitimate name/notes renewal uses binding validity immediately before its authorized save; only a current, unexpired control may be renewed. An expired binding stays expired even when the exact original graph is restored before a later legitimate metadata save. Existing category/library/revision/view/identity guards remain in place. Fresh rendered controls and fresh batches have separate authority and remain usable.

`categoryBatchValid()`, context capture and `categoryBatchError()` remain unchanged. Correctable input errors call the ordinary error renderer without expiring valid authority: blank names, duplicates, existing titles, unfinished input and invalid queue content can be fixed in the same dialog. Expired dialogs remain safely cancellable with their established error and focus containment.

## Identical before/after native reproduction

`../evidence/q13-2/revival-reproduction.cjs before|after` uses the same native procedures and data; only the final expected outcome differs. Full original/captured-context/changed/first-rejection/restored/retried graph and raw-storage snapshots, cloud payloads and screenshots are retained.

| Operation after exact restoration | Before fix | After fix |
| --- | --- | --- |
| Previously rejected local batch, same Create | **1 save / 3 local graph writes**, new node + modification | **0 saves / 0 storage / 0 cloud / 0 preference writes**, full graph unchanged |
| Previously rejected mock-cloud batch, same Create | **1 save / 1 cloud merge**, new node + modification | **All zero**, full graph unchanged |
| Previously rejected local current button/direct listener | Batch incorrectly opens; opening itself makes zero writes | No batch opens; all zero; snapshots identical |
| Previously rejected mock-cloud button/direct listener | Same incorrect revival | No batch opens; all zero; snapshots identical |

First stale rejection is zero-write before and after. In the corrected batch case, the original modal remains open with its error and pending names intact, allowing Cancel/Escape; Add/Remove/Create stay revoked through repeated retries and multiple change/restoration cycles.

Evidence: before-reproduction.txt/.json, after-reproduction.txt/.json; before/after-batch/binding-false/true-rejected/retried.png. Before files were produced at the exact rejected HEAD before editing index.html. The initial evidence helper encountered a missing error element in the no-dialog binding case; its optional lookup was corrected before the complete pre-edit reproduction. No application behavior was changed to pass that helper.

## Permanent regression coverage and complete results

Correction changes only four files: index.html, tests/category-authority-expiry.test.cjs, tests/browser-category-authority-expiry.cjs and TASK013-QA.md. No existing tests, assertions, browser harnesses or unrelated functionality changed.

Node: **415 PASS**, 0 failed/cancelled/skipped (326 previous + 89 new).

The 89 new Node cases cover first stale observation through Add/Remove/Create; restoration of category, library, revision, view, notes, unrelated metadata and exact node/edge references; repeated native binding/direct listener retries; fresh-view recovery; stale controls followed by legitimate name/notes saves; authorized one/two/five-object operations; correctable errors; retained callbacks against a fresh batch; and ordinary metadata no-ops.

The new real-Chromium suite passes **96/96 cases**, independently of the existing suites:

- 42 expired batch cases: seven context changes x Add/Remove/Create first rejection x local/cloud. Exact restoration and repeated native/direct callbacks cannot Add, Remove or Create.
- 14 expired binding cases: seven context changes x local/cloud; three change/restoration cycles, retained native/direct listeners, and a fresh current view recovering normally.
- 8 stale-binding/metadata-save cases, including restoration of the exact graph before the save attempts renewal.
- 18 successful one/two/five-object batches after successive native name/notes saves, at 1280/375/320 px in local/cloud modes. Fixed exact symbol/current name, no selector/description, Enter/visible Add/removal, literal hostile-looking names, complete graph comparisons, actual local reload, focus return and repeated-submit rejection.
- 2 correctable-input recovery cases, 2 expired Add/Remove/Create/Cancel callback cases against a fresh batch, and 10 cancelled/unchanged/invalid metadata cases. No-op controls retain their intended authority without unnecessary replacement.

Forward/reverse Tab visits all active controls; background brand/search/library native and forced activation remains blocked. Prior inert flags restore. Responsive screenshots and expired-dialog error screenshots were visually checked; literal names wrap and controls remain reachable.

| Committed Chromium script | Final observed result |
| --- | --- |
| browser-category-authority-expiry.cjs | PASS, 96 cases |
| browser-category-batch-creation.cjs | PASS, original 71 cases |
| browser-category-creation-refresh.cjs | PASS, original 44 cases |
| browser-category-moves.cjs | PASS |
| browser-category-sort-migration-guard.cjs | PASS |
| browser-category-sort-preferences.cjs | PASS |
| browser-confirmed-relation-sorting.cjs | PASS |
| browser-creation-dialog-containment.cjs | PASS |
| browser-existing-object-transfer.cjs | PASS |
| browser-header-search.cjs | PASS |
| browser-page-ui.cjs | PASS |
| browser-relation-sorting.cjs | PASS |
| browser-smart-workflows.cjs | PASS |
| browser-smoke.cjs | PASS in 5 consecutive ordinary fresh processes; initial matrix failure recorded below |
| browser-unsaved-description-corrections.cjs | PASS |
| browser-unsaved-object-description.cjs | PASS |

**Initial smoke failure, retained rather than hidden:** the first complete matrix was 14/15 PASS; browser-smoke ended at interception.drain with `AggregateError: CDP interception failed`, without an application assertion failure being reported. Its existing catch printed the stack but not nested causes. The ordinary unchanged command then passed five consecutive fresh processes. An isolated rejected-HEAD smoke run passed, and a logging-only diagnostic run passed without reproducing the error. No smoke/interception code or security checks changed. Its cause and attribution remain unestablished; this intermittent harness result is a remaining limitation. See browser-smoke.txt (failure), smoke-repeat-1..5.txt, smoke-repeats.json, rejected-head-smoke.txt and diagnostic-smoke.txt. Diagnostic preload exists only in new external evidence and rethrows errors unchanged.

Replay of the original independent re-QA scripts against this fix: **48/48 lifecycle cases PASS**, including all four formerly failing cases; **4/4 native compatibility cases PASS** (object-profile Byt Kategori and general header creation, local/cloud); **4/4 original native name/notes-save entry cases PASS**. Copied scripts and fresh artifacts reside under q13-2/independent-replay; originals remain untouched. These are developer replay results, not fresh independent approval.

## Full data, writes and isolation

Complete expected snapshots preserve all existing nodes/IDs, edges/paused relations, categoryState/category order, unknown fields, legacy and sv/en descriptions, prior timestamps/modification entries and source-array order. Approved graphs append only intended new standard empty-description objects and established modification entries. Local reload preserves every created ID. Mock payloads match complete nodes/edges/symbolCategories with merge=true and contain no authority bookkeeping. Existing collision retry/exhaustion and atomic rejection assertions remain passing.

| Interaction | Logical saves | Local graph writes | Mock-cloud writes | Preference writes |
| --- | ---: | ---: | ---: | ---: |
| Expired/stale callbacks, Add/Remove pending, cancelled/Escape/no-op, rejected ordinary input | 0 | 0 | 0 | 0 |
| Approved local batch | 1 | 3 | 0 | 0 |
| Approved mock-cloud batch | 1 | 0 | 1 merge | 0 |
| Repeated old callbacks after success or fresh reopening | 0 additional | 0 additional | 0 additional | 0 |

The strict validator, context capture, ordinary error renderer, smart-context/quick-link methods, sync, relation grouping and category-symbol rename are byte-identical to rejected HEAD. Commit body changes only wrap its two original context checks in monotonic authority validation. Mechanical proof: protected-source.json. No persistence schema, ID rules, transfer shortcut, sorting, language or navigation policy changed. The earlier category-page duplicate-title transfer shortcut remains intentionally absent from batch creation; object-profile transfer/general creation are preserved.

All new evidence is under `C:\dev\Franks projekt\Nordverket\task-013\evidence\q13-2`. TEMP/TMP set to q13-2/tmp before browser runs; synthetic libraries, disposable independent installed Chrome 155 profiles, dependency-free Node 24/CDP tooling, disabled Firebase startup and fail-closed external blocking only. No production services/data, credentials, paid APIs, Digital GM dependencies or unrelated repository changes. No profile-cleanup failure occurred.

Key artifacts: node-tests.txt, focused-node.txt, browser-results.json (initial complete matrix), final-browser-results.json (explicit retries), final-focused-browser.txt; final 96-case snapshots/screenshots at tmp/task013-authority-expiry-sWon80; before/after reproduction records/screenshots; independent-replay artifacts; protected-source.json. `git diff --check` passes including newly added files.

Remaining limitations: live Firebase durability/concurrency, other engines, assistive technology and physical mobile keyboards are not tested. Inherited title-based loader deduplication and the disclosed transfer-entry limitation remain unchanged. Expiry is monotonic after invalidity is observed; no new graph observer/revision system is introduced to detect unobserved transient changes. Final exact HEAD still requires fresh independent QA. No merge, deployment or auto-merge performed.

---

Earlier development/correction reports follow unchanged as historical evidence; the Q13-2 section supersedes their earlier verdicts and totals.

# TASK 013 ? Blocking QA correction

**READY FOR INDEPENDENT RE-QA ? NOT MERGED.**

PR: https://github.com/Marleohar/StudyWiki/pull/13. Existing branch: `feat/task013-category-batch-creation`.
Rejected HEAD: `c8078e6e72b7e3992aba298d69faa750571a7cb9`; unchanged main: `2eb9777e0d281a522c93ab5c7b9cdb1babc61407`.
The final correction HEAD is recorded in the PR and correction delivery evidence after committing this report.

## Demonstrated failure and cause

Before application edits, reran the original independent QA `category-edit-entry.cjs` reproduction against rejected HEAD. All four native flows failed: category x ? Byt namn ? changed name ? Skapa objekt i kategorin, and category notes ? changed text ? Spara ? Skapa objekt i kategorin, each in local and mocked-cloud mode. The enabled button focused but neither dialog opened. Revisit recovered it. Full graphs/storage before and after the failed click were identical, with 0 saves / 0 storage writes / 0 cloud writes / 0 preference writes. The intentional metadata save precedes those measured snapshots/counters.

The rendered creation button retained a graph-snapshot context predating the metadata save. Rename updated only the heading; notes save updated only the description. Strict batch validation correctly rejected the obsolete context but left the current visible entry unusable.

## Scoped correction

A newly rendered creation control owns an immutable binding and context. Its listener checks both the current binding identity and the exact connected DOM control before attempting to open the batch dialog. After an authorized, actually changed metadata save, replace that control with a fresh one only if its previous context was valid immediately before saving and the current category/library/revision/rendered view still match. Context validation occurs after the rename prompt, protecting changes during the prompt too.

Cancelled, unchanged and invalid edits do not renew controls. An already stale graph/control cannot gain authorization through a later metadata edit. Detached buttons and captured listeners keep their expired binding permanently, including after metadata values revert. Open batches retain their original contexts and reject graph changes. No context is recaptured on activation. `categoryBatchValid` and `commitCategoryBatch` remain byte-for-byte unchanged.

Correction files: index.html, tests/support/task003a-harness.cjs (DOM replaceWith support only), tests/category-creation-refresh.test.cjs, tests/browser-category-creation-refresh.cjs, TASK013-QA.md. No earlier test assertions or browser scripts changed by this correction.

## Native browser evidence and data integrity

Original reproduction passes after correction in all four flows: the replacement current control opens the fixed-category batch immediately with the saved name and exact symbol, without navigation or writes.

The permanent focused Chromium suite exercises 44 cases: 18 one/two/five-object batches after multiple successive native name and notes saves across 1280/375/320 px and both persistence paths; 22 retained-control/stale/no-op/invalid checks; 4 Cancel/Escape/reopen cases. Native Enter and visible Add, individual removal, forward/reverse Tab containment, current category/name, no selector, focus return, full graph/storage comparisons, screenshots and actual local reload are included. Retained detached buttons, directly captured listener functions and old dialog submits are exercised.

Approved batches append only new standard empty-description nodes and established modification entries, preserving original nodes, IDs, descriptions, edges, category metadata and ordering. Exactly 1 logical save, 3 local storage writes or 1 mocked-cloud merge, and 0 preference writes. Pending, cancelled, old, invalid and navigation-only interactions leave complete snapshots identical with 0 saves/storage/cloud/preference writes. Saved category name/notes remain intact; success stays on category x and restores focus to its current creation button.

## Validation and evidence

Node: 326/326 PASS (311 earlier tests plus 15 focused lifecycle tests). All 15 Chromium suites PASS: all 14 existing suites (including both TASK 012 suites and the 71-case batch suite) plus the new 44-case native creation-refresh suite. The first four existing suites were rerun after the final prompt-time validation adjustment and pass again. Whitespace check passes.

All new evidence is under `../evidence/corrections`, preserving earlier development and `qa/evidence` artifacts:

- rejected-category-edit-entry.json and rejected-after-*.png: failing-before full snapshots/screenshots.
- corrected-category-edit-entry.json and corrected-after-*.png: passing-after identical native reproduction.
- node.txt; browser-results.json; individual browser logs; focused-browser-final.txt.
- tmp/task013-refresh-*/snapshots.json and batch-*.png: complete focused graphs/storage, counts, keyboard traces and responsive screenshots.
- unchanged-guards.json: unchanged strict validator/atomic commit check.

Set TEMP/TMP to task-local evidence/corrections/tmp before browser processes. Independent installed Chrome 155 and Node 24 use the repository's existing dependency-free CDP harness, disposable profiles, synthetic libraries, disabled Firebase initialization and blocked external requests. No production service/data, credentials, paid API, Digital GM or ?rt-Wikin access/modification. Browser failures encountered while developing the new test were test selector/instrumentation/declaration errors, corrected before the final runs.

## Scope and remaining limitations

Existing TASK 012 draft protection, object-profile Byt Kategori, general creation, sorting, preferences, ID collision and atomic stale protections remain covered by the unchanged existing suites. The previously disclosed category-entry transfer conflict remains: the new batch rejects existing names; object-profile transfer and legacy general creation behavior are preserved. No new transfer shortcut or policy introduced. Inherited duplicate-title filtering on library reload remains unchanged; accepted new batches reject duplicates and retain all created IDs on reload. Mock cloud validates expected merge operations, not live Firebase behavior. Independent QA must approve the exact new HEAD; no merge/deployment/auto-merge performed.

---

The original development report follows unchanged as historical evidence. Its earlier readiness and totals are superseded by this correction section.

# TASK 013 — Fixed-Category Bulk Object Creation

**READY FOR INDEPENDENT QA — NOT MERGED.**

## Delivery and scope

Repository: Marleohar/StudyWiki. PR: https://github.com/Marleohar/StudyWiki/pull/13.
Branch: feat/task013-category-batch-creation.
Verified starting and final main baseline: `2eb9777e0d281a522c93ab5c7b9cdb1babc61407`.
Tested implementation commit: `2339d7d5f01472244aa8c96521a57c4b8b406730`.
The final delivery adds only this report; its exact immutable HEAD is recorded in the final response, PR description and task-local ../evidence/delivery.json. A commit cannot embed its own hash. Independent QA must pin that final HEAD.

Changed files:

- index.html
- tests/category-batch-creation.test.cjs (new)
- tests/browser-category-batch-creation.cjs (new)
- tests/browser-smoke.cjs
- tests/browser-header-search.cjs
- tests/browser-existing-object-transfer.cjs
- tests/browser-creation-dialog-containment.cjs
- tests/browser-page-ui.cjs
- TASK013-QA.md

New multi-object creation is available only through the category-page Skapa objekt i kategorin entry. General single-object creation remains operational. No bulk extension to other dialogs, category-navigation redesign, sorting redesign, migration or language-switching feature was introduced.

## Existing behavior and explicit transfer conflict

Before TASK013, category-page creation called openCreateDialog('', symbol). Its dialog exposed a category selector and description and created one object, navigating to that object. An existing title from another category opened the confirmed category-transfer dialog.

This directly conflicts with the new requirement to reject existing names and never move an object through bulk creation. The category-page button now opens the fixed-category batch workflow and rejects existing names without offering a transfer. **The old category-creation duplicate-to-transfer entry is no longer exposed by that button.**

Existing object-page Byt Kategori remains the user-accessible category-move route, with its existing behavior unchanged. The legacy single-create and confirmed-transfer implementation remains intact and regression-tested through its explicit method entry. No new transfer entry, confirmation policy or bulk-move policy was invented. If Frank wants an additional category-page transfer entry later, that is a separate product decision rather than an implicit side effect of creating a batch.

Five older browser scripts exercised the replaced category entry while asserting legacy behavior (editable selector, description, single-object navigation or nested confirmed move). Their setup now focuses the same category control and explicitly calls the preserved legacy openCreateDialog('', activeCategorySymbol). Every other line, including **all assertions**, is identical to baseline. This preserves the old workflow checks while the new native suite checks the actual category button. It does not claim the legacy transfer dialog is still opened by the new button.

Mechanical proof: ../evidence/earlier-assertions-preserved.json and verify-earlier-assertions.py. All previous Node tests and browser support/harness files are unchanged.

## Implementation

The new categoryBatchDialog displays Skapa nya objekt, the exact originating symbol/name as literal fixed text, Namn / Titel, Lägg till, the pending list with individual X controls and Skapa/Avbryt. It exposes no category selector or description textarea. New objects use the standard empty description `{sv:'',en:''}`, ordinary-member status and existing default color.

The category button retains a frozen category context captured when rendered: exact symbol, library/revision/view, complete graph snapshot and source-array/record identities. Opening and all mutations revalidate the category view and context. Source/edge/category-record replacement, changed metadata, mode/library/revision/view or category changes invalidate the transaction. No record is created or rerendered on stale submit rejection. Route/read-mode cleanup closes the modal and invalidates retained actions.

Pending state is temporary UI state only. Enter or Lägg till trims outer whitespace using the established title identity semantics, rejects blank or existing/case-equivalent batch names, appends a literal name and clears/refocuses the input. Each removal callback retains its exact pending entry, rather than an index that could later refer to a different item. Repeated old removals cannot remove another pending name.

Skapa first validates every pending entry and rejects the entire operation for blank/invalid/existing/duplicate identities. Nonempty input not yet added to the list is rejected with an explanatory message instead of being silently discarded. Empty batches do not save. Final commit reads the immutable captured symbol rather than displayed text, general selector state or mutable creationCategorySymbol.

All IDs are generated into detached prepared objects and checked against every existing and newly prepared ID. Collisions retry; exhausted retries reject before any graph mutation. Context is revalidated after preparation. The approved batch appends nodes and their established modification records, calls exactly one `sync({preserveEdges:true})`, closes and renders the same category. Existing nodes, edges, category records, timestamps/unknown metadata and source order remain unchanged; new nodes/clock records append. Category sorting is read/restored, not redesigned or persisted again.

No persistent draft field, storage key, schema, editing/deletion feature or new service/dependency was added.

## Focus and lifecycle

The batch uses the existing creation containment helpers: activeCreationDialog, visible/enabled-control enumeration, background click/pointer guards and focus redirection. Initial focus is the name input. Tab/Shift+Tab cycles input, Add, current removal buttons, Create and Cancel. Escape cancels. Opening records exact prior inert states and the original trigger; closure restores them, returns focus when the trigger is usable and blurs any remaining focus inside a hidden root. Missing/detached/disabled/hidden triggers are handled safely.

Reentrant opening preserves pending names and incomplete input. General/legacy creation cannot open over an active batch. Old actions close over their exact batch instance and cannot submit/remove from a later batch. Read mode and route refresh discard pending state with zero writes.

## Tests and actual results

Node v24.12.0; Chrome/155.0.8059.84; existing dependency-free CDP harness.

| Command | Final result |
| --- | --- |
| node --test tests/*.test.cjs | **311 PASS**, 0 fail/cancel/skip (275 prior + 36 new) |
| node tests/browser-smoke.cjs | PASS, exit 0 |
| node tests/browser-category-moves.cjs | PASS, exit 0 |
| node tests/browser-header-search.cjs | PASS, exit 0 |
| node tests/browser-existing-object-transfer.cjs | PASS, exit 0 |
| node tests/browser-relation-sorting.cjs | PASS, exit 0 |
| node tests/browser-confirmed-relation-sorting.cjs | PASS, exit 0 |
| node tests/browser-page-ui.cjs | PASS, exit 0 |
| node tests/browser-smart-workflows.cjs | PASS, exit 0 |
| node tests/browser-category-sort-preferences.cjs | PASS, exit 0 |
| node tests/browser-category-sort-migration-guard.cjs | PASS, exit 0 |
| node tests/browser-creation-dialog-containment.cjs | PASS, exit 0 |
| node tests/browser-unsaved-object-description.cjs | PASS, exit 0 |
| node tests/browser-unsaved-description-corrections.cjs | PASS, exit 0 |
| node tests/browser-category-batch-creation.cjs | **PASS, 71 cases**, exit 0 |
| git diff --check | PASS |

New Node coverage: one/two/five-object local/cloud commits; Enter/Add/removal identity; blank/existing/case-trim duplicates; injected invalid batches/no partial creation; fixed special symbols/programmatic tampering; library/revision/view/mode/category/node/edge/category-record staleness; cancellation/route cleanup/reentrant opening; unique-ID retry/exhaustion and retained actions. A new fixture initially lacked body.setAttribute and expected null rather than absent confirmation state; only the new fixture/expectations were corrected. Prior assertions/harnesses were not changed. Retained logs: focused-node.txt, focused-node-2.txt.

The new real-Chromium suite uses the actual category button and native mouse/keyboard input at **1280, 375 and 320 px**, height 900 px. It covers:

- 18 successful one/two/five-object cases across widths/local/cloud, including individual removals, Enter and visible Add, literal hostile-looking names and programmatic category/context/label tampering.
- Actual local reload for every local successful batch; complete graphs match and all new objects remain on the same category route/list.
- 3 native keyboard/background/Escape cases: two complete forward and reverse cycles, every control reachable, blocked native/forced brand/search/library activity, correct focus and inert restoration, no horizontal overflow.
- 16 invalid/atomic cases across local/cloud, including injected blank/existing/duplicate entries and unfinished input.
- 20 stale-context cases plus retained origin controls, all zero-write.
- ID collisions/retry and exhaustion, old controls after reopening, and detached/disabled/hidden return targets on local/cloud.

The final complete fourteen-suite run passes. Earlier complete runs also passed; an expanded 71-case batch run passed before the final run. No final browser/profile-cleanup failure occurred.

Two additional native integration probes pass: stored relation-sort mode/criterion survive batch creation with unchanged preference record; native header-search general creation still exposes selector/description, creates one object and navigates to it with its expected description. Each uses one save/three local writes. Evidence: integration-probe.cjs/.txt and integration-snapshots.json.

Protected-source check confirms **17 existing methods byte-identical** to baseline, including smart context/link/chain/category operations, long press, grouping, preference migration, descriptions, saveNewNode, openExistingMove, confirmExistingMove and sync. See protected-source-verification.json. Only explicitly documented category-entry and containment/lifecycle hooks changed around those methods.

## Complete graph and persistence evidence

Evidence root: C:\dev\Franks projekt\Nordverket\task-013\evidence.
Final logs: final-node.txt, final-browser-results.json and final-browser-*.txt.
Final batch artifacts: tmp/task013-category-batch-oK9pMM:

- snapshots.json — 71 full case records, complete graphs, raw-storage preservation on rejects/cancels, focus sequences and exact counts.
- pending-1280/375/320.png — literal pending names and fixed category.
- keyboard-1280/375/320.png — active input/dialog at each width.

Mobile pending/keyboard screenshots were visually reviewed. Long literal names wrap, actions remain reachable and no HTML/script payload executes. Existing descriptions in sv/en or legacy string format, paused/unknown edge metadata, category notes/name/unknown fields, old modification records and source-array order are preserved by complete deep comparisons. New records contain only intended object fields and appended modification metadata.

| Operation | Logical saves | Local graph writes | Mock-cloud writes | Preference writes |
| --- | ---: | ---: | ---: | ---: |
| Add/remove names, reentrant open, keyboard/navigation within dialog | 0 | 0 | 0 | 0 |
| Cancel/Escape/invalid/stale/ID exhaustion | 0 | 0 | 0 | 0 |
| Approved local batch of 1, 2 or 5 | 1 | 3 | 0 | 0 |
| Approved cloud batch of 1, 2 or 5 | 1 | 0 | 1 merge | 0 |
| Repeated submit/old callbacks | 0 additional | 0 additional | 0 additional | 0 |

Rejected/cancelled cases assert complete graph and all raw localStorage equality plus total write counters at zero. Approved cloud payloads compare full nodes, edges and symbolCategories plus merge=true. Approved local counts are exactly the established three graph-key writes. Existing categoryState records are untouched; only new nodes' established modification entries append. The relation-sorting integration explicitly compares the preference record as well.

## Isolation, QA handoff and limitations

Workspace: C:\dev\Franks projekt\Nordverket\task-013, separated into development, evidence and qa-preparation. TEMP/TMP was set to evidence/tmp before Node/Chromium processes. Synthetic libraries and disposable profiles only. Firebase SDK/config/startup disabled before page execution; loopback server, CSP, external proxy blocking and fail-closed interception remain enabled. No production services, real Firebase, real library data, credentials, paid API or Digital GM tooling used. No unrelated repository changes.

Independent QA instructions: ../qa-preparation/README.md. These are developer results, not independent approval. The owner must obtain independent QA approval of the exact final HEAD before merge.

Known inherited loader limitation: title-based deduplication on reload can filter pre-existing duplicate-title IDs. This task introduces no duplicate-title records: batch validation uses established identity rules and all newly created objects survive real reload in the tests. The inherited loader was not redesigned. Cloud testing validates mocked merge payloads, not production durability/concurrency; existing persistence failure/fallback semantics are unchanged. ID generation has a bounded 1000-attempt collision retry per object and safely rejects exhaustion.

Headless Chromium is covered; other engines, assistive technologies, real mobile keyboards and short mobile viewport heights were not tested. The old category-origin creation duplicate-to-transfer entry change is explicitly documented above rather than hidden. No extra category-page transfer policy or unrelated future feature was added.

**READY FOR INDEPENDENT QA — NOT MERGED. No merge, deployment or auto-merge performed.**
