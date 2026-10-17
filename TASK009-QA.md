# TASK 009 — Persistent Category Sorting and Category Heading

Status: **READY FOR INDEPENDENT RE-QA — NOT MERGED**.

## Revision and scope

Repository: Marleohar/StudyWiki. Branch: `feat/task009-persistent-category-sorting`.
Verified main baseline: `0d41ca0e0858273176863115177fbd241b110541` (checked before development and after final tests).
Tested corrected implementation commit: `dca80e55cc20fb8fcf4d266c84888703d7f0eee5`. Original implementation: `6608204601ff32ff4d6ea42335e018f8e9694286`; rejected delivery: `69a9d24bd47af1eb38198c8371e5b975db5533da`. The final delivery commit adds only this report; its immutable SHA and PR URL are recorded in `../evidence/delivery.json` and the delivery response/PR.

Changed files:

- `index.html`
- `tests/category-sort-preferences.test.cjs`
- `tests/category-sort-migration-guard.test.cjs`
- `tests/browser-category-sort-migration-guard.cjs`
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

## Initial TASK 009 validation (superseded by correction results below)

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

**READY FOR INDEPENDENT RE-QA — NOT MERGED.**

## Blocking QA correction — unreliable migration reads

Independent QA rejected delivery `69a9d24bd47af1eb38198c8371e5b975db5533da`. When reading the browser preference record threw, whole-category symbol rename still mutated and saved the graph while preferences remained under the old symbol. Local reproduction: one graph save and three graph-storage writes. Mock-cloud reproduction: one graph save and one cloud write.

Cause: `readCategorySortPreferences()` returned the same empty default for absent data, access failures and malformed non-null data. `migrateCategorySortPreference()` interpreted that default as successful absence and allowed graph rename. The dialog also closed before checking operation success, hiding a failed migration.

Correction: `readCategorySortPreferencesStrict()` now returns a valid preference structure only after a successful read and validation. A successful literal null read is genuine absence; access exceptions, invalid JSON, null-valued JSON, unsupported versions, malformed entries, duplicate category records or excessive effective selections return a failure result. Migration rejects that result before any preference write, graph-record change or sync. The tolerant `readCategorySortPreferences()` wrapper continues returning defaults for ordinary view restoration, preserving existing sorting/display behavior and the storage format. Existing successful migrations, collisions and setItem failure guards remain.

The actual symbol dialog now closes only after a successful whole-category rename. Failure leaves it open on the original object, retains the entered symbol, and displays: `Kategorin ändrades inte. Sorteringsinställningarna kunde inte läsas eller sparas. Försök igen när webbläsarlagringen fungerar.` Retrying after access is restored succeeds. Malformed records are neither overwritten nor disassociated by migration; recovery tests explicitly repair invalid fixture data outside the application before retry, rather than claiming automatic repair.

Correction-only changed files:

- `index.html` — strict migration read, tolerant display wrapper, guarded dialog completion.
- `tests/category-sort-migration-guard.test.cjs` — 21 focused Node tests.
- `tests/browser-category-sort-migration-guard.cjs` — dedicated real-browser visible-dialog suite.
- `TASK009-QA.md` — current revision, cause, correction and validation evidence.

### Failing-before / passing-after evidence

A disposable rejected checkout at `evidence\rejected-checkout` was pinned to the rejected immutable HEAD, with only the new regression files copied in. The 21 new Node tests reported 20 FAIL / 1 PASS and exit 1; the genuine-absence success case was already valid. The new Chromium suite exited 1 on its first required rejection check. Logs: `correction-rejected-node.txt`, `correction-rejected-browser.txt`. The earlier initial focused run is also retained in `correction-before-node.txt`.

On corrected source, all 21 focused Node tests pass as part of the full suite. Real Chromium exercises the actual visible path: Byt kategori → Byt symbol för hela kategorin → type destination → Spara symbol. Its 22 cases comprise ten rejection/recovery cases on each of local and mocked-cloud persistence, plus successful genuine-absence rename on each path. Cases cover getItem exceptions with source settings, absent settings and a stale destination; invalid JSON, non-null JSON null, obsolete version, duplicate category entries, malformed shape, oversized selection; and setItem failure.

