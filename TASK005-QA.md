# TASK 005 — sort by relation + relation

Status: READY FOR INDEPENDENT QA — NOT MERGED.
Repository: Marleohar/StudyWiki (Nördverket).
Verified unchanged main/base: `c49483231ea6fe8c8a69a66712af69b2909e6cc0`.
Implementation/test HEAD: `523a1a50cbe3de2e7cd8bdf7c72ed7e5d9bde996`.
Branch: `feat/task005-relation-sorting`.
The following report-only commit is the delivered HEAD, recorded immutably in the
PR/final delivery; `git rev-parse HEAD` identifies it without a self-referential
commit hash in this file.

## Behavior and decisions

Category pages start in Alfabetisk mode with the ordinary ungrouped member list.
A compact native select exposes Relationer in read mode as well as creative mode.
The expanded controls contain a search field, native existing-object selector,
Add button, removable criteria and Clear All. Search filters current-library
object titles; exact immutable IDs remain the option values and matching keys.
Duplicate titles are distinguished by an appended ID in the criterion selector.
Removing a criterion returns focus to the search field; adding/clearing keeps the
existing control in place. Native controls support keyboard and mobile scrolling.
No selection or sort preference is persisted.

Only category members are results. Criteria may come from any current-library
category. Matching delegates to the unchanged undirected active-edge predicate:
`paused === true` never matches; duplicate active records do not add weight.
No words, symbols, notes or names imply a relationship. A matching and a paused
record for the same endpoints still match because an active record exists.

Derived groups use exact subsets of the ordered criterion IDs, avoiding numeric
bitmasks and their 32-bit limitation. Nonempty groups sort by descending matched
criterion count, then lexicographically by the indices of the selected criteria.
Full matches therefore precede partial matches; unmatched objects are last.
Headings join current matching titles with semicolons; the no-match label is
Övriga objekt. No True/False labels or empty groups are rendered. With no criteria,
there is one unheaded ordinary list.

**Product assumption, not a confirmed Frank requirement:** equal-count partial
subsets use the user's selected criterion order as the tie-breaker. Frank confirmed
combined matching/full matches first, not the relative ordering of partial groups.

All member lists and criterion choices use an explicit Swedish Intl.Collator,
case-insensitive and numeric-aware, with exact ID code-unit comparison as the
final tie-breaker. Thus 2 precedes 10 and Goblin2 precedes Goblin10. The default
remains alphabetical, using this natural comparison too; titles are never changed.
Unicode collation follows the browser/Node ICU implementation for the fixed locale.

Changing criteria updates only the member list, criterion chips, status and choices.
Category editors, creation controls, templates and header remain the same DOM
nodes. Member links reuse the existing titleLink, pointer-capture guards, 800 ms
long press, quick navigation and F2 handling. Replacing a list cancels an in-flight
old-list press. Existing read/edit guards remain authoritative for edits.

Every category render starts a fresh default view, including route navigation and
cloud snapshot route refresh. This deliberately resets sorting rather than retain
possibly obsolete criteria after a snapshot. Renames appear under their current
title on reselection; deleted criteria disappear. Retained old UI handlers check
view identity, exact symbol, library identity and load revision before acting.
No cloud subscription, schema, storage key or persistence method was changed.

## Validation — 2026-10-17

Windows, Node v24.12.0 and Chrome/155.0.8059.84. No dependencies installed. Tests
use repository Node built-ins/CDP and installed Chrome, from an isolated checkout
under the OS temporary directory. No Digital GM or other repository dependencies.
Chromium commands run outside the managed sandbox (prior QA established a sandbox
CDP Network.enable restriction), retaining all harness network protections.

| Command | Actual result |
| --- | --- |
| `node --test tests/*.test.cjs` | 109/109 PASS: all 97 prior tests plus 12 new |
| `node tests/browser-smoke.cjs` | PASS |
| `node tests/browser-category-moves.cjs` | PASS |
| `node tests/browser-header-search.cjs` | PASS |
| `node tests/browser-existing-object-transfer.cjs` | PASS |
| `node tests/browser-relation-sorting.cjs` | PASS |
| `git diff --check` | PASS |

