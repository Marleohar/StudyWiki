# Task 001: reversible on-hold relations

Status: READY FOR INDEPENDENT QA — NOT MERGED.

Repository: `Marleohar/StudyWiki`. Branch: `task001/reversible-on-hold-relations`.
Baseline: `19804c14aa4fd7451bd1b7742c1e7f9aa005459a`.

## Behavior and data preservation

- Existing `{a,b}` edges remain active and unchanged on load/render. Only strict `paused: true` means on hold. No migration, storage key, library/document selection, Firebase configuration or synchronization changes.
- Pause mutates only the matching edge's `paused` field. Restore removes that field. Endpoint order does not matter; both detail pages derive active and paused lists from the same edges array.
- Unknown node/edge fields, endpoint identity and edge objects survive pause/restore. No nodes are removed. Repeated operations skip persistence/rendering when no state changes. Restoring a record originally carrying `paused: false` leaves the equivalent legacy active representation without that optional field.
- Relinking, chain parsing and manual batch linking restore the existing edge. Historical duplicate endpoint records are preserved with their metadata and changed together; neighbor lists display an endpoint once. No duplicate cleanup/migration was introduced.
- Read mode guards pause/restore and the linking entry points; CSS hides edit controls. This is the existing client-side mode model, not a security/authentication change.
- Standalone creation, overview, search and storage retain isolated nodes. Explicit confirmed node deletion still removes that node and all of its active/paused edges.
- Batch linking now renders its saved page ID after closing the dialog, which clears the target ID. This fixes the existing null-target refresh on the affected linking path.

## Reproducible validation

Requires Node 24 (no package installation). Run from the repository:

```text
node --test tests/relations.test.cjs
node tests/browser-smoke.cjs
git diff --check
```

Ten automated regression tests pass. Coverage includes legacy loading without rewrite, both endpoints' active/paused lists, restoration from B, preservation of B–C, idempotence, direct/chain/batch relinking, local save/reload, mocked Firestore serialization and failure fallback, isolated records, read-mode guards, metadata, historical duplicate edges and explicit node deletion. The correction adds DOM listener tests for apostrophes, double quotes, Unicode and percent signs in IDs, literal HTML/script-like titles, restoration from both endpoints, unchanged records and zero persistence on no-ops.

The browser smoke test passes using installed Chromium, a loopback-only HTTP server and a fresh disposable browser profile. It removes external script tags from the served test copy, blocks all page requests outside the local origin, and seeds synthetic localStorage under a test library. It uses CDP mouse input on the rendered pause/navigation/restore controls, checks reload and read-mode visibility/guards, then clicks search for a standalone object. No production Firestore access or real library modifications occur. The sandboxed attempt timed out navigating to loopback; the same test passed with execution escalation. Set `STUDYWIKI_TEST_BROWSER` if Chrome/Edge is not installed at a detected Windows path.

The VM tests extract the real GraphApp class without running its constructor, bundled configuration, seed records or remote SDKs. Firestore is an in-memory serialization mock. Browser tests exercise the real constructor's existing local fallback. Production Firestore delivery, concurrent clients and deployment are untested by design.

## Inherited risks and limits

- `cleanDuplicates()` drops later nodes sharing a trimmed, case-insensitive title without merging metadata or remapping their IDs. `cleanEdges()` then removes edges whose endpoints no longer exist; a later sync can persist those losses. These cleanup rules are unchanged.
- `cleanEdges()` retains isolated nodes and paused edges with valid endpoints, but drops any dangling edge (active or paused). Malformed records/title values remain subject to existing assumptions.
- Existing synchronization replaces the document with whole arrays and has no conflict merge; concurrent writers can overwrite changes. The existing local fallback does not provide a new cloud reconciliation guarantee.
- Existing title/ID interpolation into HTML and inline handlers and client-side mode unlocking remain unchanged. This task does not redesign input escaping or security.
- Browser edit mode is set by the harness to avoid depending on embedded unlock values. Pause/restore/navigation/search use ordinary mouse input. Batch and chain linking are covered by method-level regression tests, not browser clicks.
- No merges, deployments, paid services, dependency additions or changes to other projects.

Changed files: `index.html`, `tests/relations.test.cjs`, `tests/browser-smoke.cjs`, `TASK001-QA.md`.

## Scoped rendering correction before independent QA

The newly introduced paused list now creates DOM elements, assigns titles through `textContent`, and attaches `addEventListener()` closures capturing the endpoint IDs. No title/ID is interpolated into that list's HTML or executable attributes. Swedish labels, CSS classes, ordering, mode behavior, relation state and persistence remain unchanged. Active-list/header/datalist rendering is outside this correction and remains inherited behavior.

Actual Chromium mouse input verifies original special IDs reach the navigation callback and restoration works from both endpoints. Hostile-title assertions verify literal text, absence of injected images/scripts/spans or executable attributes in the paused list, no payload execution and unchanged data. The harness counts synchronization calls and checks zero writes for navigation and repeated no-op restores. An initial extended-browser run failed because test wrappers accidentally counted each save twice across cases; the counter was corrected and the rerun passed.

Coverage limitation: special-ID mouse navigation is intercepted at the existing router boundary and renders the captured endpoint directly; ordinary A–B navigation still exercises the real router. The existing hash router does not consistently resolve arbitrary encoded IDs (it looks up the raw hash as an ID, then decoded text as a title). This correction preserves that router rather than extending scope. Hostile titles are tested as paused neighbors of a safe-title page so inherited header/active-list rendering does not confound the paused-list checks. Full application safety for arbitrary titles/IDs is not claimed.

Correction validation commands: `node --test tests/relations.test.cjs` (10 passed, 0 failed), `node tests/browser-smoke.cjs` (original and extended scenarios passed with loopback execution escalation), `git diff --check` (passed). No real Firestore or library data accessed.
