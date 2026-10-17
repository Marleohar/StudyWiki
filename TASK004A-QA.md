# TASK 004A - compact header, smart search and category-aware creation

Status: READY FOR INDEPENDENT QA - NOT MERGED.
Repository: `Marleohar/StudyWiki` (Nördverket only).
Verified main baseline: `3592af06ed932357b0c2c8284b07dd083638faa3`.
Branch: `feat/task004a-header-search`.
The immutable feature HEAD is recorded in the PR/final delivery; identify this
checkout with `git rev-parse HEAD`.

## Result and interaction decisions

The collapsed header has four grid children in one row: brand/overview, book and
active library, icon-only search, and a prominent vertical ellipsis. Long library
names truncate with ellipsis while their full text remains in the button title
and accessible label. The desktop logo is hidden at narrow widths to retain the
brand text and all controls. Neither mode nor status consumes a permanent header
slot. The old New Node and Batch buttons are removed; their underlying creation,
parser and batch methods remain.

The menu exposes the unchanged mode/password workflow through an action labeled
`Lås upp skaparläge` or `Lås skaparläge`. Its footer shows a small
connection dot, the existing connecting/synced/local signal and `Skapar-läge`
when appropriate. Status changes update the already-open menu. Escape, outside
pointer-down and choosing the action close it; keyboard focus returns to the
toggle on Escape/action. No credentials or authorization policy were changed.
Status labels reflect existing repository callbacks, not a new cloud durability
guarantee.

Search opens a separate row and focuses its combobox. The toggle closes it and
clears only transient suggestions; it preserves the query/current object. Escape
first dismisses an open suggestion list, then closes the row. Header/menu/search
updates do not render the main page or reset its long-press revision/timer.

Autocomplete uses the current `nodes` array only, folds case, ranks prefix matches
before substring matches, and sorts by folded title and stable ID using code-unit
comparison. It shows at most eight options and a literal empty-result message.
Arrow keys wrap an active selection; Enter selects only a deliberately active
option, otherwise it follows the visible action. Options retain input focus on
pointer-down so mouse/touch clicks are not defeated by input blur. User strings
enter DOM text/value properties, never executable HTML handlers.

Exact names use the existing trimmed, case-insensitive identity policy and show
`Gå till`. Missing names show `Skapa`: creative mode opens the existing dialog
with a prefilled title rather than creating immediately. Read mode exposes an
aria-disabled unavailable action and inline unlock guidance; clicking/Enter only
explains the lock. Empty/whitespace queries disable the action and do nothing.
The shared datalist remains for unrelated forms.

Existing sync/load paths refresh suggestions through `updateDatalist`; rename,
creation, deletion and other saved edits therefore update the search UI. Library
switching clears the query, options, menu and creation context. Suggestion closures
check library identity, and a per-load in-memory revision rejects obsolete cloud
snapshot/error callbacks after a switch. The revision is never stored. No cloud
library enumeration was introduced.

## Category metadata and creation

An optional `name` belongs to an existing `symbolCategories.categories` record:

```json
{ "symbol": "exact-symbol", "name": "Human-readable name", "notes": "Existing notes", "unknown": { "kept": true } }
```

The schema version remains 1; names are additive metadata, never category IDs.
Legacy unnamed categories display their exact symbol plus `Namnlös kategori`.
Names are never inferred from object titles or category notes. Viewing, searching
and building options create no records and normalize no legacy field values.

The category page adds a creative-only name editor. Actual name edits trim the
submitted name, update the first existing matching record (or append one only
when naming a previously unrecorded category), and save once. Unchanged values,
including unchanged legacy whitespace, do not save. Clearing removes only the
name field, retaining notes/unknown metadata and the category record. Existing
legacy duplicate records are not cleaned up; this operation never adds another
record for an already represented symbol. Category-wide symbol rename continues
to preserve the optional name and all other metadata.

