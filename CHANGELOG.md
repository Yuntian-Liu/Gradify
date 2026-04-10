# Changelog

All notable changes to this project will be documented in this file.

## [3.2.0] - 2026-04-10

### Added
- Added customizable "缺作业页面" Issue Flag: config panel with Task number (1-7) + preset dropdown (造句/Vocabulary/Grammar/Match/Reading/Writing) + custom text input, replacing hardcoded Task6 判断题 template.
- Added AI Status card in output area showing Prompt/Completion/Total Tokens, TTFT, total time, and estimated cost (¥ with 8 decimal places).
- Added collapsible Thinking Process section for model reasoning content (collapsed by default with expand icon).
- Added "正在思考中" timer animation (bouncing dots + elapsed seconds) during AI generation.
- Added Prompt Tokens estimate indicator below Error Notes textarea with real-time estimation on form changes.
- Added `POST /api/estimate-tokens` endpoint for lightweight token estimation without real API call.
- Added `estimate_tokens()` backend function for mixed Chinese/English token estimation.
- Added bold "Reading Skill" label in Quick Phrases row for better UX clarity.

### Improved
- Generalized markdown heading regex from hardcoded `Task6 判断题` to `Task\d+\s+\S+` for any Task+content combination.
- Refactored AI streaming statistics collection: start time, first-token time, end time, reasoning content, with fallback token estimation when API provider doesn't return usage.
- Replaced CSS-based output-scroll height calculation with JS dynamic measurement (`fitOutputScroll()`) to avoid CSS Grid layout conflicts.

### Fixed
- Fixed right panel output-frame bottom border clipping by using JS height measurement instead of CSS flex/calc.
- Fixed output height not adjusting when Quick Phrases is collapsed/expanded by adding details toggle listener.

## [3.0.3] - 2026-04-03

### Added
- Added modular frontend architecture: JavaScript extracted from `index.html` into `static/app.js` with FastAPI static file serving.
- Added XSS sanitization (`sanitizeHtml`) for clipboard operations and output rendering.
- Added skeleton loading animation during AI feedback generation.
- Added Error Notes character counter with 5-zone gradient color bar (brief/good/optimal/thorough/extreme, max 250 chars).
- Added drag-to-resize handle for assistant panel with size persistence via localStorage.
- Added Quick Phrases Task preset dropdown (造句/Vocabulary/Grammar/Match/Reading).

### Improved
- Improved initialization robustness with per-step error isolation in `initApp()`.
- Improved Ctrl+Enter keyboard shortcut to only trigger within form and output areas.

### Fixed
- Fixed rich text bold toggle stacking (each click no longer adds nested wrappers).
- Fixed highlight toggle not canceling existing highlights.
- Fixed italic toggle clearing entire blocks instead of selected text.

## [3.0.2] - 2026-03-28

### Fixed
- Fixed rich-text divider copy loss: inserted dividers now persist when copying feedback to external rich-text editors.
- Fixed heading adhesion issues in copied content (for example `Reading部分` sticking to adjacent lines) by aligning clipboard HTML structure with rendered layout.
- Fixed overflow behavior in `Feedback Draft` editor: long lines now stay inside the container instead of pushing content off-canvas.
- Fixed highlight toggle scope so un-highlighting no longer wipes unrelated highlighted text.
- Fixed italic toggle scope so un-italicizing selected text no longer clears whole italic blocks.

### Improved
- Improved divider rendering consistency across edit, preview, and clipboard flows.
- Improved readability and visual stability for long mixed-format paragraphs in the editable output area.

## [3.0.1] - 2026-03-28

### Fixed
- Fixed the highlight toggle bug in `Feedback Draft` editor: highlighted text can now be un-highlighted by clicking `Highlight` again.

### Improved
- Improved cross-browser compatibility for highlight handling by covering both `<mark>` tags and inline `background-color` styles.
- Improved editing consistency and stability for manual post-generation refinement.

## [3.0.0] - 2026-03-28

### Added
- Added a redesigned UI theme with improved layout hierarchy and visual consistency.
- Added Tutor Assistant panel for independent Q&A without interrupting feedback generation.
- Added image understanding in assistant chat (paste/upload image support).
- Added web search tool calling toggle for assistant chat.
- Added assistant response status feedback ("thinking..." with timer).
- Added token usage display for assistant responses (prompt/completion/total).
- Added web search usage and source citations display in assistant messages.
- Added rich output editing tools (manual bold/highlight) and rendered/raw mode switch.
- Added model display badges for generation and assistant modules.

### Changed
- Changed greeting time options by splitting noon and afternoon into separate choices.
- Changed quick phrase and output interactions for better copy/edit efficiency.
- Changed header metadata area to include filing and copyright presentation.
- Changed assistant UI controls from text buttons to icon-first actions.

### Fixed
- Fixed generation failure in edge cases (A+ with empty error notes stream handling).
- Fixed markdown rendering artifacts (unexpected horizontal lines and spacing issues).
- Fixed missing auto-bold rules for specific issue flag titles.
- Fixed clipboard behavior so rich text styles can be preserved when supported.
- Fixed image request compatibility issues with multi-format payload fallback.
- Fixed model name case sensitivity issues by normalizing model names before requests.
- Fixed assistant markdown rendering and improved response visibility during async wait.

### Notes
- v3.0 is a major UX + AI capability release focused on usability, transparency, and runtime stability.
