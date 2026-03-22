# Changelog

## [1.0.2] - 2026-03-22

### Added
- Rebuilt the sidebar into a 2-tab Chat and Settings experience tailored for PromptMaster AI.
- Added offline local enhancement mode with instant prompt rewriting, variations, and prompt handoff into Smart Mode.
- Added streaming Smart Mode chat with markdown rendering, code-copy controls, file attachment, saved prompts, and apply-to-file flow.

### Changed
- Switched settings storage to a structured SecretStorage plus globalState service layer.
- Updated extension activation, sidebar contribution, and VS Code engine support for the new webview architecture.

## [1.0.1] - 2026-03-22

### Fixed
- Smart Mode settings now load/save reliably per provider.
- API key saved status now updates correctly for the selected provider.
- Provider switch now refreshes saved model, endpoint, and key state instantly.

### Added
- New Smart Chat Enhancer panel inside Smart Mode tab for conversational prompt enhancement.
- Better Smart Mode loading/error/result feedback in the sidebar.

## [1.0.0] - 2026-03-21

### Added
- Local Prompt Enhancement engine with 7 mode templates
- Code Tag System with comment markers and blue gutter decoration
- Smart Mode with support for Gemini, OpenAI, Anthropic, and custom endpoints
- API Settings panel with SecretStorage for secure key management
- 3-tab sidebar UI (Enhance, Tag Mode, Settings)
- Auto-detect mode via keyword analysis
- Color-coded prompt output (Context, Task, Code, Scope Lock, Output)
- Status bar showing current mode and tag status
- Right-click context menu for tagging and enhancing selections
- 8 command palette commands
- Keyboard shortcuts (Ctrl+Alt+T, Ctrl+Alt+E)