The existing creation dialog now has a native, keyboard/scroll-accessible select
above the title. Options are the exact-symbol union of resolved object icons and
stored category records, deduplicated without changing storage. Labels combine
symbol and saved/neutral name; option values contain only the exact symbol.
Metadata-only categories remain selectable. An entirely empty library offers the
existing `&` default explicitly. Category-page creation preselects its exact
origin; for an empty not-yet-stored category view, a transient origin option
preserves the prior category-page creation behavior without writing metadata.
Search creation uses the current category when relevant; otherwise it chooses
`&` if available, then the first deterministic option.

The user may select another category before saving. Opening/canceling/selecting
writes nothing. Empty titles, case-insensitive duplicates, tampered selections,
stale-library dialogs and read mode are rejected. Success preserves the existing
random-ID generation, color and `{sv, en}` free-text shape, adds an ordinary node
without an immigrant flag, records its existing creation clock, performs one
logical save and navigates to it. Initial category selection does not call the
existing-object move mechanism. Creation and category-name saves use the existing
`preserveEdges` option so these actions do not trigger unrelated edge cleanup.
The sync implementation itself is unchanged.

## Validation executed 2026-10-17

Windows; Node `v24.12.0`; headless Chromium `Chrome/155.0.8059.84`.
No package installation, new dependencies or other project tooling is needed.
Tests use Node built-ins, the existing CDP harness and installed Chrome/Edge;
`STUDYWIKI_TEST_BROWSER` may select the executable.

Exact commands from this repository root:

```text
node --test tests/*.test.cjs
node tests/browser-smoke.cjs
node tests/browser-category-moves.cjs
node tests/browser-header-search.cjs
git diff --check
```

| Check | Result |
| --- | --- |
| Baseline before changes | 64/64 Node PASS |
| Final Node | 81/81 PASS; 0 failures, skipped, cancelled or TODO |
| Original browser smoke | PASS |
| TASK 003A mouse/touch browser suite | PASS |
| New header/search/creation browser suite | PASS |
| Whitespace check | PASS |

All original 64 Node cases remain unchanged in their original files. The 17 new
cases cover matching/order/limit, safe suggestions, keyboard state, exact/missing/
blank actions, read guards, union/default/category-origin choices, creation shape,
no-op/rejected/stale operations, category naming/clearing, local and mocked-cloud
round trips, refresh after edits, library switching and obsolete callback rejection.
Full snapshots include unknown nested node/category/clock metadata and existing
Swedish/English content. Cloud mocks exercise the actual save/merge and snapshot
paths without Firebase SDK access.

The original smoke has exactly two interaction adjustments: its read-mode paused
control selector now explicitly names the paused-relations section (the new menu
also introduces a section), and its existing Standalone search scenario first
opens search and sends real input text. No previous feature assertion was removed
or weakened. The original failed attempts exposed these obsolete test interactions;
selectors/input setup were corrected, preserving the intended assertions.

The dedicated Chromium suite uses actual keyboard text/Enter/Arrow/Escape input,
real mouse and touch selection, the original mode prompt behavior, and native
category selection with more than forty choices. It verifies search-prefilled
creation, cancellation, duplicate/tampered rejection, ordinary-member status,
name metadata, literal hostile strings, local reload and prompt-based switching
between synthetic libraries. A retained old suggestion cannot navigate after a
switch. A native captured object press still completes normally while header
search state is changed, proving that no main-page rerender invalidates it.
The prior category suite continues to verify the exact 150 ms capture-release
failure correction, real touch cancellation, immigrant/template semantics and
correlated canceled CDP Fetch IDs. CDP interception files/harness protections are
unchanged by this task.

A new keyboard test initially omitted Enter's carriage-return payload in CDP;
that setup was corrected to produce actual native button activation. Final tests
pass without adding manual activation calls or weakening keyboard assertions.

## Desktop/mobile evidence

Bounding rectangles prove one row, four non-overlapping controls within the
viewport, no document horizontal scrolling, and ellipsis truncation for an
unusually long library name:

