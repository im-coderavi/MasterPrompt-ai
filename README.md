# PromptMaster AI - Your Senior Prompt Engineer

Transform any vague prompt into a precise, surgical AI instruction. Works with Copilot, ChatGPT, Cursor, Gemini, Claude - any AI tool.

## Features

### Local Prompt Enhancement (Zero API, Zero Config)
- Type any raw prompt -> get a structured, AI-ready prompt instantly
- Auto-detects intent: Bug Fix, Refactor, Add Feature, Write Tests, Security, Explain
- Injects VS Code context automatically (file, language, function, errors)
- Adds scope lock rules so AI does not overwrite your code
- Works 100% offline, under 50ms

### Code Tag System
- Select code -> right-click -> **Tag for PromptMaster AI**
- Tagged code gets embedded in prompts with exact line boundaries
- AI is explicitly told not to touch anything outside the tagged block
- Blue gutter decoration shows tagged code at a glance

### Smart Mode (AI-Powered Enhancement)
- Uses your own API key (Gemini, OpenAI, Claude, or any custom endpoint)
- Handles vague, multi-language, and complex prompts that templates cannot
- Falls back to local mode silently if API fails
- API keys stored with OS-level encryption (SecretStorage)

### Privacy First
- Smart Mode OFF = zero network requests
- No telemetry, no analytics, no account required
- API keys never appear in settings files or logs

## Quick Start

1. Install the extension from VS Code Marketplace
2. Click the **PromptMaster AI** icon in the Activity Bar
3. Type your prompt -> Click **Enhance** -> Copy the result
4. Paste into any AI tool (Copilot, ChatGPT, Cursor, etc.)

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+T` | Tag selected code |
| `Ctrl+Alt+E` | Enhance current prompt |

## Smart Mode Setup

1. Open the **Settings** tab in the sidebar
2. Enable **Smart Mode** toggle
3. Select your AI provider
4. Enter your API key
5. Click **Test Connection**

### Get API Keys
- [Google Gemini](https://aistudio.google.com/app/apikey)
- [OpenAI](https://platform.openai.com/api-keys)
- [Anthropic Claude](https://console.anthropic.com/settings/keys)

## License

MIT

Made with love by Avishek
