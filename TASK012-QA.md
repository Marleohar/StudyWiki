# TASK 012 — Protect Unsaved Object Descriptions

**READY FOR INDEPENDENT QA — NOT MERGED.**

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

**READY FOR INDEPENDENT QA — NOT MERGED.**
