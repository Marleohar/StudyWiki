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
