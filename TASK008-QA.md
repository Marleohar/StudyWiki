# TASK 008 — Smart Quick Linking and Category Selection

Status: READY FOR RE-REVIEW AND INDEPENDENT QA — NOT MERGED.

## Revision identity

Repository: Marleohar/StudyWiki. Branch: feat/task008-smart-linking-category-selection.

Verified main baseline: `b1bf7d8fc0e93ca7b20f848a2034c5db6d004ec9`.
Tested corrected implementation commit: `09bf2021fa79e882a77aac3fbbe38fdc7174f0c7`. Original implementation: `f1dfb46d2d2513a002633d082a002db5ba4092e8`; rejected delivery: `dfad5ec19aca6594daf43d6eeedae5c9af565841`.
The delivery commit adds only this report to that implementation. Its immutable SHA is recorded in the PR and `../evidence/delivery.json`; this avoids a self-referential commit hash inside this file. Main was rechecked unchanged before delivery.

## Changed files

- `index.html`
- `tests/browser-category-moves.cjs`
- `tests/browser-header-search.cjs`
- `tests/browser-page-ui.cjs`
- `tests/category-moves.test.cjs`
- `tests/smart-workflows.test.cjs`
- `tests/smart-target-identity.test.cjs`
- `tests/browser-smart-workflows.cjs`
- `TASK008-QA.md`

## User-visible changes

The former inline chain field/manual-link button becomes a single-object quick-link field. Suggestions display the actual symbol and title as literal text. Duplicate titles require an explicit immutable-ID selection; all exact duplicate matches remain selectable even beyond the normal eight-result suggestion limit. Mouse, touch and arrow/Enter selection work. Existing objects use blue Länka; unknown titles use green Skapa, including hover. Punctuation in a title never implicitly invokes the chain parser.

Linking stays on the source page, refreshes its relationships and returns focus to the field. Self-links and already-active links are no-ops. Paused-only relationships use the existing restoration semantics. Active-plus-paused duplicates remain completely unchanged when an active match already exists.

Skapa retains the entered title and opens an explicit category picker. Existing member categories and metadata-only empty categories are available. Enter on a suggestion selects it without creating immediately. Confirmation validates the retained title, collisions and context, then adds the ordinary object and relationship in one logical save. Cancellation creates nothing and returns focus to the quick-link field. Newly created objects are not immigrants.

Byt Kategori now opens the searchable picker directly, including symbol long-press and F2 entry points. Search accepts a category name or its exact symbol; the resolved symbol is displayed on the left with its associated name. Duplicate category names remain separate identities and require an explicit symbol selection. Moving changes only the chosen object through the established move semantics.

Ny kategori is a distinct path requiring both a nonempty name and a nonblank, unique exact symbol. Existing category-name associations and occupied symbols reject without partial mutation. Accepted creation appends category metadata and moves the object atomically in one logical save. The separate Byt symbol för hela kategorin action opens the existing whole-category operation; an ordinary move does not rename a whole category.

Advanced relationship chains remain available in the discoverable Avancerade relationskedjor disclosure with a dedicated Bygg kedja action. The existing colon, semicolon and comma parser is unchanged. Existing manual-link compatibility methods remain, but the redundant visible manual-link button is removed.

## State and preservation protections

Transactions capture source identity, originating page, library/revision, view generation, category record references and a complete database snapshot. Read mode, route/library changes, rerenders, replaced/deleted/renamed records, category changes, closed dialogs and repeated retained controls reject stale operations. Draft title and visible category association are checked again at confirmation. An open transaction blocks retained background quick-link/chain actions. Dialogs make the background inert, wrap Tab focus and support Escape.

Complete synthetic snapshots verify existing immutable IDs, unrelated records, edge metadata/status, unknown fields and both language-content fields. Existing source-array order remains unchanged except for intentional new-record appends. Category moves use existing immigrant/clock semantics; whole-category rename retains its established semantics. New workflow saves preserve edges. Navigation, selection, cancellation, active-link no-ops and rejected operations produce zero logical saves, zero localStorage writes and zero mocked Firestore writes. Successful mutations produce one logical save; the established local path writes three storage records. Mock cloud transactions produce one merge write and zero local fallback writes, with both sides of the atomic change in the payload.

The existing chain parser, relation mutation helpers, category move/rename helpers, sorting/grouping helpers, six-criterion boundary, template selection, search matching, bindLongPress and sync implementations were compared with the baseline and remain unchanged (`../evidence/protected-methods.txt`). Editing entry points and stale-state guards changed intentionally. Existing browser assertions were adapted to the new picker entry points; legacy semantic tests still exercise retained compatibility methods. Assertions for snapshots, timing, persistence and identity were retained.

