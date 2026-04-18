# Changelog

All notable changes to this project will be documented in this file.

## [1.8.2] - 2026-04-18

### Fixed
- Stale data guard (`getStaleChecks`) false-positive: empty Error Notes or unchecked Issue flags were incorrectly reported as "unchanged from previous student" when switching between students. Empty fields now bypass the comparison since they cannot waste tokens.

## [1.8.1] - 2026-04-12

### Changed
- Standardized all project version numbers to Semantic Versioning (SemVer) under the 1.x series.
- Version mapping: V1.0→1.0.0, V1.5→1.1.0, V2.0→1.2.0, V2.5→1.3.0, V3.0→1.4.0, V3.0.1→1.4.1, V3.0.2→1.4.2, V3.0.3→1.5.0, V3.1.0→1.6.0, V3.2.0→1.7.0, V3.3.1→1.8.0.
- Added missing changelog entries for versions 1.0.0–1.3.1 and 1.6.0.

## [1.8.0] - 2026-04-12

### Added
- Student change stale data guard: detects when student name changes but Error Notes or Issue checkboxes remain unchanged from the previous generation, with a modal dialog showing which field(s) haven't been updated.
- Amber warning banner below Error Notes textarea when stale data is detected.
- Quick clear button next to Error Notes header (visible only when textarea has content).
- Version chip badge (V1.8.0) with glassmorphism effect in header, JetBrains Mono font.

### Fixed
- Rating "A" template had a typo `{local_sections}` instead of `{lost_sections}`, causing raw placeholder to appear ~16.7% of the time.
- Issue heading italic text rendered as raw asterisks in some cases; switched from `*text*` to `<em>` HTML tags for reliable rendering.
- Clear button didn't sync the notes color bar and token estimate counters.

## [1.7.0] - 2026-04-10

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

## [1.6.0] - 2026-04-07

### Added
- Added splash screen with typewriter title animation and liquid glass material system.
- Added Canvas colorful mouse trail particles and custom circular cursor.
- Added feature cards (Smart Error Analysis / Personalized Feedback / One-Click Export) with brand-color left borders.
- Added CTA button with confetti animation and sparkle icon.
- Added bilingual description blocks with gradient highlights and glass substrate.
- Added bottom site matrix capsule bar (Gradify Studio / Selfie / MyScore) with hover feedback.
- Added background decorations (3 SVG waves, dual arcs, 5 floating shapes, 15 twinkling stars).
- Added `prefers-reduced-motion` accessibility support for reduced animation mode.

### Improved
- Improved title typography with DM Sans font and responsive `clamp(72px,13vw,140px)` sizing.
- Improved animation orchestration with 750ms post-typewriter element placement.
- Improved site matrix links with official domain names.

### Fixed
- Fixed clipboard bold/line-break loss for WeChat/DingTalk — semantic tags converted to inline styles before copy.
- Fixed copy button frequent failure — temporary contentEditable disable, error logging, and user-facing failure toast.

## [1.5.0] - 2026-04-03

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

## [1.4.2] - 2026-03-28

### Fixed
- Fixed rich-text divider copy loss: inserted dividers now persist when copying feedback to external rich-text editors.
- Fixed heading adhesion issues in copied content (for example `Reading部分` sticking to adjacent lines) by aligning clipboard HTML structure with rendered layout.
- Fixed overflow behavior in `Feedback Draft` editor: long lines now stay inside the container instead of pushing content off-canvas.
- Fixed highlight toggle scope so un-highlighting no longer wipes unrelated highlighted text.
- Fixed italic toggle scope so un-italicizing selected text no longer clears whole italic blocks.

### Improved
- Improved divider rendering consistency across edit, preview, and clipboard flows.
- Improved readability and visual stability for long mixed-format paragraphs in the editable output area.

## [1.4.1] - 2026-03-28

### Fixed
- Fixed the highlight toggle bug in `Feedback Draft` editor: highlighted text can now be un-highlighted by clicking `Highlight` again.

### Improved
- Improved cross-browser compatibility for highlight handling by covering both `<mark>` tags and inline `background-color` styles.
- Improved editing consistency and stability for manual post-generation refinement.

## [1.4.0] - 2026-03-28

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
- v1.4.0 is a major UX + AI capability release focused on usability, transparency, and runtime stability.

## [1.3.1] - 2026-03-22

### Fixed
- Fixed missing preview prompt text for homework checkbox.

## [1.3.0] - 2026-03-20

### Added
- Added Quick Phrases panel with one-click copy for Task, Reading Skill, and Vocabulary/Reading.
- Added dynamic unit label for preview checkboxes with real-time text linking.
- Added unified card-style design for Quick Phrases and preview sections.

## [1.2.0] - 2026-03-20

### Added
- Added independent greeting card system with separate copy/export workflow.
- Added 3-tier copy strategy (copy all / copy greeting / copy feedback only).
- Added 3-segment unit progress input (unit + course type + lesson number).
- Added A/B preview type selection for homework feedback.
- Added 4-stage generation status visualization (greeting → template → AI expansion → done).
- Added toast notification system for copy and interaction feedback.
- Added full UI redesign with Anthropic-inspired warm neutral color palette, shadow system, and Inter/SF Pro font stack.

### Changed
- Refactored backend with `build_greeting()` function for modular greeting generation.
- Switched from inline clipboard to Clipboard API with execCommand fallback.

## [1.1.0] - 2026-03-14

### Added
- Added multi-template random switching for greetings and rating remarks.
- Added star-shimmer loading animation during AI generation.
- Added real-time generation status feedback.
- Added blue theme and glassmorphism footer design.
- Added ICP filing information display.
- Added smart course linking with auto type detection.

### Changed
- Raised max_tokens from 1000 to 10000 for longer AI responses.
- Improved AI prompt tone and line-break formatting.

## [1.0.0] - 2026-03-14

### Added
- Initial release of Gradify English Homework Feedback Generator.
- Core template + AI hybrid architecture for feedback generation.
- Smart L/Day course type auto-detection.
- Preview homework support with checkbox integration.
- OpenAI GPT streaming output with typewriter effect.
- Markdown rendering for AI-generated content.
- Glassmorphism UI with blue theme and left-right split layout.
