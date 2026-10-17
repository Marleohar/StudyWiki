# TASK 011 — Creation Dialog Keyboard Containment

**READY FOR INDEPENDENT QA — NOT MERGED.**

## Revision and scope

Repository: `Marleohar/StudyWiki`. Branch: `feat/task011-creation-dialog-containment`.
Verified unchanged main baseline: `a98f89fef5f7b0ebcbeb36ad3a628c2bee24a4e8` (checked before development and after tests).
Tested implementation commit: `3d46769bd68d460e483d6a5a988f9eac0bbc0a60`. Final delivery adds only this report; its immutable HEAD and PR URL are recorded in `../evidence/delivery.json` and the PR/delivery response.

Changed files:

- `index.html`
- `tests/creation-dialog-containment.test.cjs`
- `tests/browser-creation-dialog-containment.cjs`
- `TASK011-QA.md`

The correction addresses TASK 010 finding 1 only. Other audit findings remain open. No modal-system redesign, schema/persistence change, new dependency or terminology/layout configuration was introduced. All 198 baseline Node tests and all ten baseline Chromium scripts remain unmodified.

## Before reproduction

The original audit is `C:\dev\Franks projekt\Nordverket\task-010-audit\TASK010-AUDIT.md`.

1. In creative mode, open header search, enter a new title and activate Skapa.
2. Initial focus is Namn / Titel in Skapa ny nod.
3. Press Tab through description, Skapa and Avbryt, then continue.
4. Focus leaves the modal for body/background brand. Escape outside the modal fails to close it; Enter can activate the background brand while the creation modal remains open.

A disposable checkout at `evidence\baseline-checkout` was pinned to the required baseline and given only the new test files. Focused Node results: 18 tests, 13 fail / 5 pass, exit 1. Real Chromium fails the first containment traversal assertion, exit 1. Logs: `containment-baseline-node.txt` and `containment-baseline-browser.txt`. The earlier initial Node reproduction is retained as `containment-before-node.txt`. No development source was reverted to produce this evidence.

## Corrected behavior

Opening creation snapshots the previous inert state of each background body child and the creation root, temporarily enables the creation dialog and makes the background inert. Reentrant open calls retain the current title, description, category and original return target.

Tab and Shift+Tab explicitly cycle the current visible/enabled creation controls. Initial focus remains the title, preserving established behavior. The cyclic order is:

`Kategori / symbol → Namn / Titel → Beskrivning → Skapa → Avbryt → Kategori / symbol`

Native Chromium sequences, starting at the title:

- Forward: `modalFreeText → Skapa → Avbryt → creationCategory → modalTitle`, twice.
- Reverse: `creationCategory → Avbryt → Skapa → modalFreeText → modalTitle`, twice.

Disabled/hidden controls are skipped. Escape cancels, closes and restores prior inert values. A connected, available original trigger receives focus again. Detached, disabled, hidden, inert or missing return targets are not focused; any remaining focus inside the now-hidden dialog is blurred safely. Inactive cleanup does not indiscriminately clear inert flags.

Scoped document capture guards block background clicks while this creation workflow is active, including native and forced brand, library-switcher and search activation. Pointer presses on the backdrop/non-control area retain focus instead of blurring to body; focus attempts outside the active dialog redirect inward. Other workflows are unaffected when creation is inactive.

## Nested existing-object move confirmation

The existing confirmation remains the top interactive layer. Opening it snapshots both dialogs' prior inert states, makes creation inert and enables confirmation. Its existing two-button Tab/Shift+Tab and Escape behavior is retained.

Cancel/Nej/Escape restores the underlying creation state and title focus, preserving all entered values. The outer background remains inert until creation closes. Closing both restores the exact original states, including intentionally inert elements; no permanently inert app controls remain. Read-mode cleanup works from either layer.

Background/underlying creation Save and Cancel clicks cannot act while confirmation is active. A direct creation-save call is also rejected while a move confirmation is pending. The existing confirmation validation and move operation are unchanged; accepted confirmation performs one established move and repeated retained activation does not save again.

## Real-browser regression coverage

`tests/browser-creation-dialog-containment.cjs` uses native Chromium key/mouse input at **1280, 375 and 320 px**, with a 900 px viewport height. It verifies:

- Two complete forward/reverse cycles with the selector, title, description and both actions.
- Native clicks on the covered brand, library switcher and search, plus forced click/focus attempts: no navigation, library prompt or data write; focus stays inside.
- Title/description/category values survive traversal and background interaction.
- Escape from creation and explicit Avbryt restore the search/category trigger.
- Nested focus/Tab/Shift+Tab, blocked underlying Save/Cancel, Escape and Nej with retained draft fields.
- One-time nested move on local and mocked-cloud persistence, including retained confirmation activation.
- Read-mode transitions from both layers on both persistence paths.
- Detached, disabled and missing return-focus targets.
- Exact restoration of a deliberately inert sentinel and pre-existing dialog inert states; inactive close preserves them.
- Successful global-search creation retains both language-content values, exact selected category, new immutable ID, source records/metadata and expected navigation; its still-present search trigger regains focus.

