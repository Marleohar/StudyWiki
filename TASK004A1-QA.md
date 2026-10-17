# TASK 004A.1 — existing-object transfer from category creation

Status: READY FOR INDEPENDENT QA — NOT MERGED.
Base: `cfbdbcf7b86642d527675984239002b30083952f`.
Branch: `feat/task004a1-existing-object-transfer`.
Exact delivery HEAD is recorded in the PR and final delivery (`git rev-parse HEAD`).

The category-page button explicitly passes its exact symbol into the existing
creation dialog. Only that captured origin enables the occupied-name transfer
question. The chosen destination is the selector value, including changes made
after opening. Global-search duplicate validation and exact-name navigation stay
unchanged. Matching uses the existing trimmed, case-insensitive title policy.

The literal-text Ja/Nej confirmation names the existing title, source and selected
destination. It sits above the inert creation form, initially focuses Nej, cycles
Tab/Shift+Tab between its buttons, and returns focus to the preserved title field
on Nej/Escape. Same-category duplicates show an explanatory message and never
offer a move. No duplicate node is generated.

Ja revalidates creative mode, library identity/load revision, pending category
origin, title/immutable ID, source, selected destination, valid category options,
and the complete nodes/edges/category-state snapshot. Changed state aborts both
dialogs and asks the user to reopen. This deliberately rejects even unrelated
library edits while confirmation is open. The snapshot is in memory only.
A repeated confirmation after closing cannot save again.

Success calls the unchanged TASK 003A `moveNodeCategory()` method. Only the moved
node's icon/immigrant flag and the established move clocks change. Existing ID,
title, color, both language fields, all unknown nested fields, all other nodes,
category records and active/paused edge records remain intact. Unsaved creation
notes are ignored. The existing move implementation navigates to the original ID.
No persistence/data-model changes, dependencies or migrations were added.

## Validation (2026-10-17)

Windows, Node v24.12.0, Chrome/155.0.8059.84. Independent checkout under the OS
temporary directory; no Digital GM or Franks-projekt dependencies or files used.
Existing dependency-free Node/CDP tooling and installed Chrome are sufficient.
Browser commands run outside the managed sandbox because prior QA established
that sandbox prevents CDP Network.enable; harness network restrictions remain.

| Command | Result |
| --- | --- |
| `node --test tests/*.test.cjs` | 97/97 PASS (81 existing + 16 new) |
| `node tests/browser-smoke.cjs` | PASS |
| `node tests/browser-category-moves.cjs` | PASS |
| `node tests/browser-header-search.cjs` | PASS; 1280/375/320 px layout retained |
| `node tests/browser-existing-object-transfer.cjs` | PASS |
| `git diff --check` | PASS |

The new Node suite tests affirmative transfer, cancellation, same-category no-op,
case matching, exact hostile/Unicode symbols, complete record/edge preservation,
read/library/revision/deletion/rename/metadata/source/destination/edge staleness,
global-creation isolation and ordinary unique creation.
The dedicated real Chromium suite drives the actual category button, input,
selector, Ja/Nej, Tab/Shift+Tab and Escape; tests special text, both cancellation
paths, stacking, successful transfer, same-category rejection, live metadata/read/
library changes, global duplicate rejection and unique creation.
Prior suites retain pointer capture release at 150 ms, 800 ms presses, mouse/touch
cancellation, immigrant template exclusion/restoration, collision rejection and
CDP cancellation correlation. No interception protections were changed.

The existing header browser suite initially failed after its duplicate-name
scenario opened the newly required confirmation. It now explicitly declines that
confirmation before the original tamper/name-edit scenarios. Every previous
assertion is retained; no application behavior was weakened to accommodate it.
An initial new-test run exposed a Windows pipe encoding issue in the edit script;
source strings were corrected and the complete 97-test run passed.

## Preservation and writes

- Nej/Escape, navigation, already-in-category, rejected inputs, stale confirmation,
  read mode and global duplicate rejection: complete synthetic snapshots unchanged
  relative to the state being protected; zero sync calls and zero storage writes.
- Accepted transfer: exactly one logical save, three existing local-storage keys;
  no new object, immutable ID retained, immigrant flag true; original active and
  paused edges (including nested unknown metadata) deeply equal before/after.
  Existing title/color/language/unknown node fields remain equal. Approved move
  clocks follow the unchanged TASK 003A semantics.
- New unique creation still performs one save/three writes and does not set an
  immigrant flag. No unsaved creation notes enter an existing object.
- All browser tests use synthetic disposable libraries/profiles, strip remote
  Firebase SDK/configuration/initialization before startup and block external
  requests with the existing CDP interceptor, loopback-only CSP and blocked proxy.
  Successful suites report no page errors, injected payloads or external requests.
  No actual library, production Firebase, paid API or credentials were accessed.

Inherited limitations remain: client-side creative mode is not server
authorization; whole-array cloud synchronization/concurrent-writer risks and
legacy route/free-text rendering limitations are unchanged. Offline/mocked tests
do not establish live-cloud authorization or durability. Confirmation detects
observed in-memory changes, not unseen concurrent server writes. No relation
sorting, cloud discovery, advanced cells or unrelated features were implemented.

Changed files: `index.html`, `tests/existing-object-transfer.test.cjs`,
`tests/browser-existing-object-transfer.cjs`, `tests/browser-header-search.cjs`,
`TASK004A1-QA.md`.