## Validation

All tests used synthetic libraries and disposable Chromium profiles. TEMP and TMP were set to `C:\dev\Franks projekt\Nordverket\task-008\evidence\tmp` before processes using temporary directories. The repository's existing browser harness supplied Chromium isolation; no Digital GM dependency path, new package or production library was used. Firebase startup was removed from the test page before execution. External requests were blocked by the existing harness. No production data/services, paid APIs or credentials were accessed.

| Command | Result |
| --- | --- |
| `node --test tests/*.test.cjs` | PASS: 159/159; 126 baseline plus 27 initial workflow and six target-identity tests; no skips |
| `node tests/browser-smoke.cjs` | PASS |
| `node tests/browser-category-moves.cjs` | PASS |
| `node tests/browser-header-search.cjs` | PASS |
| `node tests/browser-existing-object-transfer.cjs` | PASS |
| `node tests/browser-relation-sorting.cjs` | PASS on fresh-process rerun; cleanup limitation below |
| `node tests/browser-confirmed-relation-sorting.cjs` | PASS |
| `node tests/browser-page-ui.cjs` | PASS |
| `node tests/browser-smart-workflows.cjs` | PASS |
| `git diff --check` | PASS |

Dedicated real Chromium coverage includes mouse/keyboard/touch linking, duplicate IDs/titles, punctuation and hostile literal content, paused restoration, no-op links, create/cancel/focus, category-name/symbol association, duplicate category names, metadata-only destinations, new-category collisions and atomic success, separate whole-category rename, advanced chains, modal focus/inert behavior, read mode and ten stale-context cases. Mock cloud writes and full before/after snapshots are asserted. Layout checks pass at 1280, 375 and 320 pixels without horizontal overflow. Browser version: Chrome/155.0.8059.84.

Evidence root: `C:\dev\Franks projekt\Nordverket\task-008\evidence`. Full command logs are `node-tests.txt` and the corresponding `browser-*.txt` files. Dedicated screenshots and complete snapshots are in `tmp\task008-smart-LdQ8B6`:

- `category-picker-1280.png`
- `category-picker-375.png`
- `category-picker-320.png`
- `quick-link-320.png`
- `snapshots.json`

During development, tests exposed a generic hover rule overriding green Skapa, cancellation focus returning to its button, and a category guard assuming metadata existed in older fixtures. These were corrected in source; existing fixture expectations were not weakened. The final 153-test run passes.

One full-run sorting browser process passed its application assertions but failed during disposable-profile deletion with Windows EPERM in the unchanged shared browser harness. The unchanged command passed in a fresh independent process. Both logs are retained: `browser-relation-sorting-cleanup-failure.txt` and `browser-relation-sorting.cjs.txt`. This is a remaining harness cleanup limitation, not counted as a successful first run or silently suppressed. The shared harness was not changed.

## Remaining limitations and product decisions

New named categories require an explicit name and symbol; duplicate existing category names require exact selection, and creating another category with an existing name is rejected. These are deliberately narrow policies rather than a new category identity model. No schema migration, configurable terminology, bilingual UI, relationship redesign or TASK 009 work was added.

Inherited client-side mode controls are not server authorization. Whole-array cloud saves retain concurrent-write limitations, and invoking sync does not establish remote durability. Existing loading/normalization and unrelated rendering paths were not redesigned; malformed historical records and unrelated legacy HTML rendering remain outside this task's guarantees. The explicitly invoked legacy chain parser retains its historical punctuation semantics. Conservative snapshot guards cancel transactions even after unrelated library edits. Successful mutations rerender their source view and may reset other transient editor state, consistent with existing behavior.

No merge, deployment or auto-merge was performed. Independent QA is still required.

## Blocking QA correction — identical-field target replacement

Independent QA rejected `dfad5ec19aca6594daf43d6eeedae5c9af565841`: a selected target or retained suggestion remained usable after replacement with a different JavaScript object containing identical fields and the same immutable ID. The old path created an edge and produced one logical save plus three localStorage writes, or one mocked cloud write.

Cause: `captureSmartContext` retained the source and category record references, but the JSON database snapshot could not distinguish an identical-field target replacement. `quickLinkResolution` looked up the current target by ID, and suggestion callbacks retained only ID/title. The old controls could therefore silently act on a replacement instance.

