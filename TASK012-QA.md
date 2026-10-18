# TASK 012 — Blocking QA Corrections

**READY FOR INDEPENDENT RE-QA — NOT MERGED.**

## Corrected delivery

Repository: Marleohar/StudyWiki. Existing PR: https://github.com/Marleohar/StudyWiki/pull/12.
Branch: feat/task012-unsaved-object-descriptions. Rejected HEAD: `035f398e6cbe4b99bb5256c26f5c38109aae8c41`.
Verified unchanged main: `5f5a8196fd87d4495183632d5e21742bf81590d5`.
Tested correction commit: `b647fcf3a277f5250a2211cc9ad8fa0716a221ab`.
Final delivery adds only this updated report; the exact immutable final HEAD is recorded in the PR description, final response and `../evidence/corrections/delivery.json`. Independent QA must pin that final HEAD. A commit cannot contain its own hash.

Correction files relative to rejected HEAD:

- index.html
- tests/unsaved-description-corrections.test.cjs (new, 16 cases)
- tests/browser-unsaved-description-corrections.cjs (new, 30 recorded browser cases)
- TASK012-QA.md (updated)

All prior source changes and both original TASK012 tests remain in the PR; neither original test file nor any earlier assertion/harness was changed. The complete PR also contains tests/unsaved-object-description.test.cjs and tests/browser-unsaved-object-description.cjs from the initial implementation.

## Reproduction before correction

Read the independent QA report at `../qa/evidence/TASK012-INDEPENDENT-QA.md`. Its checkout and evidence were not modified. Current remote PR HEAD and main were verified before editing.

A copy of the supplied QA replay was run against development **while still exactly at rejected HEAD**, writing only new correction evidence. All 66 ordinary invariant cases passed and the four diagnostic observations reproduced both defects on local and mocked-cloud paths:

1. Edit Alpha's description, replace Alpha with an identical-field record without revision/rerender, click the retained native Återställ relation button for paused Delta. No decision, draft lost, relationship restored. Local: **1 save / 3 graph-storage writes**. Mock cloud: **1 save / 1 merge write**.
2. Open the legacy linking dialog, add Beta, activate Länka alla, then Escape from the description decision. The decision closed but the legacy dialog still covered the editor. Draft intact, zero writes on both paths.

Evidence: `../evidence/corrections/rejected-head-replay.txt`, replay-qa-before.cjs, independent-results.json and screenshots in the correction evidence directory. These are fresh developer reproductions of QA's evidence, not independent approval.

The new 16-case Node regression file was separately copied into a disposable rejected-HEAD checkout. Result: **13 fail / 3 pass**, exit 1. Both Avbryt and Escape cleanup assertions fail there; stale rendered source/target and direct mismatched editor cases also fail. See rejected-head-new-node.txt and rejected-checkout. No source was reverted in development to obtain this evidence.

## Blocker A — root cause and correction

The restore button previously retained only IDs. requestRestoreRelation() captured current records when the old button was activated, effectively authorizing the replacement source. runDescriptionLink() treated a mismatched source/editor as if no dirty editor existed and called the mutating continuation.

The rendered restore control now captures its original smart context and exact target instance. Activation passes both to requestRestoreRelation(), which validates the original source, all retained node identities, target, library/revision/view and snapshot through the existing strict smart validator before any mutation.

The draft guard now distinguishes absence from staleness: only an absent draft or a valid unchanged editor can proceed without a decision. A mismatched source, mismatched/detached editor or changed language rejects immediately, retains every draft character, performs no rerender and makes zero writes. A fresh direct request cannot bypass this guard by capturing the replacement source.

Fresh reopening still captures the current records: the user can approve the description and restore the paused edge with exactly one save. Retained old restore/decision controls cannot repeat or switch the operation. Existing smartContextValid() and snapshot checks were not weakened or changed.

## Blocker B — root cause and correction

Description cancellation previously closed the smart category picker only, then focused the textarea behind the legacy dialog. Its pending source and names remained available.

