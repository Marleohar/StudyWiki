# TASK 009 — Persistent Category Sorting and Category Heading

Status: **READY FOR INDEPENDENT QA — NOT MERGED**.

## Revision and scope

Repository: Marleohar/StudyWiki. Branch: `feat/task009-persistent-category-sorting`.
Verified main baseline: `0d41ca0e0858273176863115177fbd241b110541` (checked before development and after final tests).
Tested implementation commit: `6608204601ff32ff4d6ea42335e018f8e9694286`. The final delivery commit adds only this report; its immutable SHA and PR URL are recorded in `../evidence/delivery.json` and the delivery response/PR.

Changed files:

- `index.html`
- `tests/category-sort-preferences.test.cjs`
- `tests/browser-category-sort-preferences.cjs`
- `tests/relation-sorting.test.cjs`
- `tests/confirmed-relation-sorting.test.cjs`
- `tests/page-ui.test.cjs`
- `tests/browser-relation-sorting.cjs`
- `tests/browser-confirmed-relation-sorting.cjs`
- `TASK009-QA.md`

## Behavior

Category headings now append one interface-owned ` (kategori)` immediately after the saved category name. Name and suffix are separate safe text nodes within one wrapping name group. Renaming updates only the name span, so the suffix survives without accumulating. Names/symbols in stored records are unchanged by rendering; the pre-existing uppercase symbol presentation remains. Long names and symbols wrap within mobile bounds. Screenshot inspection caught an initially cramped long-symbol layout; the final CSS limits the symbol's width and lets the adjacent name wrap.

Previously every new category view reset to alphabetical with no criteria, and switching to alphabetical cleared selection. A category now restores its last explicitly selected mode and criterion IDs. Alphabetical mode retains the chosen relation criteria; switching back shows them again. Read mode can change personal preferences just as it could previously change transient sorting.

## Durable browser preference format

Preferences are separate from library graph data:

- Key: `nv_category_sort_v1:` followed by `JSON.stringify(currentLibrary)`.
- Value: `{version:1,categories:[[exactSymbol,{mode:'alphabetical'|'relations',ids:[immutableObjectIds]}],...]}`.
- A JSON-encoded library key and array entries preserve arbitrary names/symbols without delimiter or object-prototype collisions. No category display name is used as identity.
- Valid IDs are deduplicated and limited to six. Existing criteria use the unchanged Swedish/natural-name canonical ordering and ID tie-break; unavailable IDs remain stored/removable after available criteria in deterministic ID order.
- Rendering, navigation, restoration, searching and grouping never persist preferences. Only explicit mode changes, successful Add, Remove and nonempty Clear All update the preference store. Repeated unchanged mode changes and rejected duplicate/seventh additions do not write.
- Criterion rename preserves the selected immutable ID, with live canonical presentation. Unavailable criteria are excluded by the existing grouping algorithm and displayed as `Otillgängligt objekt (ID)` with Remove and Clear All plus an explanatory status message. They still count toward the six-slot limit until explicitly removed. Rendering never silently purges them from storage.
- Invalid JSON, old/unknown versions, invalid modes/types, duplicate category entries and oversized effective selections restore defaults without crashes or writes. Duplicate IDs normalize in memory without repair writes. Validation is deliberately strict: a malformed library preference payload is ignored as a whole; an explicit later preference action can replace that invalid payload.
- Storage denial is caught. Sorting can continue transiently, with a status explaining that the setting could not be saved. It never falls back to graph/cloud persistence.

Category name edits leave preferences untouched. Accepted whole-category symbol rename moves the source preference to the exact destination symbol and removes the old entry in one atomic localStorage write for that library. A stale preference at an otherwise unoccupied destination is replaced by the source configuration, not inherited. If there is no source preference, a stale destination preference is cleared instead. Existing graph collision validation runs first. A failed preference write rejects the symbol rename before graph mutation. Other category/library preferences remain intact. The established graph save for the explicitly requested category edit remains one logical save; preference-only operations never call sync or Firestore.

This is browser-only persistence, not cross-device or account synchronization. No preference field is added to nodes, edges, categories or cloud payloads.

## Preservation and write counts

Full synthetic library snapshots include immutable IDs, source-array order, colors, immigrant flags, both language fields, unknown nested metadata, category names/notes/symbols, modification records and active/paused edge attributes. Sorting-only snapshots remain exactly equal before and after. No graph normalization or record rewrite is introduced.

| Operation | Preference writes | Graph storage writes | Logical graph saves | Mock cloud writes |
| --- | --- | --- | --- | --- |
| First explicit relations mode | 1 | 0 | 0 | 0 |
| Each valid Add / Remove / nonempty Clear All | 1 | 0 | 0 | 0 |
| Toggle mode with retained IDs | 1 | 0 | 0 | 0 |
| Unchanged mode, duplicate/seventh Add, empty Clear | 0 | 0 | 0 | 0 |
| Open/restore/rerender/search/group/navigation/reload | 0 | 0 | 0 | 0 |
| Category name rename (mock cloud path) | 0 | 0 | 1 | 1 |
| Symbol rename with source preference (mock cloud path) | 1 | 0 | 1 | 1 |

