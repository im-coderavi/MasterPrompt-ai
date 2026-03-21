# PromptMaster AI — Your Senior Prompt Engineer
## Product Requirements Document v1.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Extension Identity](#4-extension-identity)
5. [Target Users](#5-target-users)
6. [Feature Specifications](#6-feature-specifications)
   - 6.1 [Local Prompt Enhancer](#61-local-prompt-enhancer-feature-1)
   - 6.2 [Code Tag System](#62-code-tag-system-feature-2)
   - 6.3 [Smart Mode](#63-smart-mode-feature-3)
   - 6.4 [API Settings Panel](#64-api-settings-panel-feature-4)
7. [Prompt Output Structure](#7-prompt-output-structure)
8. [Mode Reference & Keyword Map](#8-mode-reference--keyword-map)
9. [Extension Interface & UX](#9-extension-interface--ux)
10. [Technical Architecture](#10-technical-architecture)
11. [File & Folder Structure](#11-file--folder-structure)
12. [Key Implementation Details](#12-key-implementation-details)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Development Milestones](#14-development-milestones)
15. [Post-Launch Roadmap](#15-post-launch-roadmap)

---

## 1. Project Overview

**Extension Name:** PromptMaster AI — Your Senior Prompt Engineer  
**Platform:** Visual Studio Code Extension (Marketplace)  
**Author:** Avishek  
**Version:** 1.0.0  
**VS Code Engine:** ^1.75.0  
**Language:** TypeScript  
**Publisher ID:** `promptmaster-ai`  
**Extension ID:** `promptmaster-ai.promptmaster-ai`

PromptMaster AI is a VS Code extension that acts as a senior prompt engineer sitting beside every developer. It takes whatever the developer types — short, vague, incomplete, or written in any language — and transforms it into a precise, structured, AI-ready prompt that gets exactly the right result from any AI coding tool (Copilot, ChatGPT, Cursor, Gemini, Claude — all of them).

---

## 2. Problem Statement

Every developer who uses AI coding tools faces the same frustrations daily:

- They type `"fix the bug"` → AI rewrites the entire function
- They type `"add validation"` → AI removes existing logic
- They type `"refactor this"` → AI changes variable names, signatures, and unrelated code
- They write in their native language → AI misunderstands the intent

**Root cause:** The prompt is incomplete. It lacks context, scope, and output instructions. Most developers do not know prompt engineering and should not have to learn it just to use their tools.

---

## 3. Solution

PromptMaster AI intercepts the developer's raw intent before it reaches any AI tool. It:

1. Reads context from VS Code automatically (file, function, errors, language)
2. Detects the developer's intent via keyword analysis
3. Applies the correct prompt template for the task type
4. Injects all context into the template
5. Appends strict scope lock rules (what the AI must NOT change)
6. Produces a ready-to-copy, surgical, AI-ready prompt

**The developer types naturally. PromptMaster AI does the engineering.**

---

## 4. Extension Identity

```
Display Name  : PromptMaster AI — Your Senior Prompt Engineer
Extension ID  : promptmaster-ai
Command Prefix: promptmaster
Config Prefix : promptmaster
Icon          : robot/engineer themed icon (purple gradient)
Category      : AI, Productivity
Tags          : prompt engineering, ai, copilot, chatgpt, gemini, developer tools
```

### package.json basics

```json
{
  "name": "promptmaster-ai",
  "displayName": "PromptMaster AI — Your Senior Prompt Engineer",
  "description": "Transform any vague prompt into a precise, surgical AI instruction. Works with Copilot, ChatGPT, Cursor, Gemini, Claude — any AI tool.",
  "version": "1.0.0",
  "publisher": "avishek",
  "engines": { "vscode": "^1.75.0" },
  "categories": ["AI", "Other"],
  "keywords": ["prompt", "ai", "copilot", "chatgpt", "gemini", "prompt engineering"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js"
}
```

---

## 5. Target Users

### Primary Users

**Junior Developers**  
Learning to use AI tools but do not know prompt engineering. They benefit most from automatic enhancement and scope locking.

**Mid-level Developers**  
Use AI tools daily and are frustrated by AI overstepping. Want faster, precise results without spending time crafting perfect prompts manually.

**Non-English Speaking Developers**  
Think and communicate in their native language (Hindi, Hinglish, Spanish, etc.). Smart Mode accepts any language and always outputs a clean English prompt.

### Secondary Users

- Senior developers who want a consistent, faster prompt workflow
- Freelancers working across multiple codebases and languages
- Developer content creators who want clean AI-assisted coding demos

---

## 6. Feature Specifications

---

### 6.1 Local Prompt Enhancer (Feature 1)

**What it does:**  
Rule-based, template-driven prompt enhancement. Zero API. Zero internet. Zero configuration. Works completely offline. Enhancement completes in under 50ms.

**How it works — step by step:**

1. Developer opens the PromptMaster AI sidebar
2. Developer types any raw prompt in the text area
3. Developer selects a mode (or leaves it on Auto-detect)
4. Developer clicks **Enhance**
5. Extension reads VS Code context silently:
   - Active file name + relative path
   - Programming language (`document.languageId`)
   - Function/class name at cursor position (regex-based detection)
   - All active diagnostic errors and warnings (`vscode.languages.getDiagnostics()`)
   - Selected text (if any)
   - Tagged code block (if a tag is active)
6. Extension scans prompt for intent keywords → selects mode
7. Extension fills the mode template with all context data
8. Extension appends scope lock rules for that mode
9. Enhanced prompt appears in output panel
10. Developer copies with one click and pastes into any AI tool

**What gets injected automatically (developer never types these):**

- `[CONTEXT]` — File name, language, function name, active errors
- `[TASK]` — Developer's intent, restated precisely
- `[CODE]` — Tagged code block (tag mode only)
- `[SCOPE LOCK]` — What the AI must NOT do
- `[OUTPUT]` — Exact format the AI must return

---

### 6.2 Code Tag System (Feature 2)

**What it does:**  
Lets the developer mark a specific code block and associate a prompt with it. The enhanced prompt is physically scoped to that block — the AI is explicitly told the exact boundaries and instructed not to touch anything outside.

**How it works — step by step:**

1. Developer selects any code block in any file
2. Developer right-clicks → **"Tag for PromptMaster AI"**
3. Extension performs a workspace edit that inserts two comment markers:
   ```
   // @promptmaster:start
   <selected code>
   // @promptmaster:end
   ```
4. A blue left-border decoration appears on the tagged block in the editor gutter
5. Developer opens the **Tag Mode** tab in the sidebar
6. Developer sees a preview of the tagged code
7. Developer writes a prompt describing the task
8. Extension generates a prompt that:
   - Embeds the exact tagged code
   - States the file + line range explicitly
   - Adds scope lock: "do NOT modify anything outside lines X–Y"
9. Developer copies the enhanced prompt

**Tag rules:**
- Only one active tag per file at a time
- Adding a new tag removes the previous one automatically
- Tags are removed on demand via the sidebar Remove Tag button or command palette
- Tags are never committed to git — add `// @promptmaster:` to `.gitignore` suggestion
- Tags survive file saves and VS Code restarts

---

### 6.3 Smart Mode (Feature 3)

**What it does:**  
Uses the developer's own AI API key to enhance prompts with genuine AI reasoning. Handles vague, ambiguous, multi-language prompts that rule-based templates cannot handle well.

**When to use Smart Mode vs Local Mode:**

| Scenario | Local Mode | Smart Mode |
|---|---|---|
| "fix the null bug in validateToken" | ✅ Perfect | Works too |
| "yaar yeh wala part thoda better kar de" | ❌ Too vague | ✅ AI understands |
| "this doesn't feel right, clean it up" | ❌ Too vague | ✅ AI understands |
| "add error handling" | ✅ Good | Works too |
| Prompt in Hindi / French / Spanish | ❌ Weak | ✅ Outputs English |
| Complex multi-step task | ❌ Weak | ✅ Structured output |

**How Smart Mode works — step by step:**

1. Smart Mode toggle is ON in settings + API key is configured
2. Developer types any raw prompt (any language, any vagueness)
3. Developer clicks **Enhance**
4. Extension reads full VS Code context (same as local mode)
5. Extension builds the API request:
   - **System prompt:** Senior Prompt Engineer instruction (see below)
   - **User message:** Raw prompt + all context formatted cleanly
6. Extension sends request to configured provider
7. Loading indicator shows in output panel
8. Response arrives (2–5 seconds typical)
9. Enhanced prompt replaces loading indicator
10. If API call fails → silently falls back to local mode + shows notification

**Smart Mode System Prompt — this is the soul of Smart Mode:**

```
You are a senior prompt engineer with deep expertise in AI-assisted 
software development. You have 10 years of experience helping developers 
get precise, correct results from AI coding tools.

Your ONLY job is to take a developer's raw request and transform it into 
a precise, engineering-grade prompt that will get the best possible result 
from an AI coding assistant.

Rules you must follow without exception:

1. Analyze the developer's true intent deeply, even if their words are 
   vague, ambiguous, or written in a language other than English.

2. Always write the final output prompt in clear, professional English 
   regardless of what language the input was written in.

3. Inject all context provided to you — file name, language, function 
   name, active errors, tagged code block.

4. Add scope lock instructions that explicitly tell the AI what it must 
   NOT change. This is the most critical section of every prompt.

5. Specify the exact output format — what the AI should return, how much 
   of the file to include, whether to explain changes.

6. Be surgical. The prompt must make the AI do exactly what the developer 
   wants — no more, no less.

You do NOT write code.
You do NOT answer developer questions.
You do NOT add suggestions the developer did not ask for.
You ONLY return the enhanced prompt. Nothing else.
No preamble. No explanation. No markdown wrapper. Just the prompt text.
```

**User message format sent to AI:**

```
RAW PROMPT FROM DEVELOPER:
{developer's raw prompt}

VS CODE CONTEXT:
- File: {fileName} ({relativePath})
- Language: {languageId}
- Function at cursor: {functionName}
- Active errors: {errors}
- Active warnings: {warnings}
- Tagged code block: {taggedCode or "none"}

Transform this into an engineering-grade prompt following your rules.
```

---

### 6.4 API Settings Panel (Feature 4)

**Design principle:**  
Completely separate panel from the main UI. Configured once, never touched again. API keys stored with OS-level encryption. Zero keys in any file.

**Settings fields:**

| Field | Type | Description |
|---|---|---|
| Smart Mode Toggle | Toggle switch | Master on/off. When OFF, zero network requests made |
| AI Provider | Dropdown | Gemini, OpenAI, Anthropic, Custom |
| API Key | Password input | Stored in `vscode.SecretStorage` only |
| Model Name | Text input | Pre-filled with provider default, user-overridable |
| Custom Endpoint URL | Text input | Visible only when Custom provider selected |
| Test Connection | Button | Sends minimal request, shows success/error inline |
| Clear API Key | Button | Removes key from SecretStorage |

**Supported providers:**

| Provider | Default Model | Endpoint |
|---|---|---|
| Google Gemini | `gemini-2.0-flash` | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |
| OpenAI | `gpt-4o-mini` | `https://api.openai.com/v1/chat/completions` |
| Anthropic Claude | `claude-haiku-4-5-20251001` | `https://api.anthropic.com/v1/messages` |
| Custom | User defined | Any OpenAI-compatible endpoint |

**Security requirements — non-negotiable:**

- API keys MUST be stored via `vscode.SecretStorage` exclusively
- Keys MUST NEVER appear in `settings.json`, `keybindings.json`, or any workspace file
- Keys MUST NEVER appear in `console.log`, error messages, or notifications
- Keys MUST NEVER be sent to any server other than the configured provider endpoint
- When Smart Mode toggle is OFF, zero API calls are made, zero keys are read
- Status bar must always show current mode (Local / Smart + provider name)

---

## 7. Prompt Output Structure

Every enhanced prompt follows the same structure regardless of mode. Each section is labeled and color-coded in the output panel.

```
[CONTEXT]
File: cart.js (src/utils/cart.js)
Language: JavaScript
Function: calculateTotal()
Active error: TypeError: Cannot read properties of undefined (reading 'price') at line 52

[TASK]
Fix ONLY the null reference error in calculateTotal() at line 52 where item.price
can be undefined. The fix should add a null/undefined check before accessing item.price.

[CODE]  ← only in tag mode
function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
}

[SCOPE LOCK]
- Do NOT modify any code outside the calculateTotal() function
- Do NOT rename any variables or parameters
- Do NOT change the function signature or return type
- Do NOT refactor or restructure any other logic in this file
- Do NOT add any imports

[OUTPUT]
Return ONLY the corrected calculateTotal() function.
Include a single inline comment on the line that was changed explaining why.
Do not return the full file. Do not add explanation outside the code block.
```

**Color coding in the output panel UI:**

| Section | Color |
|---|---|
| `[CONTEXT]` label + content | Blue (`#89b4fa`) |
| `[TASK]` label + content | Green (`#a6e3a1`) |
| `[CODE]` label + content | Orange (`#fab387`) |
| `[SCOPE LOCK]` label + content | Red (`#f38ba8`) |
| `[OUTPUT]` label + content | White (`#cdd6f4`) |

---

## 8. Mode Reference & Keyword Map

| Mode | Trigger Keywords | Scope Lock Applied | Output Instruction |
|---|---|---|---|
| **Bug Fix** | fix, bug, error, broken, crash, null, undefined, issue, not working, failing, exception | No rename, no refactor, no unrelated changes, no signature change | Return only fixed block + one-line comment |
| **Refactor** | clean, refactor, improve, simplify, readable, restructure, reorganize, better | No behavior change, no API change, no function rename, keep comments | Return refactored code with inline comments |
| **Add Feature** | add, create, implement, build, new, include, extend, append, feature | Do not modify existing code, only add new code, mark additions with `// NEW` | Return modified block showing additions |
| **Write Tests** | test, tests, unit test, spec, coverage, jest, mocha, vitest, cypress, playwright | Do not modify source function | Return tests using existing framework |
| **Security** | secure, security, vulnerability, injection, xss, auth, sanitize, validate, exploit | No refactor, no performance changes, security only | Numbered list of vulnerabilities with severity |
| **Explain** | explain, what does, how does, describe, understand, walk me through, what is this | No suggestions, no rewrites, only explanation | Plain English, suitable for developer's level |
| **General** | fallback when no keyword matches | Minimal scope lock: do not change unrelated code | Return only the changed parts |

**Auto-detection logic:**

```typescript
function detectMode(prompt: string): Mode {
  const lower = prompt.toLowerCase()
  for (const [mode, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return mode as Mode
    }
  }
  return 'general'
}
```

---

## 9. Extension Interface & UX

### Sidebar Panel — Three Tabs

**Tab 1: Enhance**
- Mode selector: Auto | Bug Fix | Refactor | Add Feature | Write Tests | Security | Explain
- Raw prompt textarea (placeholder: "Describe what you want AI to do...")
- Enhance button (shows spinner when Smart Mode is active)
- Output section:
  - Color-coded enhanced prompt display
  - Copy button (copies plain text version)
  - Character count of enhanced vs raw prompt
  - Badge showing which mode was used
  - Badge showing Local or Smart label

**Tab 2: Tag Mode**
- Shows current tagged file + line range
- Preview of tagged code block (scrollable, syntax-highlighted look)
- Remove Tag button
- Prompt input: "What do you want done on this tagged code?"
- Enhance button
- Same output section as Tab 1
- If no tag is active: shows message "No code tagged yet. Select code in editor → right click → Tag for PromptMaster AI"

**Tab 3: Settings**
- Smart Mode toggle (prominent, at top)
- Provider selector dropdown
- API Key input (password field, shows/hides toggle)
- Model Name input
- Custom Endpoint URL input (conditional)
- Test Connection button + inline result
- Clear API Key button
- Links: How to get API keys for each provider

### Status Bar Item

Always visible in the VS Code status bar (bottom left area).

- Smart Mode OFF: `$(robot) PromptMaster: Local`
- Smart Mode ON: `$(robot) PromptMaster: Gemini` (or OpenAI / Claude / Custom)
- Tag active: `$(tag) Tag active — cart.js`
- Clicking the item opens the PromptMaster AI sidebar

### Right-Click Context Menu

When text is selected in any editor file:
- `Tag for PromptMaster AI` — sets selected block as active tag
- `Enhance Selection as Prompt` — treats selected text as raw prompt, enhances immediately, shows result in sidebar

### Command Palette Commands

```
PromptMaster: Open Panel
PromptMaster: Tag Selection
PromptMaster: Remove Tag
PromptMaster: Enhance Current Prompt
PromptMaster: Open Settings
PromptMaster: Toggle Smart Mode
PromptMaster: Copy Last Enhanced Prompt
PromptMaster: Clear Prompt History
```

### Keyboard Shortcuts (defaults, user-rebindable)

```
Ctrl+Shift+P then PromptMaster: Enhance  →  no default shortcut (command palette only)
Ctrl+Alt+T  →  Tag Selection
Ctrl+Alt+E  →  Enhance Current Prompt
```

---

## 10. Technical Architecture

### Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Extension runtime | TypeScript | Type safety, VS Code ecosystem standard |
| Sidebar UI | VS Code WebviewPanel + HTML/CSS/Vanilla JS | No React needed, lighter, faster |
| Local engine | Pure TypeScript, zero deps | Fast, offline, no node_modules bloat |
| Context reading | `vscode.window`, `vscode.workspace`, `vscode.languages` APIs | Official VS Code APIs |
| API key storage | `vscode.SecretStorage` | OS-level encryption, no file exposure |
| Smart Mode HTTP | Node.js built-in `fetch` | No axios, no extra dependencies |
| Tag detection | VS Code TextDocument API + regex | Simple, reliable |
| Build | esbuild | Fast bundling, small output |
| Package | vsce | Official VS Code extension packaging |

### Module Breakdown

**`src/extension.ts`** — Entry point  
Registers all commands, creates the sidebar provider, subscribes to VS Code events, manages extension lifecycle.

```typescript
export function activate(context: vscode.ExtensionContext) {
  const tagManager = new TagManager(context)
  const contextReader = new ContextReader()
  const promptEngine = new PromptEngine()
  const smartMode = new SmartMode(context)
  const sidebarProvider = new SidebarProvider(context, tagManager, contextReader, promptEngine, smartMode)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('promptmaster.sidebar', sidebarProvider),
    vscode.commands.registerCommand('promptmaster.tagSelection', () => tagManager.tagSelection()),
    vscode.commands.registerCommand('promptmaster.removeTag', () => tagManager.removeTag()),
    vscode.commands.registerCommand('promptmaster.openSettings', () => sidebarProvider.openSettings()),
    vscode.commands.registerCommand('promptmaster.toggleSmartMode', () => smartMode.toggle()),
    vscode.commands.registerCommand('promptmaster.enhanceCurrentPrompt', () => sidebarProvider.enhanceFromCommand()),
  )
}
```

---

**`src/promptEngine.ts`** — Local Enhancement Engine  
Pure, synchronous, zero async. Contains all templates and keyword maps.

```typescript
export interface PromptContext {
  fileName: string
  relativePath: string
  languageId: string
  functionName: string | null
  activeErrors: string[]
  activeWarnings: string[]
  selectedText: string | null
  taggedCode: string | null
  tagStartLine: number | null
  tagEndLine: number | null
}

export type Mode = 'bugfix' | 'refactor' | 'feature' | 'tests' | 'security' | 'explain' | 'general'

export class PromptEngine {
  detect(rawPrompt: string): Mode { /* keyword scan */ }
  enhance(rawPrompt: string, context: PromptContext, mode: Mode): string { /* template fill */ }
  buildScopeLock(mode: Mode, context: PromptContext): string { /* scope rules */ }
  buildOutputInstruction(mode: Mode): string { /* output format */ }
}
```

---

**`src/contextReader.ts`** — VS Code Context Reader  
Reads all editor state and returns a typed PromptContext object.

```typescript
export class ContextReader {
  async read(): Promise<PromptContext> {
    const editor = vscode.window.activeTextEditor
    if (!editor) return this.empty()

    return {
      fileName: path.basename(editor.document.fileName),
      relativePath: vscode.workspace.asRelativePath(editor.document.fileName),
      languageId: editor.document.languageId,
      functionName: this.detectFunctionAtCursor(editor),
      activeErrors: this.getErrors(editor.document.uri),
      activeWarnings: this.getWarnings(editor.document.uri),
      selectedText: this.getSelection(editor),
      taggedCode: this.tagManager.getTaggedCode(),
      tagStartLine: this.tagManager.getTagStartLine(),
      tagEndLine: this.tagManager.getTagEndLine(),
    }
  }

  private detectFunctionAtCursor(editor: vscode.TextEditor): string | null {
    // Scan upward from cursor to find nearest function/class/method declaration
    // Uses language-specific regex patterns for JS/TS/Python/Go/Rust/Java/C#
  }

  private getErrors(uri: vscode.Uri): string[] {
    return vscode.languages.getDiagnostics(uri)
      .filter(d => d.severity === vscode.DiagnosticSeverity.Error)
      .map(d => `Line ${d.range.start.line + 1}: ${d.message}`)
  }
}
```

---

**`src/tagManager.ts`** — Code Tag System

```typescript
export class TagManager {
  private tagDecoration: vscode.TextEditorDecorationType
  private activeTag: { uri: vscode.Uri; startLine: number; endLine: number } | null = null

  constructor(private context: vscode.ExtensionContext) {
    this.tagDecoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      borderWidth: '0 0 0 3px',
      borderStyle: 'solid',
      borderColor: new vscode.ThemeColor('charts.blue'),
      backgroundColor: new vscode.ThemeColor('diffEditor.insertedLineBackground'),
    })
  }

  async tagSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showWarningMessage('PromptMaster: Select some code first, then tag it.')
      return
    }
    await this.removeTag()  // remove previous tag
    const start = editor.selection.start.line
    const end = editor.selection.end.line

    await editor.edit(eb => {
      eb.insert(new vscode.Position(start, 0), '// @promptmaster:start\n')
      eb.insert(new vscode.Position(end + 1, 0), '\n// @promptmaster:end\n')
    })

    this.activeTag = { uri: editor.document.uri, startLine: start + 1, endLine: end + 1 }
    this.applyDecoration(editor)
    vscode.window.showInformationMessage('PromptMaster: Code tagged. Open Tag Mode tab to write your prompt.')
  }

  getTaggedCode(): string | null { /* reads lines between markers */ }
  getTagStartLine(): number | null { return this.activeTag?.startLine ?? null }
  getTagEndLine(): number | null { return this.activeTag?.endLine ?? null }

  async removeTag(): Promise<void> { /* removes comment markers + decoration */ }
  private applyDecoration(editor: vscode.TextEditor): void { /* renders blue highlight */ }
  scanForExistingTags(): void { /* called on startup to restore decorations */ }
}
```

---

**`src/smartMode.ts`** — AI Provider Communication

```typescript
export class SmartMode {
  private isEnabled = false

  constructor(private context: vscode.ExtensionContext) {
    this.isEnabled = context.globalState.get('promptmaster.smartModeEnabled', false)
  }

  async enhance(rawPrompt: string, vsContext: PromptContext): Promise<string> {
    const provider = this.context.globalState.get<string>('promptmaster.provider', 'gemini')
    const apiKey = await this.context.secrets.get(`promptmaster.apikey.${provider}`)
    const model = this.context.globalState.get<string>('promptmaster.model', this.defaultModel(provider))

    if (!apiKey) throw new Error('No API key configured for ' + provider)

    const systemPrompt = SMART_MODE_SYSTEM_PROMPT  // the senior PE system prompt
    const userMessage = this.buildUserMessage(rawPrompt, vsContext)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await this.callProvider(provider, apiKey, model, systemPrompt, userMessage, controller.signal)
      return response
    } finally {
      clearTimeout(timeout)
    }
  }

  private async callProvider(
    provider: string, apiKey: string, model: string,
    system: string, user: string, signal: AbortSignal
  ): Promise<string> {
    switch (provider) {
      case 'gemini': return this.callGemini(apiKey, model, system, user, signal)
      case 'openai': return this.callOpenAI(apiKey, model, system, user, signal)
      case 'anthropic': return this.callAnthropic(apiKey, model, system, user, signal)
      case 'custom': return this.callCustom(apiKey, model, system, user, signal)
      default: throw new Error('Unknown provider: ' + provider)
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> { /* minimal test request */ }
  toggle(): void { /* flip isEnabled, update status bar, save to globalState */ }
  getStatus(): { enabled: boolean; provider: string } { /* for status bar */ }
}
```

---

**`src/apiSettings.ts`** — Settings Panel Manager

Manages the settings webview. Handles messages from the UI. Reads/writes keys via SecretStorage.

```typescript
// Messages the webview can send to extension:
type SettingsMessage =
  | { command: 'saveApiKey'; provider: string; key: string }
  | { command: 'clearApiKey'; provider: string }
  | { command: 'saveSettings'; provider: string; model: string; endpoint?: string }
  | { command: 'testConnection' }
  | { command: 'toggleSmartMode'; enabled: boolean }
  | { command: 'ready' }   // webview loaded, send current settings

// Messages extension sends to webview:
type ExtensionMessage =
  | { command: 'settingsLoaded'; settings: CurrentSettings }
  | { command: 'testResult'; success: boolean; message: string }
  | { command: 'apiKeySaved'; provider: string }
```

---

**`src/sidebarProvider.ts`** — WebviewView Provider  
Manages the sidebar HTML/CSS/JS, handles messages from the webview, orchestrates all modules.

```typescript
export class SidebarProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true }
    webviewView.webview.html = this.getHtml(webviewView.webview)
    webviewView.webview.onDidReceiveMessage(async msg => {
      if (msg.command === 'enhance') {
        const context = await this.contextReader.read()
        const mode = this.promptEngine.detect(msg.prompt)
        let result: string

        if (this.smartMode.isEnabled) {
          try {
            result = await this.smartMode.enhance(msg.prompt, context)
          } catch (e) {
            vscode.window.showWarningMessage('PromptMaster: Smart Mode failed, using local engine.')
            result = this.promptEngine.enhance(msg.prompt, context, mode)
          }
        } else {
          result = this.promptEngine.enhance(msg.prompt, context, mode)
        }

        webviewView.webview.postMessage({ command: 'result', prompt: result, mode })
      }
    })
  }
}
```

---

**`src/statusBar.ts`** — Status Bar Manager  
Creates and updates the status bar item based on Smart Mode state and tag state.

---

**`src/templates/`** — Prompt Templates Directory  
One file per mode. Each file exports a template function that accepts context and returns a string.

```
src/templates/bugfix.ts
src/templates/refactor.ts
src/templates/feature.ts
src/templates/tests.ts
src/templates/security.ts
src/templates/explain.ts
src/templates/general.ts
src/templates/index.ts    ← exports all
```

---

## 11. File & Folder Structure

```
promptmaster-ai/
├── src/
│   ├── extension.ts              ← entry point, registers everything
│   ├── promptEngine.ts           ← local enhancement engine
│   ├── contextReader.ts          ← reads VS Code editor state
│   ├── tagManager.ts             ← code tag system
│   ├── smartMode.ts              ← AI provider communication
│   ├── apiSettings.ts            ← settings panel manager
│   ├── sidebarProvider.ts        ← webview provider for sidebar
│   ├── statusBar.ts              ← status bar item manager
│   ├── constants.ts              ← SMART_MODE_SYSTEM_PROMPT, keyword maps, etc.
│   └── templates/
│       ├── bugfix.ts
│       ├── refactor.ts
│       ├── feature.ts
│       ├── tests.ts
│       ├── security.ts
│       ├── explain.ts
│       ├── general.ts
│       └── index.ts
├── media/
│   ├── sidebar.html              ← main sidebar UI
│   ├── sidebar.css               ← sidebar styles
│   ├── sidebar.js                ← sidebar frontend logic
│   ├── settings.html             ← settings panel UI
│   ├── settings.css
│   ├── settings.js
│   └── icon.png                  ← extension icon
├── package.json
├── tsconfig.json
├── esbuild.js                    ← build script
├── .vscodeignore
├── .gitignore                    ← includes @promptmaster: pattern
├── CHANGELOG.md
└── README.md
```

---

## 12. Key Implementation Details

### Context Reading — Function Detection

The contextReader scans backward from the cursor line using language-specific regex to find the nearest function declaration:

```typescript
const FUNCTION_PATTERNS: Record<string, RegExp[]> = {
  javascript:  [/function\s+(\w+)\s*\(/, /const\s+(\w+)\s*=\s*(async\s*)?\(/, /(\w+)\s*\([^)]*\)\s*\{/],
  typescript:  [/function\s+(\w+)\s*\(/, /const\s+(\w+)\s*=\s*(async\s*)?\(/, /(\w+)\s*\([^)]*\)\s*:/],
  python:      [/def\s+(\w+)\s*\(/, /async\s+def\s+(\w+)\s*\(/],
  go:          [/func\s+(\w+)\s*\(/, /func\s+\(\w+\s+\*?\w+\)\s+(\w+)\s*\(/],
  rust:        [/fn\s+(\w+)\s*\(/],
  java:        [/(?:public|private|protected|static|\s)+\w+\s+(\w+)\s*\(/],
  csharp:      [/(?:public|private|protected|static|\s)+\w+\s+(\w+)\s*\(/],
}
```

### Template Structure

Each template function returns a structured string:

```typescript
// src/templates/bugfix.ts
export function bugfixTemplate(raw: string, ctx: PromptContext): string {
  return `[CONTEXT]
File: ${ctx.fileName} (${ctx.relativePath})
Language: ${ctx.languageId}
${ctx.functionName ? `Function: ${ctx.functionName}()` : ''}
${ctx.activeErrors.length > 0 ? `Active errors:\n${ctx.activeErrors.map(e => `  - ${e}`).join('\n')}` : 'No active errors detected'}

[TASK]
Fix ONLY the specific bug described: "${raw}"
${ctx.taggedCode ? `Work ONLY on the tagged code block shown in [CODE] section.` : `Work on the function at the cursor position.`}

${ctx.taggedCode ? `[CODE]\n${ctx.taggedCode}\n` : ''}
[SCOPE LOCK]
- Do NOT modify any code outside ${ctx.taggedCode ? `the tagged block (lines ${ctx.tagStartLine}–${ctx.tagEndLine})` : `the ${ctx.functionName ?? 'described'} function`}
- Do NOT rename any variables, parameters, or function names
- Do NOT change the function signature or return type
- Do NOT refactor or restructure logic that is not directly related to this bug
- Do NOT add any imports unless they are required for this specific fix
- Do NOT add comments unless explaining the fix itself

[OUTPUT]
Return ONLY the corrected code block.
Add a single inline comment on the changed line explaining the fix.
Do not return the full file.
Do not add any explanation outside the code block.`
}
```

### Smart Mode Request Formats

**Gemini:**
```typescript
const body = {
  contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userMessage }] }],
  generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
}
fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal
})
```

**OpenAI:**
```typescript
const body = {
  model, temperature: 0.2, max_tokens: 2048,
  messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }]
}
fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify(body), signal
})
```

**Anthropic:**
```typescript
const body = {
  model, max_tokens: 2048,
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }]
}
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify(body), signal
})
```

### Webview ↔ Extension Message Protocol

```typescript
// Webview → Extension
{ command: 'enhance';       rawPrompt: string; mode: Mode | 'auto' }
{ command: 'removeTag' }
{ command: 'copyPrompt';    text: string }
{ command: 'openSettings' }
{ command: 'ready' }

// Extension → Webview
{ command: 'enhanceResult'; prompt: string; mode: Mode; source: 'local' | 'smart' }
{ command: 'enhanceError';  message: string }
{ command: 'loading';       state: boolean }
{ command: 'tagUpdate';     hasTag: boolean; fileName?: string; lines?: string }
{ command: 'smartModeStatus'; enabled: boolean; provider: string }
```

---

## 13. Non-Functional Requirements

### Performance

- Local prompt enhancement: **< 50ms** always
- Context reading: **< 100ms** always
- Sidebar panel interactive on startup: **< 300ms**
- Smart Mode API call: show loading state **immediately**, timeout after **15 seconds**
- Extension activation: **< 500ms** (use `onStartupFinished` not `*`)

### Privacy

- When Smart Mode is OFF: **zero network requests**, zero data leaves the machine
- When Smart Mode is ON: only prompt text + tagged code sent to configured provider
- **No telemetry**, no analytics, no usage tracking, no error reporting to any external server
- **No account**, no login, no registration ever required

### Reliability

- Smart Mode API failure → silent fallback to local mode + non-blocking notification
- Tag markers survive file saves, renames, and VS Code restarts
- Files with no active errors: context injection skips error section gracefully
- Files with no function detected: context injection skips function section gracefully
- Extension never throws uncaught errors that affect VS Code stability

### Compatibility

- VS Code: **1.75.0 and above**
- OS: **Windows, macOS, Linux** — all three fully supported
- Conflicts: **none** — does not hook into Copilot, Cursor, Codeium, or any other extension
- Works **alongside** all AI extensions — it only produces prompts, does not intercept theirs

### Bundle Size

- Target: **< 500KB** final `.vsix` package
- Zero runtime npm dependencies
- Dev dependencies only: `typescript`, `@types/vscode`, `esbuild`

---

## 14. Development Milestones

### Week 1 — Scaffold & Foundation
- `yo code` project scaffold with TypeScript template
- `esbuild.js` build script configured
- `package.json` with all contributes (commands, menus, views, configuration) defined
- Sidebar webview renders in VS Code (static HTML for now)
- All commands registered in command palette (empty implementations)
- Extension activates without errors

### Week 2 — Local Engine & Context
- `contextReader.ts` complete — reads file, language, function, errors, selection
- `constants.ts` — keyword map for all 6 modes written
- All 7 template files written (`src/templates/`)
- `promptEngine.ts` — detect() and enhance() working
- Sidebar Tab 1 wired up — type prompt → click enhance → see output
- Copy button working

### Week 3 — Tag System
- `tagManager.ts` complete
- Right-click context menu item registered and working
- Tag injection (comment markers) working via workspace edit
- Blue gutter decoration rendering correctly
- Tag Mode tab (Tab 2) in sidebar wired up
- Tag-scoped prompts working end to end
- Remove Tag working
- Tag state survives VS Code restart

### Week 4 — Smart Mode Core
- `apiSettings.ts` and settings webview (Tab 3) complete
- `vscode.SecretStorage` save/read working
- Status bar item showing Local / Smart state
- `smartMode.ts` — Gemini provider implemented end to end
- Smart Mode toggle working
- Loading state in output panel during API call
- Fallback to local on error working

### Week 5 — All Providers
- OpenAI provider implemented
- Anthropic provider implemented
- Custom endpoint provider implemented
- Test Connection button working for all 4 providers
- Model name override working
- Provider switch working

### Week 6 — Polish & Edge Cases
- All error states handled gracefully (no API key, wrong key, network fail, timeout)
- Status bar updates correctly on all state changes
- Tag markers excluded from git (`.gitignore` suggestion on first tag)
- Output color-coding in sidebar (CONTEXT blue, TASK green, CODE orange, SCOPE red, OUTPUT white)
- Character count showing raw vs enhanced length
- Mode badge showing in output
- All command palette commands working

### Week 7 — Testing & README
- Manual testing on Windows, macOS, Linux
- Testing with zero config (fresh install)
- Testing Smart Mode with all 4 providers
- Testing tag system across JS, TS, Python, Go, Rust files
- README.md with feature explanation, setup guide, demo GIF, provider setup links
- CHANGELOG.md

### Week 8 — Marketplace Launch
- Final `.vsix` build and size check (target < 500KB)
- Marketplace listing: title, description, screenshots, categories, tags
- Demo GIF showing before/after prompt transformation
- Publish to VS Code Marketplace
- Launch post on Reddit (r/vscode, r/programming, r/webdev)
- Launch tweet with before/after screenshot

---

## 15. Post-Launch Roadmap

### v1.1 — Prompt History
Store the last 20 enhanced prompts locally in `globalState`. Developer can reuse any previous prompt with one click. History panel shows timestamp, mode used, and first line of the raw prompt.

### v1.2 — Custom Templates
Developer can define their own prompt templates for tasks they repeat frequently. Templates are stored as JSON in the workspace `.vscode/promptmaster-templates.json`. Team can share this file via git.

### v1.3 — Language Context Depth
Inject additional language-specific context: TypeScript config (`tsconfig.json` target/strict settings), ESLint rules active in the project, framework detection (React, Vue, Express, FastAPI etc.), package versions from `package.json`.

### v1.4 — Prompt Quality Score
Show a before/after clarity score in the output panel. Score is calculated locally based on specificity metrics: word count, context presence, scope lock presence, output instruction presence. No AI needed for this — pure rule-based scoring.

### v1.5 — Team Template Packs
Export and import team prompt template libraries as `.pmtemplate.json` files. Enables teams to standardize how they communicate with AI tools across the codebase.

---

## Appendix — Constants File Reference

The following constants must be defined in `src/constants.ts`:

```typescript
export const SMART_MODE_SYSTEM_PROMPT = `You are a senior prompt engineer...` // full prompt from section 6.3

export const KEYWORD_MAP: Record<Mode, string[]> = {
  bugfix:   ['fix', 'bug', 'error', 'broken', 'crash', 'null', 'undefined', 'issue', 'not working', 'failing', 'exception'],
  refactor: ['clean', 'refactor', 'improve', 'simplify', 'readable', 'restructure', 'reorganize', 'better'],
  feature:  ['add', 'create', 'implement', 'build', 'new', 'include', 'extend', 'append', 'feature'],
  tests:    ['test', 'tests', 'unit test', 'spec', 'coverage', 'jest', 'mocha', 'vitest', 'cypress', 'playwright'],
  security: ['secure', 'security', 'vulnerability', 'injection', 'xss', 'auth', 'sanitize', 'validate', 'exploit'],
  explain:  ['explain', 'what does', 'how does', 'describe', 'understand', 'walk me through', 'what is this'],
  general:  [],
}

export const DEFAULT_MODELS: Record<string, string> = {
  gemini:   'gemini-2.0-flash',
  openai:   'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  custom:   '',
}

export const TAG_START_MARKER = '// @promptmaster:start'
export const TAG_END_MARKER   = '// @promptmaster:end'
export const TAG_GITIGNORE_PATTERN = '@promptmaster:'

export const SMART_MODE_TIMEOUT_MS = 15000
export const LOCAL_MODE_MAX_CONTEXT_LENGTH = 500  // chars, for error/warning truncation
```

---

*Document Version: 1.0 | Product: PromptMaster AI — Your Senior Prompt Engineer | Author: Avishek*