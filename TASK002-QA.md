# Task 002 — symbol categories and derived standard templates

Status: READY FOR INDEPENDENT QA — NOT MERGED.

Repository: `Marleohar/StudyWiki`.
Baseline: `2efb36c5774ca30375d4c0ab78a788732e648cad`.
Branch: `task002/symbol-categories-templates`.

## Product decisions and representation

The owner explicitly selected the symbol itself as the category heading. There is no inferred category name and no conversion of uppercase legacy object titles. A category is an exact `node.icon` identity; a missing/null icon uses the existing default `&`. Uppercasing applies to the heading only. Colors do not distinguish categories. Category routes encode the entire symbol after `#category/` and decode it once, supporting quotes, percent signs, Unicode, slashes and markup-like symbols.

Categories are views, not new nodes or edges. Each category lists only members of its symbol, using one full-width row per member. Object, overview and active-relation symbols open categories. A separate **Ändra symbol & färg** control retains appearance editing. Category creation uses the existing dialog/record shape and assigns the exact originating category symbol. An existing object with a duplicate title is rejected rather than reassigned.

The optional document field `symbolCategories` contains:

```json
{
  "version": 1,
  "categories": [{ "symbol": "x", "notes": "Category notes" }],
  "modifications": [{ "id": "object-id", "at": 1790000000000 }]
}
```

Its local fallback uses the additive per-document key `nv_categories_<existing document name>`. Existing node/edge keys, library selection and document names remain unchanged. Unknown category-state fields and record fields survive edits/serialization. Metadata for removed nodes is retained rather than garbage-collected. Node and edge schemas are unchanged; reading/rendering does not manufacture modification records or rewrite legacy data. Constructor-owned metadata is initialized on real application startup; the original prototype-only relationship test fixtures intentionally omit it.

Firestore writes now use `set(payload, { merge: true })` so unrelated document fields are preserved. Existing whole-array node/edge writes, snapshot subscription and local fallback remain in place. No Firebase configuration, authentication, import or cleanup changes were made. The new field is additive; older app versions are not forward-compatible writers because their inherited whole-document save can remove it.

## Notes and templates

Category notes are independent of object notes. The limit is 280 Unicode code points. Over-limit edits stay in the editor with a visible rejection message; the saved note is not truncated or replaced. Read mode shows saved text and blocks edits/creation. Unlocking also updates the editor's readonly state. New category text, symbol controls, member titles and template-source titles use DOM creation, `textContent` and listener closures.

`templateFor(symbol)` returns a derived, versioned structure:

```json
{ "version": 1, "sourceId": "winning-object-id", "rows": [{ "symbol": "related-symbol" }] }
```

The source has the most distinct symbols among active neighbors. Colors, relation count, duplicate edges and paused edges do not inflate this score. Rows contain only a symbol identifying an otherwise empty row; they contain no copied associations or object notes. Symbols are sorted deterministically. The same derived template is shown on the category and each free object page. Existing mixed relationships remain accessible in their original list even when absent from the selected template.

Equal scores use the newest recorded modification. Records without a new timestamp are tied at an ordering sentinel of zero (never persisted as a historical date), then ordered by ascending object ID using JavaScript string comparison. Array order and browser locale do not decide the winner. New creation, free-text/rename edits, appearance edits, added/paused/restored relations and incident-relation removal through explicit node deletion update the separate modification metadata. Both relationship endpoints are marked. Symbol edits also mark active neighbors because their related-symbol identity changes. Local timestamps advance monotonically even for changes in the same millisecond; they do not solve multi-client clock skew.

The existing free-text saver used an unset `this.lang` key. It now defaults to `sv`, respects read mode, preserves other language/unknown fields and records real edits; no-op saves do not alter timestamps. Explicit node deletion still removes only the selected node and its incident edges, with metadata-only tracking for surviving affected endpoints. Existing pause/restore behavior and deduplication guards remain intact.

## Validation and data preservation

Node 24.12.0; no new dependencies. Commands:

```text
node --test tests/relations.test.cjs tests/categories.test.cjs
node tests/browser-smoke.cjs
git diff --check
```

Results: **26 Node tests passed, 0 failed**, including all ten original relationship cases. The relationship fixture gained only DOM-stub support for attributes and symbol-slot queries; its ten cases/assertions remain intact. Sixteen category tests cover exact membership, uppercase presentation, safe symbol callbacks, distinct-symbol selection, legacy/new-edit ties, derived propagation, retained mixed/paused relations, note limits/editing/read mode, category creation, text and symbol edits, complete metadata preservation, local and mocked Firestore reload, merged payloads, per-library isolation and unchanged deletion results with timestamp tracking.

The isolated Chromium smoke test passes the original Task 001 scenarios and new real mouse interactions: symbol/category navigation, category/free-page switching, member filtering, indivisible rows, notes save/rejection, category object creation, accessible appearance editing, symbol movement, template recalculation and reload/read mode. Complete original node/edge snapshots are compared against only the intended icon/color/new-object changes; complete nodes/edges/category metadata match the pre-reload snapshot. Hostile notes, symbols and member titles remain text with no injected scripts/images/SVG or executable attributes in the new category UI. Original special-ID callbacks/restoration tests remain intact.

Tests use synthetic records only. The browser serves an in-memory test copy, removes remote Firebase scripts before startup, blocks every page request outside its loopback origin, and uses a disposable browser profile/localStorage. Running Chromium requires execution escalation for the local server in this environment. Firestore serialization/reload tests use in-memory mocks; no cloud documents or real libraries are contacted. Firestore merge behavior is asserted at the API-contract boundary, not against a live service.

## Limits and deferred work

- Advanced divided cells, three-cell limits, 50-character row limits, text shrinking, cell calculations and layout editing are deferred. The derived versioned rows can be extended later; no partial cell functions or persisted copied templates are introduced.
- Template changes are recomputed on rendering/navigation and existing snapshot rerenders. No concurrent-user conflict resolution or cross-device clock synchronization is added.
- Inherited duplicate-title cleanup can discard nodes and then their incident edges; dangling-edge cleanup remains unchanged. Merge writes preserve unrelated fields but still replace the node/edge arrays and category arrays, so simultaneous writers can overwrite each other.
- Legacy unsafe title/ID rendering outside the new UI and client-side edit-mode unlocking remain. New category symbols/routes are safely encoded, but navigation to legacy free objects with arbitrary quote/Unicode IDs still has the previously documented hash-router limitation. Original special-ID smoke tests verify the exact callback argument at that router boundary, not end-to-end free-page routing.
- The new `category/` route namespace assumes generated legacy IDs (`n_...` and bundled IDs); a custom imported ID beginning with that route prefix can collide. No import migration or arbitrary-ID router redesign is included.
- No production Firestore validation, paid services, deployment, merge, auto-merge or other repository changes.

Changed files: `index.html`, `tests/relations.test.cjs`, `tests/categories.test.cjs`, `tests/browser-smoke.cjs`, `TASK002-QA.md`.
