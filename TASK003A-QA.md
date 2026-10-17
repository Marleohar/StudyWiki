# TASK 003A - object renaming, category symbols and immigrant status

Status: READY FOR INDEPENDENT QA - NOT MERGED.
Repository: `Marleohar/StudyWiki` (Nördverket only).
Verified main baseline: `88371b6bf1fbdbab4b9a7c037dfe2ad28d2a0030`.
Branch: `feat/task003a-category-moves`.
The immutable task HEAD is recorded in the PR and final delivery; use
`git rev-parse HEAD` to identify the checked-out revision.

## Representation and compatibility

A deliberate single-object category move adds the optional node field
`isImmigrant: true`. Absent or false flags are ordinary legacy members; loading
and rendering never add the field. Clearing status deletes only a true flag.
Unknown node fields, free-text languages, colors and exact IDs remain intact.
The existing node-array local/cloud serialization carries this additive field;
there is no migration, extra storage key or per-object template persistence.
Existing library selection and document naming are unchanged.

`templateFor` filters out only nodes whose flag is exactly true. Eligible members
retain TASK 002's most-distinct-active-neighbor-symbols, newest recorded edit,
then stable ascending ID ordering. Paused/duplicate edges do not inflate the
score. Immigrant relationships still appear normally and immigrants display the
destination category's derived template. All-immigrant categories return a null
source and empty rows. Clearing status recomputes eligibility without inventing
a newer modification timestamp. No derived rows or empty cells are stored,
copied from the old category or deleted from relationships.

A real object move records the existing modification clock for the moved node
and active neighbors, since their related-symbol display changes. It sets the
exact destination icon, marks the immigrant and performs one logical save.
Selecting the current resolved symbol is a no-op, including legacy empty/null/
missing icons that display as `&`. Appearance editing uses the same move
operation; color-only changes remain ordinary members. Untouched legacy default
colors are not normalized by saving the same displayed appearance. Empty symbol
submissions are rejected rather than silently assigned to a different category.
Nonempty whitespace and special-character symbols retain exact identity. The
appearance input no longer truncates symbols at ten characters.

Clearing status does not change IDs, names, edges or modification ordering.
Repeated/absent clears and every mutation attempted in read mode are no-ops.
The object page displays `Inflyttare`; creative mode exposes the requested
`Upphäv inflyttarstatus` button.

## Cosmetic whole-category rename

Collision validation checks both resolved member icons and independently stored
category records before modifying anything. Same-symbol, empty, invalid,
occupied-target and unavailable-source operations perform no save. A successful
operation updates icons of exactly the current source members, including the
intentional default-category empty/null/missing-icon members, and moves all
matching category metadata records to the new symbol. Notes, unknown metadata,
immigrant flags and modification records remain unchanged. Stored-only categories
can also be renamed through the operation boundary without overwriting notes.

Edges remain byte-for-byte identical; all fields of unrelated objects remain
unchanged. The existing template selection and related-symbol displays recompute
from the new icons. One logical save is followed by the exactly encoded category
route. No per-object save loop or intermediate mutation before validation exists.

The existing sync API has a narrow `preserveEdges` option used by these editing
operations (including rename, appearance and status clearing). This prevents the
inherited dangling-edge cleanup from silently removing unrelated records while
changing a label or category. Other sync callers and legacy loaders retain their
existing cleanup behavior. Whole-array cloud persistence, merge options and
local fallback architecture are otherwise unchanged.

## Interaction and rendering

Pointer events implement an 800 ms long press. Primary mouse/touch presses are
captured so early release outside a target also cancels. Movement over eight CSS
pixels, pointercancel/capture loss, actual window/ancestor scrolling, blur,
hidden document, mode locking and owner rerenders invalidate pending callbacks.
Only one press timer belongs to the app. Detached elements and stale render
revisions cannot open editors. Queued scroll events with no displacement since
pointer-down do not cancel ordinary clicks. A fired long press consumes the
following synthetic click; the next independent quick press works normally.

Symbols retain quick category navigation. A long symbol press opens two choices:
move this object, or rename its entire category. Header and overview/category/
active/paused relationship titles support the existing rename prompt. Ordinary
quick title navigation remains intact. Explicit creative-mode category, rename
and appearance controls remain; list links and symbols support F2 alternatives.
The new modal supports Escape, tab wrapping and return focus. Read mode blocks
editing interfaces and mutations, with guards at the operation boundary too.

New title/symbol/rename handlers close over IDs instead of interpolating them
into executable HTML attributes. Titles are rendered as literal DOM text in the
affected lists/header. The shared datalist uses DOM option values so saving a
hostile name cannot inject markup there. Exact quotes, Unicode, percent signs,
slashes and markup-like symbols/names are covered. Other historical rendering
sinks are not claimed to be globally fixed.

Object rename trims according to the existing naming policy, rejects duplicate
case-insensitive titles belonging to another object, and treats cancellation,
empty/invalid/unchanged input as a no-op. Only the title and intended modification
record change. Case-only edits of the same object are allowed; another object's
case-insensitive name remains reserved. Current-page rerender and subsequent
overview/category/relationship views display the new literal name.

## Validation executed 2026-10-17