The temporary decision now records whether it came from legacy batch linking. Both Avbryt and Escape use the same cancellation path: restore saved inert flags, close the appropriate underlying legacy dialog, clear its source, pending names and legacy context, then focus the usable original editor. Non-legacy cancellation continues its prior path.

The legacy dialog's existing deferred input focus now checks its captured context and active decision before focusing. A cancelled operation cannot later steal focus back to a hidden input. A Node timer regression advances beyond the delay after cancellation; the editor retains focus. This is a lifecycle check, not an added sleep.

No graph, storage schema, description representation or persistence behavior changed. The new legacy marker is temporary UI state only.

## Corrected browser evidence

New native Chromium suite: tests/browser-unsaved-description-corrections.cjs. **30 recorded cases**, at 1280, 375 and 320 px, on local and mocked-cloud persistence:

- Identical source and target replacement followed by native retained restore activation: original textarea instance/value intact, paused edge retained, complete graph and raw storage unchanged, no decision/rerender/save.
- Direct restore after the source replacement also rejects; reopening the page permits explicit Save and restoration exactly once. Full graph and cloud payload checks preserve source ID, bilingual/unknown description data, edge metadata, category records and unknown fields; only approved description, paused marker and established clocks change.
- Legacy dialog opened through its retained method (there is no current page entry button), then **actual input/Enter and Länka alla controls**. Both native Avbryt and Escape close both layers, retain the exact draft, clear operation state, restore original inert flags and return focus to an editor that accepts a native click unobstructed.
- Retained decision and batch controls plus direct repeated methods make no additional operation.

The copy of QA's replay was rerun with the diagnostic sections upgraded to required equality/zero-write assertions. Result: **70 assertions/cases, no findings**. See corrected-qa-replay.txt, replay-qa-after.cjs and corrected-qa-replay-snapshots.json. Original QA artifacts remain untouched.

The new suite writes full snapshots and screenshots to the path printed in browser-unsaved-description-corrections.txt. Files: snapshots.json, stale-source-rejected-1280/375/320.png, legacy-cancel-editor-1280/375/320.png. The focused run at tmp/task012-corrections-H2iOiR also passed; 320 px screenshots were visually reviewed and show the retained/unobstructed editor.

## Complete final regressions

