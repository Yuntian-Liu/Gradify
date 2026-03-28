# Changelog

All notable changes to this project will be documented in this file.

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