Environment: Windows, Node `v24.12.0`, real headless Chromium
`Chrome/155.0.8059.84`. No installed Node packages or external test dependencies
are needed: both browser scripts use Node's built-in CDP WebSocket and installed
Chrome/Edge. `STUDYWIKI_TEST_BROWSER` can select another Chromium executable.
No dependencies/tooling, reports or source files were placed in another project.

Exact commands from the repository root:

```text
node --test tests/*.test.cjs
node tests/browser-smoke.cjs
node tests/browser-category-moves.cjs
git diff --check
```

- Baseline: 27/27 Node regressions passed before changes.
- Final Node: 54/54 passed, zero failed/skipped/cancelled/TODO; all 27 existing
  cases and both original Node files remain unchanged, with 27 focused additions.
- Original Chromium smoke: PASS, retaining every original scenario. Only offline
  setup, assertion diagnostics and the expected immigrant field/insertion order
  in the existing appearance-move snapshot were updated.
- New Chromium category-move suite: PASS with actual timed mouse and touch input.
- `git diff --check`: PASS.

The Node tests cover precise 799/800 ms timing, single activation and click
suppression, cancellation causes and exact ID closures. Operation tests cover
existing/new destination moves, repeated immigrant moves, derived templates,
all-immigrant categories, eligibility and original tie rules, status clearing,
legacy defaults, default-category rename, duplicate source metadata, metadata-only
collisions, read guards, hostile names/symbols, no-op clocks, unknown fields,
active/paused edge identity, and local/mock-cloud reloads. They assert complete
snapshots with only the intended fields/clock records changed. Move clock tests
also verify exactly which endpoints change and preservation of unknown clock
metadata. Corrupt dangling-edge records are specifically preserved by the new
editing saves; legacy loading limitations remain as described below.

The new Chromium suite verifies quick symbol/title clicks, short mouse/touch
release, >=800 ms held presses, real touch cancellation/movement, mouse movement,
scroll and rerender cancellation, read locks, absence of duplicate navigation,
header and all list-title rename entry points, explicit controls/F2/Escape,
visible names in all affected surfaces, immigrant indicator/removal, local reload,
unused-symbol and repeated moves, appearance-path enforcement, template exclusion
and restoration, and atomic membership/metadata collision rejection. Complete
nodes/edges/category-state snapshots are compared after intended edits and reload.

Each successful local editing operation is asserted to make one logical sync and
exactly three writes to the existing nodes/edges/category-state storage keys.
No-op, rejected, cancelled, read-mode and navigation-only scenarios assert
**zero logical saves, zero storage writes and unchanged complete snapshots**.
Mock Firestore tests assert merge semantics, preserve unknown document fields and
exercise the actual snapshot loader with synthetic data. Byte-for-byte active and
paused edge snapshots, all original IDs and nested metadata are preserved.

The browser suites remove remote Firebase scripts and configuration and replace
Firebase initialization before startup, seed only synthetic disposable storage,
block all page requests outside their loopback origin and use a blocked egress
proxy. The new suite also applies CSP connect-src none and counts page errors,
payloads and external requests: all zero. Inline execution is permitted in the
test document so hostile rendering cannot pass merely because inline handlers
were disabled. Profiles are freshly created and removed after browser shutdown.
No production Firebase, real library, credentials, live application or paid
service is used. Bundled production configuration is never executed or logged.

During development a new Node assertion initially omitted a retained active
neighbor symbol; its expected template was corrected. Browser work exposed and
fixed cancellation by queued pre-press scroll events. The touch-cancel test was
corrected to send cancellation before the 800 ms threshold. The inherited smoke
appearance snapshot was updated for the intentional immigrant field, including
its JSON insertion order. Final checks above pass without removing scenarios.

## Inherited limitations and review boundary

- Legacy duplicate-title cleanup and dangling-edge cleanup on load remain. New
  editing saves avoid edge cleanup, but this does not repair historical data loss
  or redesign loaders for invalid/dangling libraries. Complete round-trip claims
  apply to supported libraries with valid endpoints.
- Firestore still saves whole node/edge/category arrays and can lose concurrent
  updates. Local fallback and asynchronous save errors retain existing behavior;
  no live-cloud durability, authentication or security-rule verification occurred.
  A single logical save is not a new server-side transaction guarantee.
- Client-side read/creative mode is UI gating, not server authorization.
- Legacy free-text/other HTML sinks and some old ID-based inline controls remain
  outside this task. The existing arbitrary-ID free-page hash routing and reserved
  `category/` namespace limitations are unchanged. New listeners preserve exact ID
  arguments, and no ID migration or routing rewrite is introduced.
- Existing timestamps are client-local; no cross-device clock synchronization or
  conflict resolution is added. Older app versions may not preserve new metadata
  or honor immigrant template exclusion when writing the same library.
- Advanced cell layouts, persistent empty cells and the bilingual UI are deferred.
  No TASK 003B, dependency upgrade, production configuration or authentication
  change, deployment, merge or auto-merge is included.

Changed files:

- `index.html`
- `tests/browser-smoke.cjs`
- `tests/category-moves.test.cjs`
- `tests/browser-category-moves.cjs`
- `tests/support/task003a-harness.cjs`
- `tests/support/browser-harness.cjs`
- `TASK003A-QA.md`

Independent QA and owner review are required before merging.