Focused Node coverage asserts exactly seven preference writes for mode, two Adds, alphabetical toggle, relation toggle, Remove and Clear, with zero further writes on restoration/calculation/empty Clear. Real Chromium asserts initial mode plus two Adds = three preference writes; alphabetical toggle = fourth; navigation restores without another write. Reload and simulated reopened-session restoration produce zero writes. Complete sorting-only snapshots and migration evidence are retained in the dedicated suite's `snapshots.json`.

The grouping algorithm, canonical matching/order, title comparator, long-press/pointer/F2 implementation, TASK 008 source/target identity guards and link/create/category transaction helpers, chain parser, sync, template selection and single-object category move helper were compared with baseline and are unchanged (`../evidence/protected-methods.txt`). Only the existing symbol-rename operation gains the required preference-migration guard.

## Regression assertion changes

Three existing Node files accommodate the wrapping suffix group and retained selections instead of clearing on alphabetical mode. Graph snapshot/save assertions remain; UI preference cases additionally assert exactly one preference key rather than zero total storage keys. Pure grouping tests still require zero writes.

The two existing sorting Chromium scripts count preference writes separately from total storage writes, preserving zero graph-write, zero-save, zero-cloud and full snapshot assertions. Existing reset expectations now assert restoration; the deleted criterion remains as an unavailable selected ID. A focused rename scenario explicitly clears first to test its original single-criterion grouping. Membership, headings, permutation comparisons, six-limit/forced-click, touch, keyboard, long-press/F2, templates and library-switch assertions remain. No unrelated tests or historical reports were removed or rewritten.

## Final validation

| Command | Actual result |
| --- | --- |
| `node --test tests/*.test.cjs` | PASS: 177/177 (159 baseline + 18 new), 0 fail/skip/cancel |
| `node tests/browser-smoke.cjs` | PASS, exit 0 |
| `node tests/browser-category-moves.cjs` | PASS, exit 0 |
| `node tests/browser-header-search.cjs` | PASS, exit 0 |
| `node tests/browser-existing-object-transfer.cjs` | PASS, exit 0 |
| `node tests/browser-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-confirmed-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-page-ui.cjs` | PASS, exit 0 |
| `node tests/browser-smart-workflows.cjs` | PASS, exit 0 |
| `node tests/browser-category-sort-preferences.cjs` | PASS, exit 0; two fresh Chromium processes |
| `git diff --check` | PASS |

Final nine-suite run: all nine commands pass, with no Windows profile-cleanup failures. Earlier development failures came from expected old transient-state assertions, a new fixture accidentally appending a duplicate category record instead of naming the existing one, and a new test helper attempting to JSON-clone undefined. Those test setup/expectation issues were corrected; the final results above are from the delivered source. The mobile layout issue was corrected in source and final suites rerun.

New Node/Chromium tests cover exact suffix/rename/literal content, alphabetical/relation persistence, navigation/reload, simulated new browser session, distinct category/library scoping, retained criteria on toggles, removal/Clear, restored six-limit, renamed/missing criteria, safe category-name/symbol migration, malformed/old preferences, stale controls and storage failure. The browser session simulation exports durable preference storage, closes the first disposable browser and imports it alongside the same synthetic graph into a fresh profile/process, then reloads; it verifies zero restoration writes. It does not claim an OS crash-recovery test.

## Evidence and isolation

Root: `C:\dev\Franks projekt\Nordverket\task-009\evidence`.
Logs: `node-tests.txt`, `final-browser-results.json`, `final-browser-*.txt`.
Dedicated snapshots/screenshots: `tmp\task009-preferences-tG5KAc`:

- `snapshots.json` — complete original/sorting-only graph snapshots, migration result and exported preferences.
- `preferences-1280.png`
- `preferences-375.png`
- `preferences-320.png`

All three widths pass document-overflow and heading-bounds assertions. Long Unicode/markup-like content wraps literally; no injected markup executes. Existing sorting/page suites also retain their layout screenshots. TEMP/TMP were set to the task's `evidence\tmp` before every test process. Node v24.12.0 and Chrome/155.0.8059.84; dependency-free existing CDP harness, no new dependency or Digital GM test path. Firebase SDK/config/startup disabled before browser execution; synthetic loopback libraries, existing CSP/proxy/interception block external requests. No production libraries, services, paid APIs or credentials were accessed. Digital GM and Ört-Wikin were untouched.

## Limitations

Preferences belong to this browser storage and exact library name, with no cross-device synchronization. Browser storage removal/private sessions/quota restrictions can prevent durable restoration; save failure is reported. Strict malformed-store rejection is conservative and does not attempt automatic repair. Unavailable choices can use one of the six slots until removed. Whole-category preference migration is atomic within one browser storage record, not a distributed transaction with remote graph persistence; existing cloud durability/concurrent-save limitations remain. Client-side mode controls are not server authorization. Existing unrelated loading/legacy-rendering behavior is outside this focused change.

No merge, deployment or auto-merge was performed. Independent QA is required.

**READY FOR INDEPENDENT QA — NOT MERGED.**
