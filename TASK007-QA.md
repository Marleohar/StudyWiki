# TASK 007 — category and object page UI cleanup

Status: READY FOR INDEPENDENT QA — NOT MERGED.
Repository: Marleohar/StudyWiki (Nördverket only).
Verified unchanged main baseline: `254fd96e1a4ca9a01db6465dcd7002f1e53ba4c0`.
Implementation/test commit: `c810ba51cfd98abc35c88d4339fad32f4307571a`.
Branch: `feat/task007-category-object-ui-cleanup`.
Delivery additionally contains this report-only commit. The exact delivered HEAD
is recorded in the PR/final response and ../evidence/delivery.json. Verify with
`git rev-parse HEAD`; a committed file cannot contain its own commit hash.

## Category/object comparison and behavior

Categories now use the same item-top-zone/item-name-row/h1.item-name structure and
bold 32 px serif title styling as objects. The existing uppercase visible symbol
sits on the left, the literal categoryDisplayName on its right. The compact
Byt namn button uses the same class as object rename. The permanent category name
input and Save button are removed from normal layout.

Category rename follows the existing native prompt pattern, preserving optional
name metadata and saveCategoryName behavior, including clearing an optional name.
Cancellation/unchanged names do not save. Successful rename changes only the name
field, preserves exact symbol identity, updates the visible title without a page
rerender and saves once. Mode/library/revision/current-name checks prevent a stale
prompt from saving into a different context.

Object actions are compact Byt namn | Byt kategori | Radera in that DOM and visual
order, with Delete last/rightmost and natural wrapping on narrow viewports.
The visible appearance button is removed. Its legacy methods, saved colors/icons
and internal appearance/category dialogs are retained unchanged. Rename, category
move and confirmed deletion delegate to their existing handlers; deletion now
uses a safe DOM closure instead of its former inline ID handler.

## Description presentation and editing

Object descriptions and category notes share one DOM-built free-text-frame with
literal textContent/value assignments. The visible caption is Beskrivning at the
bottom, after displayed content or editor/Save/Cancel/error elements. No visible
Fritext captions remain. The creation form uses the same frame/caption arrangement
while retaining modalFreeText and its existing data flow.

Object values still use free_text (legacy string or sv field). Existing saveFreeText
keeps its language/metadata/clock semantics. Category descriptions still use the
existing categories[].notes field and saveCategoryNotes, with Unicode-aware 280
character validation; no new description field or translation was introduced.

Creative users click a description frame or focus it and press Enter/Space to edit.
Editing focuses the textarea; Save or Ctrl/Cmd+Enter saves, Cancel or Escape returns
to display. Escape works from the action buttons as well as the editor. Textareas
retain accessible labels despite the caption's position. Display frames have
appropriate button/group roles and mode-aware labels. Locking read mode cancels
unsaved editors; detached/stale callbacks cannot write. Category description edits
replace only their frame, preserving sorting controls, editors and templates.

## Validation — 2026-10-17

Windows; Node v24.12.0; Chrome/155.0.8059.84. No new dependencies.
Development: C:\dev\Franks projekt\Nordverket\task-007\development.
Evidence, logs and disposable profiles: sibling evidence directory.
TEMP/TMP set to evidence\tmp for every Node/browser process using temporary files.
No Digital GM or Ört-Wikin directory/dependency was used.

| Command | Actual result |
| --- | --- |
| `node --test tests/*.test.cjs` | 126/126 PASS (116 baseline cases + 10 new) |
| `node tests/browser-smoke.cjs` | PASS |
| `node tests/browser-category-moves.cjs` | PASS |
| `node tests/browser-header-search.cjs` | PASS |
| `node tests/browser-existing-object-transfer.cjs` | PASS |
| `node tests/browser-relation-sorting.cjs` | PASS |
| `node tests/browser-confirmed-relation-sorting.cjs` | PASS |
| `node tests/browser-page-ui.cjs` | PASS |
| `git diff --check` | PASS |
| `git status -sb` | Assigned feature branch, clean after delivery commits |

The new Node tests cover heading/title structure, prompt cancellation/no-op/save,
category metadata preservation, stale prompt rejection, literal description DOM,
caption order, keyboard edits/cancellation, 280/281 Unicode boundary, read/stale/
detached save guards, language preservation and removal of old UI captions/action.
The real-browser suite covers computed object/category typography, symbol/name
alignment, exact prompt saves, literal hostile descriptions, caption rectangles
below content/input (including creation), keyboard Save/Cancel, Escape from Save,
mode-lock cancellation and detached Save, complete snapshots/counts, responsive
action order, and actual existing category move/rename/confirmed deletion actions.