| Viewport width | Collapsed header height | Overlap / horizontal scrolling |
| --- | --- | --- |
| 1280 px | 56 px | none / none |
| 375 px | 52 px | none / none |
| 320 px | 52 px | none / none |

At 320 px, the expanded menu also stays within the viewport and the search input
and action do not overlap. The browser test saves `header-1280.png`,
`header-375.png` and `header-320.png` in a freshly generated temporary
`studywiki-004a-evidence-*` folder and prints that folder. The 320 px screenshot
was visually inspected. These disposable evidence images are not production
assets and are not dependencies or repository changes.

## Preservation, persistence and isolation evidence

- UI/menu/status/search, navigation, dropdown selection, cancellation, rejected
  input, unchanged names and read guards: zero logical saves and zero storage
  writes, with complete synthetic snapshots unchanged.
- Successful creation: one logical sync and three existing node/edge/category
  storage writes. All original nodes, both language fields, active/paused edges,
  categories, unknown fields and old clock records match exactly; only one new
  node and its creation-clock record are added. No immigrant flag is introduced.
- Category naming: only the intended name field changes, with notes, unknown
  fields, every node/edge and modification ordering preserved. Unchanged saves
  produce no additional writes. Local/mock-cloud reloads retain the field.
- Mock cloud merge preserves unrelated document metadata and produces one cloud
  save; the successful mock-cloud path performs no local fallback writes.
- An intentional library switch retains the existing single `nv_current_lib`
  write; loading/searching/navigating the selected synthetic library saves nothing.
  Deliberate test storage seeding is excluded from UI write counts.
- Existing storage keys and document names are unchanged. The default DnD mapping
  and `nv_lib_` mapping remain. Source comparisons verified unchanged password
  policy, document naming, sync, template selection, pointer-capture safeguards,
  object/category moves/status removal and relationship mechanics.

Browsers strip remote Firebase SDK tags, configuration and initialization before
startup. They serve only the in-memory synthetic application over loopback, block
external requests through the existing deterministic interception plus a blocked
proxy, and use fresh disposable profiles/storage. The new suite reuses that
unchanged harness (CSP connections only to its own loopback origin). Completed
suites report zero unexpected external requests, payload executions or page errors.
No real library, production Firebase, credentials, paid service, live cloud listing,
Digital GM or Franks-projekt installation is used. Tests install no dependencies.

## Cloud-library selector feasibility note (repository code only)

The current application chooses a user-entered library name, maps DnD to
`simple_db/nordverket_live` and other names to `simple_db/nv_lib_<name>`, then
subscribes to that one document. It contains no collection enumeration or cloud
library index. No Firestore security rules or list-query authorization tests are
provided here, so successful reads/writes of a named document cannot establish
whether listing is permitted. A follow-up must verify permitted discovery/query
behavior, document-name mapping (including the DnD exception), authentication/
rules and offline/error handling before implementing a cloud selection modal.
No production query was made to assess feasibility.

## Inherited limitations and review boundary

Client-side creative-mode unlocking is not server authorization. Existing whole-
array cloud synchronization/concurrent-writer risks, client-local clocks, older
writers, duplicate-title/dangling-edge cleanup on loading, malformed nested-data
assumptions and arbitrary-ID/free-page route namespace limitations remain. New
creation/name saves preserve edges, but do not redesign legacy loaders.

Legacy unsafe free-text/pending-link/old ID-based surfaces remain outside this
name/search/header scope; this is not a whole-application XSS fix. The library
switch still accepts the existing user-entered names and local fallback/bundled
empty-library behavior; no cloud-discovery or authentication change is introduced.
No live-cloud durability/security-rule guarantee follows from offline mocks.

Advanced cells, persistent empty layouts, bilingual UI, 3D views, cloud library
listing, cleanup/migration, dependency upgrades, merge/deployment/auto-merge and
other tasks are excluded. Independent QA and owner review are required.

Changed files:

- `index.html`
- `tests/browser-smoke.cjs`
- `tests/header-search.test.cjs`
- `tests/browser-header-search.cjs`
- `TASK004A-QA.md`