No existing test files/assertions were modified. The new Node tests exercise
natural/default ordering, one/multiple criteria, exact partial subsets, reversed
selection priorities, more than 32 criteria, numeric/equivalent-title ID ordering,
same-titled IDs, paused/duplicate edges, missing/renamed criteria, literal hostile
names, category/library/revision resets, read mode and unchanged templates/data.
An initial new-test run used the wrong template helper name; it was corrected to
the existing templateFor method before the complete passing run.

The new Chromium test drives native keyboard selection/Add, real search input,
mouse additions/clearing, touch criterion removal, keyboard/member navigation,
grouped-link long press and F2 cancellation. It verifies actual headings/order,
unique membership, literal special titles and IDs, preserved editor/template DOM,
renamed/deleted snapshot refresh and an actual prompt-driven synthetic library
switch. Existing suites retain native pointer-capture release at 150 ms, touch
cancellation, immigrant/template exclusion/restoration, metadata preservation,
transfer confirmation, header/search and deterministic canceled Fetch-ID handling.

## Desktop/mobile evidence

The dedicated browser suite saves PNGs in a new disposable
`studywiki-005-evidence-*` folder and prints the path. Final run evidence:
`studywiki-005-evidence-dUDMbd` under the OS temporary directory. The final mobile
layout was also visually inspected in the preceding equivalent layout run.

| Width | Document width | Category selector right edge | Horizontal overflow |
| --- | --- | --- | --- |
| 1280 | 1265 (vertical scrollbar present) | 1039.5 | none |
| 375 | 375 | 342 | none |
| 320 | 320 | 287 | none |

Labels occupy their own lines on narrow screens; long literal selected titles
wrap in removal buttons. The collapsed mode control keeps the default page compact.

## Complete preservation and zero writes

Synthetic snapshots include every node, edge and category-state record, both
language fields, immigrant flags, clocks and unknown nested metadata. The new Node
and Chromium suites compare these complete snapshots, including original array
order, before and after sorting/search/selection/removal/clearing/navigation.

- Sorting and criterion operations: zero logical sync calls and zero storage
  writes; no SDK is available to make Firestore writes. No mutation of records,
  immigrant status, clock data, metadata or original node/edge arrays.
- TemplateFor output and rendered template/editor DOM remain unchanged by sorting.
- Existing active and paused edge records, including duplicate edge metadata,
  remain deeply equal. No normalization or cleanup is triggered.
- Deliberate synthetic rename/deletion probes compare against the newly injected
  snapshot; route refresh/sorting itself adds no changes or writes.
- Actual library switching retains its existing one nv_current_lib write. Loading
  and sorting in the new library produce zero saves/extra writes. Test storage
  seeding is deliberate setup and excluded from UI write counts.

Browser harnesses remove remote Firebase SDK scripts, configuration and
initialization before startup. Synthetic libraries are served on loopback with
disposable profiles, loopback-only CSP, unchanged CDP external-request blocking and
a blocked external proxy. Completed suites report no unexpected external requests,
page errors or payload execution. No actual libraries, production Firebase, live
cloud listing, credentials or paid services were accessed.

## Inherited limitations and boundary

Client-side creative mode is not server authorization. Existing whole-array cloud
sync/concurrent-writer and client-clock limitations, malformed legacy data
assumptions and unrelated legacy route/free-text rendering risks are unchanged.
Browser snapshot refresh is exercised through the existing route refresh boundary;
no live-cloud security/durability claim follows from these offline tests. Snapshot
refresh resets sort controls/focus along with the existing whole-page rerender.
Natural ordering is deterministic within the fixed locale/ICU runtime; Unicode
collation versions can differ across runtimes. Performance is not benchmarked for
very large libraries; groups are derived from existing arrays and predicates.

No permanent preferences, schema migration, cloud discovery, advanced cells,
bilingual UI or 3D work. No merge, deployment or auto-merge.

Changed files: index.html; tests/relation-sorting.test.cjs;
tests/browser-relation-sorting.cjs; tests/support/relation-sorting-fixture.cjs;
TASK005-QA.md.