Existing UI tests were adapted without removing their behavioral assertions:
- Symbol-heading checks target categoryHeadingSymbol now that h1 also contains name.
- Category note tests open the click-to-edit frame; read mode has no Save element.
- Prompt answers replace the removed permanent category-name editor interaction.
- The sorting test retains identity checks on the actual description frame rather
  than the former permanently mounted textarea.
- Appearance behavior tests invoke the retained public openAppearanceDialog handler
  because its page entry button is intentionally absent. All color, immigrant,
  template, edge, persistence and confirmation assertions remain.

The first Node run exposed two old heading assertions; they were updated to the
symbol span, preserving exact symbol checks. Final complete runs pass. Existing
suites retain native capture loss at 150 ms, 800 ms/F2/touch cancellation,
immigrant/template rules, paused restoration, sorting and six-criterion limits,
transfer confirmations, library isolation and deterministic CDP interception.
Source comparison in evidence/protected-methods.txt confirms the sorting helpers,
saveCategoryName/saveCategoryNotes/saveFreeText/sync, move rules, templateFor,
requestDeleteNode, symbol dialog logic and bindLongPress are byte-identical apart
from checkout line-ending normalization.

## Screenshots and layout

Final evidence: ../evidence/tmp/task007-ui-jHxMSu/category-1280.png,
category-375.png, category-320.png, object-1280.png, object-375.png, object-320.png.
The equivalent preceding category/object 320 px images were visually inspected.
At all three widths, long Unicode/markup-like/unbroken titles wrap within the card,
category/object title font size/weight/family match, action controls stay within the
viewport in rename/category/delete order, and document width does not overflow.
Captions are below actual content and editable inputs by DOM and rectangle checks.

## Complete preservation and persistence counts

Complete synthetic snapshots include all node/edge/category-state records, IDs,
both language fields, colors/icons, immigrant flags, clocks and unknown nested
metadata. Opening pages, editors or rename prompts, cancellation, unchanged saves,
read-mode attempts, rejected 281-character notes, sorting and navigation preserve
these snapshots and produce zero logical saves/storage writes.

A valid category-name edit changes only its name field and saves once. Valid notes
change only notes, retain metadata/clocks/edges and save once. A valid object
description edit changes only its existing language field plus its approved edit
clock; English/future fields, IDs, other records and active/paused edges remain
exact. Each successful local edit performs one logical sync and three existing
storage-key writes; no duplicate save follows. Existing actual move, rename and
delete actions retain their established one-save behavior. Removed appearance
controls cause no color/icon data changes merely by viewing the page.

No persistence implementation or key/schema was changed. Cloud merge/reload
coverage remains in the existing Node suites. New UI writes only through the
unchanged save methods. Browsers strip Firebase SDK/config/initialization before
startup, use disposable synthetic libraries, and retain CSP/CDP external blocking
plus a blocked proxy. Completed suites report no unexpected external requests,
page errors or injected payload execution. No production libraries/services,
credentials or paid APIs were accessed.

## Inherited limitations and deferred work

Existing sync/loader cleanup can still remove pre-existing dangling edges on
legacy save/load paths; this UI task does not redesign persistence. Whole-array
cloud concurrency, client clocks, duplicate-title cleanup, malformed legacy data
assumptions, client-only creative policy and unrelated old ID/link interpolation
surfaces remain. Description content refactored here is literal and safe, but this
is not a whole-application XSS audit. Offline mocks do not establish live cloud
security/durability. Fixed Swedish sorting still follows the runtime ICU version.

Native rename prompts retain the existing browser interaction style. Smarter
symbol/name lookup, category dialog redesign, quick-link suggestions, create/link
branching, manual-link-dialog removal, bilingual UI and other tasks are deferred.
No merge, deployment or auto-merge.

Changed files: index.html; tests/categories.test.cjs; tests/browser-smoke.cjs;
tests/browser-category-moves.cjs; tests/browser-header-search.cjs;
tests/browser-relation-sorting.cjs; tests/page-ui.test.cjs;
tests/browser-page-ui.cjs; TASK007-QA.md.