| Command | Actual result |
| --- | --- |
| node --test tests/*.test.cjs | **275 PASS**, 0 fail/cancel/skip (259 previous + 16 new) |
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
| node tests/browser-unsaved-object-description.cjs | PASS, 69 cases, exit 0 |
| node tests/browser-unsaved-description-corrections.cjs | PASS, 30 cases, exit 0 |
| git diff --check | PASS |

Final logs: ../evidence/corrections/final-node.txt, browser-results.json and each browser-*.txt. All **13 Chromium suites** passed. Original Save/Discard/Cancel, new-object category selection, chains, no-op/stale cases, legacy formats and language fields, actual reload, double clicks, focus/Tab/Shift+Tab/Escape, background blocking and earlier TASK006–011 assertions remain passing.

New-test development failures are retained: the first Node fixture left old fake rows/IDs across rerenders and was adjusted to clear the new fixture's replaced slots; the first browser attempt had a malformed selector expression, corrected in the new test only. No existing test was weakened and no application behavior was changed to accommodate the fake DOM. All final validations use the corrected source.

## Preservation and exact writes

| Corrected operation | Graph saves | Local graph writes | Mock-cloud writes | Preference writes |
| --- | ---: | ---: | ---: | ---: |
| Stale source/target native restore | 0 | 0 | 0 | 0 |
| Direct request with stale editor | 0 | 0 | 0 | 0 |
| Legacy Avbryt/Escape and retained callbacks | 0 | 0 | 0 | 0 |
| Fresh approved description + restore, local | 1 | 3 | 0 | 0 |
| Fresh approved description + restore, mocked cloud | 1 | 0 | 1 merge | 0 |
| Repeated approved callback/old restore | 0 additional | 0 additional | 0 additional | 0 |

Rejected/cancelled operations compare complete nodes, edges, categoryState and all raw localStorage records. Their total storage-write counter is zero, including preferences. Approved paths retain exact graph expectations and the established three graph-key writes or one complete merge payload. Existing all-path suites retain full Save/Discard/Cancel and reload coverage. No new save or storage key introduced.

## Scope, isolation and limitations

Existing development workspace only; new evidence and disposable rejected checkout under ../evidence/corrections. Independent QA checkout/evidence untouched. TEMP/TMP set to corrections/tmp before Node/Chromium processes. Node v24.12.0; Chrome/155.0.8059.84; existing dependency-free CDP harness. Synthetic libraries, disposable profiles, disabled Firebase startup, blocked external traffic and mock cloud only. No production data, credentials, real Firebase, paid services, Digital GM tooling or unrelated repository changes.

No bulk creation, category-navigation improvement, bulk category selection or general language switching implemented. Legacy workflow still has no current page entry button; testing opens it by method then uses its real controls. Other browser engines, assistive technology and real mobile OS keyboards remain untested. Existing persistence failure/concurrency semantics are unchanged. Developer tests are not independent approval; the exact corrected PR HEAD still requires independent re-QA before owner merge. No merge, deployment or auto-merge.

---

## Original delivery report — historical, superseded by the corrections above

# TASK 012 — Protect Unsaved Object Descriptions

**Original delivery status (superseded): READY FOR INDEPENDENT QA — NOT MERGED.**

## Revision, scope and delivery

- Repository: Marleohar/StudyWiki (Nördverket).
- Verified main baseline: `5f5a8196fd87d4495183632d5e21742bf81590d5`, unchanged before development and after final tests.
- Branch: `feat/task012-unsaved-object-descriptions`.
- PR: https://github.com/Marleohar/StudyWiki/pull/12
- Tested implementation commit: `9aab3efbc7987223e042997f7e1aceeefc9f4496`.
- The follow-up delivery commit adds only this report. The exact final immutable PR HEAD is recorded in the final delivery response and task-local `../evidence/delivery.json` / `TASK012-DELIVERY.md`; a commit cannot embed its own hash. Independent QA must pin that final HEAD.
- Changed files: `index.html`, `tests/unsaved-object-description.test.cjs`, `tests/browser-unsaved-object-description.cjs`, `TASK012-QA.md`.

This implements Frank's Save / Discard / Cancel decision for unsaved **object** descriptions during linking. No general navigation guard, category-description redesign, new schema/field/storage key, model change or configurable terminology. TASK006 sorting, TASK007 page/description behavior, TASK008 identity guards, TASK009 preferences and TASK011 creation containment regressions remain passing. No existing test or assertion was changed.

## Root cause and real-browser reproduction

At the verified baseline, `finishSmartOperation()` completed a link by calling `renderPage()` or `navigateTo()`. The description textarea was transient DOM state and the rerender discarded it. An already-active quick link also called this completion path even though nothing changed.

The issue was reproduced **before implementation**, using the actual Chromium UI and the unchanged baseline:

1. Creative mode, open Alpha and activate its description editor.
2. Append ` UNSAVED TASK012` without saving; resulting draft `Original UNSAVED TASK012`.
3. Type Beta in Quick Link and activate Länka.
4. Observed: editor removed, A–B relationship created, stored Swedish description still `Original`; **1 logical save / 3 local graph writes**. The draft was lost without a choice.

Evidence: `../evidence/reproduce-before.cjs`, `before-reproduction.txt`, `before-reproduction.json`, `before-draft-loss.png`.

## Precise correction

`renderPage()` retains a temporary draft context containing the original object reference, rendered language, original text and exact textarea. It displays the current language value consistently with the existing language-specific save semantics. Dirty detection compares the complete current value with the actual original content; an open editor alone is insufficient. Empty strings, whitespace, quotes, Unicode and multiline values are compared without trimming or normalization.

`runDescriptionLink()` delays a validated, changing linking operation when the matching editor is dirty. The new Swedish modal offers **Spara**, **Kasta**, **Avbryt**:

- **Spara:** revalidate, apply the original object's description in memory, then perform the approved link and use its established **one** graph save. No intermediate render/save invalidates the transaction snapshot.
- **Kasta:** revalidate and perform only the link; keep the saved description unchanged. The normal completion rerender discards the draft after approval.
- **Avbryt / Escape:** consume no graph operation, preserve every character and return focus to the textarea. If nested over a category picker, close the picker and return to the editor.

`saveFreeText()` and approved continuation share `updateObjectDescription()`, preserving existing legacy-string conversion and other language/unknown fields. The continuation helper does not persist or render independently. The existing smart-context validator and `creationSnapshot()` remain unchanged; they are checked before either description or relationship mutation, followed by a synchronous approved continuation instead of weakening or bypassing validation to accommodate an intermediate save.

The decision captures the original smart context, exact node and edge record identities, graph snapshot, editor/language/text and intended quick-link/chain/category selection. It rejects source/target/edge replacement even with identical serialized content, library/revision/view changes, graph changes, draft changes and changed selections. Rejection shows an error and remains cancellable with zero writes. Each dialog's controls close over its exact decision object; consumed or old controls cannot resolve a later decision or repeat a save.

Protected paths:

- Existing Quick Link and paused Quick Link restoration.
- Final new-object category confirmation; opening/cancelling the picker alone preserves the editor and does not ask.
- Advanced chains, using the existing parser on detached records to identify no-change input before prompting. The preview has no graph/persistence/UI effects on the real library.
- The visible paused-relation **Återställ relation** action.
- The legacy callable batch-link workflow, which has no current object-page entry button, also uses the same decision.

Self-link, blank, already-active and no-change chain attempts preserve the editor without opening a decision or rerendering it. Category moves and category-description workflows retain their previous scope/behavior.

## Modal, keyboard and cleanup

The dialog has modal semantics, labelled heading/question and an error alert. Initial focus is the safe **Avbryt** action. Native sequences starting there:

- Forward: Spara → Kasta → Avbryt, twice.
- Reverse: Kasta → Spara → Avbryt, twice.

Tab/Shift+Tab remain contained. Escape cancels. Body-sibling inert values are snapshotted and restored exactly, including deliberately inert elements and the underlying picker. Scoped event guards block native/forced background brand, search and library activation. Backdrop presses retain dialog focus. Cancel returns to the connected, usable editor; read-mode and route/rerender cleanup remove pending authorization and restore background interactivity.

Real Chromium tests at **1280, 375 and 320 px**, height 900 px, assert no horizontal overflow and that the dialog stays within the viewport. Screenshots were visually reviewed at desktop and 320 px; all controls remain usable. Screenshot paths are below.

## Test results

Environment: Node v24.12.0, Chrome/155.0.8059.84, repository dependency-free Chromium/CDP harness. No new dependency.

| Command | Actual final result |
| --- | --- |
| `node --test tests/*.test.cjs` | **259 PASS**, 0 fail/cancel/skip (216 existing + 43 new) |
| `node tests/browser-smoke.cjs` | PASS, exit 0 |
| `node tests/browser-category-moves.cjs` | PASS, exit 0 |
| `node tests/browser-header-search.cjs` | PASS, exit 0 |
| `node tests/browser-existing-object-transfer.cjs` | PASS, exit 0 |
| `node tests/browser-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-confirmed-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-page-ui.cjs` | PASS, exit 0 |
| `node tests/browser-smart-workflows.cjs` | PASS, exit 0 |
| `node tests/browser-category-sort-preferences.cjs` | PASS, exit 0 |
| `node tests/browser-category-sort-migration-guard.cjs` | PASS, exit 0 |
| `node tests/browser-creation-dialog-containment.cjs` | PASS, exit 0 |
| `node tests/browser-unsaved-object-description.cjs` | **PASS, 69 recorded cases**, exit 0 |
| `git diff --check` | PASS |

New Node coverage: all choices, existing/new targets, paused edges, chains/no-ops, unchanged/cleared descriptions, legacy/structured values and both language paths, source/target/edge/library/revision/view/mode/language/selection/editor staleness, retained callbacks across decisions, category selection changes and prior inert states.

New Chromium coverage uses actual input, clicks and keyboard approval: Save/Discard/Cancel across five workflows on local and mocked-cloud paths (30 cases), keyboard/background/Escape at three widths, 18 stale cases across both persistence modes, picker cancellation/stale final category, invalid/no-change attempts, unchanged nonempty/empty descriptions, legacy/structured language semantics, actual reload, read-mode cleanup, duplicate-title selected-target replacement, real double-click, keyboard Save and retained callbacks after rerender/navigation.

Final logs: `../evidence/final-node.txt`, `final-browser-results.json`, `final-browser-*.txt`, `focused-browser-final.txt`. All eleven baseline suites also passed an earlier complete run. Final validation used the finalized implementation, not the earlier intermediate source.

Development failures are retained rather than hidden: an initial legacy-batch baseline failure exposed its direct callable setup (fixed without changing the existing test); new fixture expectations were corrected from undefined to the explicit cleared null state; the first focused browser run exposed backdrop focus blur, which was corrected. Subsequent focused runs passed 63, then the final expanded 69 cases. See `initial-node*.txt`, `focused-node*.txt`, `focused-browser*.txt`. No final browser/profile-cleanup failure occurred.

## Full graphs, persistence and reload

Evidence root: `C:\dev\Franks projekt\Nordverket\task-012\evidence`.

Final new-browser artifacts: `tmp/task012-descriptions-7dPKul/`:

- `snapshots.json`: all 69 case records; complete before/after graphs for mutations/rejections, counts and focus traces.
- `decision-1280.png`, `decision-375.png`, `decision-320.png`.

Rejected/cancelled cases compare full `{nodes,edges,state}` and all raw localStorage records, assert no object/edge/category change and require zero total storage writes (therefore zero graph/preference writes). Successful cases preserve existing nodes and immutable IDs except the approved description field, original/paused edge metadata, category records, unknown metadata and other language fields. Only the intended relationship/new nodes and established modification clocks change. Full cloud payload graphs and merge flag are asserted.

| Outcome | Graph saves | Local graph writes | Mock cloud writes | Preference writes |
| --- | ---: | ---: | ---: | ---: |
| Cancel / Escape / stale / invalid / no-change / picker cancel | 0 | 0 | 0 | 0 |
| Approved Save + link, local | 1 | 3 | 0 | 0 |
| Approved Discard + link, local | 1 | 3 | 0 | 0 |
| Approved Save or Discard + link, mocked cloud | 1 | 0 | 1 merge | 0 |
| Double-click / retained callback after completion | 0 additional | 0 additional | 0 additional | 0 |
| Unchanged editor + valid link | 1 | 3 locally / 0 on cloud | 0 locally / 1 on cloud | 0 |

The real local reload case compares complete graphs before/after reload and confirms both the approved description and A–B relationship survive. Cloud persistence is tested as an exact captured merge payload; production/cloud durability is not claimed or contacted.

## Isolation, preparation and limitations

Workspace: `C:\dev\Franks projekt\Nordverket\task-012`, separated into `development`, `qa-preparation` and `evidence`. `TEMP`/`TMP` were set to evidence/tmp for test processes. Synthetic libraries and disposable browser profiles only. Existing harness removes external SDK/config and disables Firebase startup, serves loopback with CSP, blocks external proxy traffic and uses fail-closed CDP interception. No production service, real library, credential, paid API, Digital GM dependency or unrelated project was accessed/modified.

Independent QA preparation: `../qa-preparation/README.md`. Independent QA must review the final immutable PR HEAD; these are developer regressions, not independent approval. Do not merge/deploy/enable auto-merge.

This guard is deliberately limited to object descriptions during linking. General navigation, unrelated rename/delete/category changes, category-note drafts and other TASK010 findings are not redesigned. Native headless Chromium is covered; other engines, assistive technology and real mobile virtual keyboards were not tested. Existing sync error handling/cloud durability/concurrency semantics remain unchanged; the one-save guarantee is not a new server-side transaction or durability guarantee.

**Original delivery status (superseded): READY FOR INDEPENDENT QA — NOT MERGED.**


**READY FOR INDEPENDENT RE-QA — NOT MERGED.**