Correction: smart contexts now retain an ephemeral ordered array of node references. `smartContextValid` requires the current node count and every node reference to match before the existing permission, page, library/revision, category-reference and complete-snapshot checks. This single guard already runs in suggestion callbacks and in `commitQuickLink` before target resolution, relationship mutation or persistence, covering unique-title resolution, explicitly selected duplicate titles, retained buttons and keyboard activation. JSON equality remains an additional check, rather than the sole identity check. No persistence, schema, relationship, category, creation or chain behavior was changed. The policy is deliberately conservative: replacement of any node invalidates the current smart transaction, even when all serialized fields are equal. Reopening the view captures current references and restores valid operation.

Changed files for this correction only:

- `index.html` — node-reference capture/validation plus explanation; two existing implementation lines changed.
- `tests/smart-target-identity.test.cjs` — six focused Node cases.
- `tests/browser-smart-workflows.cjs` — six additional real Chromium scenarios; earlier assertions retained.
- `TASK008-QA.md` — updated revision, results and correction evidence.

The six Node cases failed against the rejected source before the fix (`target-identity-before.txt`) and all pass afterward (`target-identity-after.txt`). Three entry scenarios are exercised against both local and mocked cloud persistence: a unique-title target, an explicitly selected duplicate-title target, and an old suggestion. Each replaces B with an identical-field clone and verifies a different object reference. Retained button activation and direct confirmation reject; complete before/after library snapshots remain equal, with **0 saves / 0 localStorage writes / 0 mocked cloud writes**. Reopening the source view and explicitly selecting B succeeds exactly once, preserves complete existing records and metadata, and creates only the intended edge and established clock changes. Local success: **1 save / 3 storage writes / 0 cloud writes**. Cloud success: **1 save / 0 storage writes / 1 merge write**, with the complete expected nodes, edges and category state in the payload.

Real Chromium repeats the same six scenarios through Enter, a real mouse click and retained action/suggestion elements. Old controls remain rejected after the fresh successful operation as well. Full rejected snapshots and exact rejected/fresh write counts are saved as `targetIdentity` in the latest `snapshots.json`. Every rejected case reports `[0,0,0]` for saves, storage writes and mocked cloud writes. Fresh selection works for both unique and duplicate names, stays on A and returns focus to quick linking.

The original independent QA scripts were copied into development evidence and rerun against the corrected source without altering the QA checkout. The original real-browser selected-target and old-suggestion reproductions now PASS with zero writes, along with the twelve-identical-title touch and comma/semicolon/colon chain checks. The independent mocked-cloud matrix now passes all ten source/target/category/mode/library/revision cases with zero writes. Logs: `correction-original-repro.txt` and `correction-original-cloud-repro.txt`.

Latest complete validation on the corrected implementation:

| Command | Actual result |
| --- | --- |
| `node --test tests/*.test.cjs` | PASS: 159/159, zero fail/skip/cancel |
| `node tests/browser-smoke.cjs` | PASS, exit 0 |
| `node tests/browser-category-moves.cjs` | PASS, exit 0 |
| `node tests/browser-header-search.cjs` | PASS, exit 0 |
| `node tests/browser-existing-object-transfer.cjs` | PASS, exit 0 |
| `node tests/browser-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-confirmed-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-page-ui.cjs` | PASS, exit 0 |
| `node tests/browser-smart-workflows.cjs` | PASS, exit 0, including six target-identity scenarios |
| `git diff --check` | PASS |

All eight browser commands passed on their first correction validation attempt; no cleanup error occurred in these runs. The earlier Windows profile-cleanup incident remains documented above rather than erased. Logs are `correction-node-tests.txt`, `correction-browser-results.json` and `correction-browser-*.txt`. The latest dedicated snapshots and 1280/375/320 screenshots are in `evidence\tmp\task008-smart-eFzzAC`. Both focused and complete suites retain all earlier valid linking, atomic creation, category selection/creation, advanced-chain, long-press/F2, sorting, template and read-mode assertions.

This correction used the same isolated synthetic setup: Firebase disabled, external network blocked, disposable profiles and task-local TEMP/TMP. No production data/services, credentials or paid APIs were accessed. No Digital GM or Ört-Wikin files were modified. The final delivery commit adds only this updated report to tested correction commit `09bf2021fa79e882a77aac3fbbe38fdc7174f0c7`; its immutable SHA is recorded in the PR and `evidence\correction-delivery.json`.

**READY FOR RE-REVIEW AND INDEPENDENT QA — NOT MERGED.** No merge, deployment or auto-merge was performed; independent approval is still required.