Every one of the 20 blocked browser operations verifies complete before/after graph snapshots, unchanged raw saved preferences, unchanged route, visible error/open dialog, no cloud payload, and exactly:

**0 graph saves / 0 graph-storage writes / 0 mocked cloud writes / 0 preference writes.**

Recovery uses the retained dialog after restoring access (or explicitly repairing malformed fixture data). Valid source settings move to the exact new symbol once; stale destination settings are replaced appropriately, unrelated category settings survive, and all graph fields/metadata/edges/clocks remain unchanged except the requested cosmetic symbol changes. The exact saved category name, literal heading suffix and unrelated records remain intact. Genuinely absent preferences remain absent and do not create a preference key.

| Successful recovery | Graph saves | Graph storage writes | Cloud writes | Preference writes |
| --- | --- | --- | --- | --- |
| Local, source preferences | 1 | 3 | 0 | 1 |
| Mock cloud, source preferences | 1 | 0 | 1 merge | 1 |
| Local, genuinely absent preferences | 1 | 3 | 0 | 0 |
| Mock cloud, genuinely absent preferences | 1 | 0 | 1 merge | 0 |

Complete recovered payloads are compared with expected nodes, edges and category state. Source-array order, unknown fields, language fields, active/paused associations and modification metadata are preserved.

The original independent QA Chromium reproduction and six-case Node migration matrix were reused against corrected source with only checkout/output paths adjusted. Both now exit 0; read/write failures produce zero writes and normal migration retains its exact established counts. Logs: `correction-original-browser-repro.txt`, `correction-original-node-repro.txt`. The independent QA checkout and its original failure evidence were untouched.

### Final correction validation

| Command | Actual result |
| --- | --- |
| `node --test tests/*.test.cjs` | PASS: 198/198 (177 existing + 21 new), 0 fail/skip/cancel |
| `node tests/browser-smoke.cjs` | PASS, exit 0 |
| `node tests/browser-category-moves.cjs` | PASS, exit 0 |
| `node tests/browser-header-search.cjs` | PASS, exit 0 |
| `node tests/browser-existing-object-transfer.cjs` | PASS, exit 0 |
| `node tests/browser-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-confirmed-relation-sorting.cjs` | PASS, exit 0 |
| `node tests/browser-page-ui.cjs` | PASS, exit 0 |
| `node tests/browser-smart-workflows.cjs` | PASS, exit 0 |
| `node tests/browser-category-sort-preferences.cjs` | PASS, exit 0 |
| `node tests/browser-category-sort-migration-guard.cjs` | PASS, exit 0; 22 cases including 20 zero-write rejections |
| `git diff --check` | PASS |

All ten browser commands passed on their first complete correction run; no Windows profile-cleanup error occurred. Earlier heading, sorting, scoping/restoration, six-criterion, malformed-view fallback, smart-linking and target-reference assertions were retained unchanged in this correction. No persistence-schema change, new dependency, data migration or sorting redesign was added.

Logs: `correction-node-tests.txt`, `correction-browser-results.json`, `correction-browser-*.txt`. Latest dedicated evidence: `evidence\tmp\task009-migration-guard-ZmKDhw\snapshots.json` and `blocked-symbol-dialog.png`. The blocked dialog screenshot was visually inspected. Earlier desktop/mobile heading screenshots remain available in the task evidence.

All tests remain synthetic and offline: Firebase startup disabled, external network blocked, disposable profiles and TEMP/TMP under this task's evidence directory. No production libraries/services, credentials or paid APIs were accessed. Digital GM and Ört-Wikin were untouched. Browser-local preference and inherited cloud durability/concurrency limitations remain as documented above; display fallback intentionally remains tolerant. A malformed record must be repaired explicitly before whole-category migration can proceed.

Tested correction implementation: `dca80e55cc20fb8fcf4d266c84888703d7f0eee5`. Final delivery adds only this report update; its immutable HEAD is recorded in the PR, delivery response and `evidence\correction-delivery.json`.

**READY FOR INDEPENDENT RE-QA — NOT MERGED.** No merge, deployment or auto-merge was performed.