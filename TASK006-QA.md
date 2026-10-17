# TASK 006 — confirmed Boolean relationship sorting

Status: READY FOR INDEPENDENT QA — NOT MERGED.
Repository: Marleohar/StudyWiki (Nördverket only).
Verified main baseline: `7353933c30c15aed27998b5d6cde233a78e1f5ce`.
Implementation/test commit: `9273bd9b6f0062d5754232e0454c93f1e36b3d80`.
Branch: `fix/task006-confirmed-relation-sorting`.
The delivered HEAD additionally contains this report-only commit. Its immutable
SHA is recorded in the PR/final delivery and ../evidence/delivery.json; verify
with `git rev-parse HEAD`. This avoids a self-referential commit hash in this file.

## Confirmed rules and implementation

The existing TASK 005 interface and derived-group architecture remain. Criteria
are deduplicated by exact immutable ID, missing IDs ignored, and valid criteria
canonically ordered with the unchanged natural numeric-aware Swedish,
case-insensitive title comparator and immutable-ID ties.

Groups remain exact ID subsets, ordered by descending match count. Names inside
each group are alphabetized and joined with commas. Equal-sized groups compare
their complete alphabetized name sequences lexicographically; only after all
name positions compare equal do immutable ID sequences break the tie. Earlier
selection order has no priority. Criteria with identical display names still
form separate subset identities. Member lists use the unchanged title comparator.

Matching still calls the existing undirected active-edge predicate. Paused edges
are excluded; duplicate active edges count once; an active plus paused pair still
matches because the active relationship exists. No text/symbol matching is added.

The UI allows six effective criteria. At six, Add is disabled and the existing
status area says to remove a relationship before adding another. An independent
handler guard also rejects a seventh event. Removing a chip immediately re-enables
Add when another candidate exists; Clear All remains available. Canonically
alphabetized chips retain exact IDs and correct removal behavior.

Direct grouping calls reject more than six distinct existing IDs with RangeError
before deriving results; they never truncate silently or mutate the input/library.
Repeated/missing IDs do not inflate the effective count. No preference persistence,
data schema, relationship model, template calculation or editing policy changes.

## Tests updated for changed product requirements

Existing relation-sorting Node/Chromium expectations now assert alphabetic group
order and comma headings instead of selection priority/semicolons. The prior
more-than-32 effective-criteria test now asserts strict rejection above six while
retaining member-only, no-empty-group and preservation checks. The existing touch
scenario targets the same intended criterion at its new alphabetic chip position.
Unrelated identity, metadata, security and interaction assertions remain intact.

Seven new Node tests and a dedicated Chromium suite cover the complete four-relation
example (all 16 nonempty result subsets with natural-order pairs of members),
three arbitrary/reversed selection sequences, six criteria, seventh rejection,
removal/replacement/Clear All, repeated IDs, duplicate display names, full-sequence
comparison before ID ties, Unicode/Swedish/numeric content, active/paused/duplicate
edges, hostile literal text and absent combinations.

## Actual validation — 2026-10-17

Windows; Node v24.12.0; Chrome/155.0.8059.84. No dependencies installed.
All development is under C:\dev\Franks projekt\Nordverket\task-006\development.
All logs, screenshots and disposable browser directories are under sibling evidence.
TEMP and TMP are set to evidence\tmp before every test process using os.tmpdir().
No Digital GM or Ört-Wikin working directories/dependencies were used.

| Command | Result |
| --- | --- |
| `node --test tests/*.test.cjs` | 116/116 PASS, including all 109 baseline cases with only authorized expectation updates |
| `node tests/browser-smoke.cjs` | PASS |
| `node tests/browser-category-moves.cjs` | PASS |
| `node tests/browser-header-search.cjs` | PASS |
| `node tests/browser-existing-object-transfer.cjs` | PASS |
| `node tests/browser-relation-sorting.cjs` | PASS |
| `node tests/browser-confirmed-relation-sorting.cjs` | PASS |
| `git diff --check` | PASS |
| `git status -sb` | Assigned feature branch; clean after report commit |

Node output and each browser suite's output are saved under evidence. An initial
expectation-update script missed two Unicode-containing old headings; the remaining
superseded expectations were corrected before the full passing run. No application
assertion was removed or security check weakened.

The dedicated browser suite uses actual mouse Add actions, native keyboard mode
selection/Clear All and touch removal/replacement. It compares complete grouping
JSON for the three required selection sequences and verifies all 32 category members
appear exactly once. A forced seventh click event also exercises the handler guard,
and direct oversize grouping is rejected. Existing browser coverage retains
read/create guards, navigation/800 ms/F2, native capture loss at 150 ms, immigrant
and template behavior, transfer safety, stale-route/library/revision protections,
snapshot resets, and deterministic canceled CDP request handling.

## Desktop/mobile screenshots

Final screenshots: ../evidence/tmp/task006-confirmed-30MRmK/confirmed-1280.png,
confirmed-375.png and confirmed-320.png. Browser output records the full directory.
An equivalent preceding 320 px run was visually inspected: comma headings wrap,
chips remain readable, limit guidance is visible, and Add is disabled at six.
At 1280, 375 and 320 px, measured document width never exceeds viewport width,
and the native criterion selector stays within viewport bounds. The existing
sorting suite additionally validates narrow layouts with hostile long text.

## Data preservation and write counts

Complete synthetic snapshots compare nodes, edges and category state, including
source array order, Swedish/English content, immigrant flags, modification clocks,
active/paused edge records, duplicate-edge metadata and unknown nested fields.

For sorting/search/selection/removal/replacement/Clear All and rejected seventh
criteria: zero logical saves, zero localStorage writes, zero mocked Firestore
writes, and byte-identical complete snapshots. Template selection remains identical.
No original arrays are sorted in place. Direct oversize inputs reject without
library mutation. Deliberately injected duplicate/hostile names are synthetic test
setup, never a sorting edit. Existing library switching separately retains its
one selection-key write; the existing suite accounts for this explicitly.

Browsers use disposable synthetic libraries/profiles with production Firebase
SDK/configuration/initialization removed before startup. Existing CSP, CDP request
blocking and blocked proxy remain intact. Completed suites report no unexpected
external requests, page errors or payload execution. No production Firebase,
actual libraries, credentials or paid services were accessed.

## Open UX point and inherited limitations

Only groups containing actual objects are displayed. Frank's empty four-relation
group example remains an open UX question: rendering empty combinations would need
separate explicit product approval. No change was made here.

Inherited limitations remain: loader title deduplication, malformed legacy record
assumptions, legacy route/free-text rendering risks, client-only creative-mode
policy and whole-array cloud synchronization/concurrent-writer behavior. Snapshot
refresh keeps the existing reset-to-default behavior. Offline mocks do not prove
live cloud security/durability. Fixed Swedish collation still follows each runtime's
ICU version. No category redesign, quick-link work, bilingual UI or symbol editing.

Changed files: index.html; tests/relation-sorting.test.cjs;
tests/browser-relation-sorting.cjs; tests/confirmed-relation-sorting.test.cjs;
tests/browser-confirmed-relation-sorting.cjs; tests/support/confirmed-sorting-fixture.cjs;
TASK006-QA.md.