Node tests exercise the same lifecycle boundaries, including no-op/reentrant open, skipped controls, recovery from missing active focus and forced underlying save rejection. No existing assertion was removed or weakened.

During development the new browser test exposed two additional containment details: a native backdrop click could blur the input, and closure without a usable trigger could leave focus on a hidden input. Both were corrected and the complete regressions rerun. Logs `browser-creation-dialog-containment.txt` and `browser-creation-dialog-containment-after-pointer.txt` retain those failed development attempts. Initial Node fixture failures involved a missing body method/control-query support; the new fixture was corrected and absent-query access handled safely without modifying old tests or their harness.

## Data preservation and exact writes

All cancelled/rejected/navigation-only interactions compare complete synthetic `{nodes,edges,state}` snapshots and require zero writes, including any preference writes. Snapshots retain IDs, fields in both languages, colors, categories, modification metadata, unknown nested fields, immigrant flags and active/paused edges.

| Action | Logical graph saves | Local graph writes | Mock cloud writes | Preference writes |
| --- | --- | --- | --- | --- |
| Tab/Shift+Tab, background native/forced activation, focus recovery | 0 | 0 | 0 | 0 |
| Escape/Avbryt/Nej, read-mode cleanup, rejected underlying save | 0 | 0 | 0 | 0 |
| Detached/missing trigger cleanup and ordinary navigation | 0 | 0 | 0 | 0 |
| Successful local creation | 1 | 3 | 0 | 0 |
| Successful cloud creation | 1 | 0 | 1 merge | 0 |
| Successful local existing-object move | 1 | 3 | 0 | 0 |
| Successful cloud existing-object move | 1 | 0 | 1 merge | 0 |
| Repeated retained confirmation after completion | 0 additional | 0 additional | 0 additional | 0 |

Successful creation preserves the existing `{sv,en}` description behavior and ordinary-member status. Move preserves the original object ID, both language fields and edge records, changing only established category/immigrant/clock fields. Complete cloud payloads and expected merge flag are asserted. No new persistence call or storage key was introduced.

Protected-source comparison confirms unchanged grouping/canonical ordering, TASK 009 strict read/save/migration helpers, long-press/capture behavior, TASK 008 source/target context guards and linking/category transactions, chain parser, sync, description rendering, templates, category mutation and nested confirmation validation. See `evidence\protected-methods.txt`. Only creation/confirmation containment cleanup and the pending-confirmation creation-save guard changed within this workflow.

## Final test results

| Command | Actual result |
| --- | --- |
| `node --test tests/*.test.cjs` | PASS: 216/216 (198 baseline + 18 new), 0 fail/skip/cancel |
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
| `git diff --check` | PASS |

The final complete eleven-suite browser run passed without cleanup errors. The focused suite was rerun after adding explicit checks for search-trigger focus on success and blocked underlying Cancel; it also passed. Logs: `node-tests.txt`, `final-browser-results.json`, `final-browser-*.txt`. All Node/browser assertions in those results ran against the delivered implementation.

## Evidence, setup and limitations

Root: `C:\dev\Franks projekt\Nordverket\task-011\evidence`.
Latest focused screenshots/snapshots: `tmp\task011-containment-MfiVEe`:

- `keyboard-1280.png`, `keyboard-375.png`, `keyboard-320.png`.
- `nested-1280.png`, `nested-375.png`, `nested-320.png`.
- `snapshots.json` — full before/after graphs, focus sequences and write counts.

Mobile creation/nested screenshots were visually inspected. All controls remain reachable and the focused element is visible. TEMP/TMP was set to this task's `evidence\tmp` before test processes. Node v24.12.0; Chrome/155.0.8059.84; repository's existing dependency-free CDP harness. No new tooling dependency or Digital GM-specific path was used. Firebase SDK/config/startup disabled before page execution; loopback servers, CSP/proxy and interception block external traffic. Synthetic libraries and disposable profiles only; no production Firebase, real user libraries, credentials or paid services were accessed. Digital GM and Ört-Wikin were untouched.

Native Chromium focus/keyboard behavior is verified; a real screen-reader audit, other browser engines and mobile OS virtual keyboards were not exercised. Existing client-side mode and cloud concurrency/durability limitations remain. Other TASK 010 findings were not changed. No merge, deployment or auto-merge was performed; independent QA remains required.

**READY FOR INDEPENDENT QA — NOT MERGED.**
