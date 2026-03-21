import * as vscode from 'vscode';
import type { TagManager } from './tagManager';
import type { ContextReader } from './contextReader';
import type { PromptEngine, Mode } from './promptEngine';
import type { SmartMode } from './smartMode';
import type { StatusBarManager } from './statusBar';
import { DEFAULT_MODELS } from './constants';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private lastEnhancedPrompt: string = '';

  constructor(
    private context: vscode.ExtensionContext,
    private tagManager: TagManager,
    private contextReader: ContextReader,
    private promptEngine: PromptEngine,
    private smartMode: SmartMode,
    private statusBar: StatusBarManager
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      await this.handleMessage(msg);
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.sendTagUpdate();
        this.sendSmartModeStatus();
      }
    });
  }

  private async handleMessage(msg: any): Promise<void> {
    switch (msg.command) {
      case 'enhance':
        await this.handleEnhance(msg.rawPrompt, msg.mode);
        break;
      case 'enhanceTag':
        await this.handleEnhanceTag(msg.rawPrompt, msg.mode);
        break;
      case 'removeTag':
        await this.tagManager.removeTag();
        this.sendTagUpdate();
        this.statusBar.update();
        break;
      case 'copyPrompt':
        await vscode.env.clipboard.writeText(msg.text);
        vscode.window.showInformationMessage('PromptMaster: Prompt copied to clipboard!');
        break;
      case 'ready':
        this.sendTagUpdate();
        this.sendSmartModeStatus();
        await this.sendCurrentSettings();
        break;
      case 'saveApiKey':
        await this.smartMode.saveSettings(
          msg.provider,
          msg.model || DEFAULT_MODELS[msg.provider] || '',
          msg.endpoint
        );
        await this.smartMode.saveApiKey(msg.provider, msg.key);
        await this.smartMode.setEnabled(true);
        this.statusBar.update();
        this.sendSmartModeStatus();
        await this.sendCurrentSettings();
        this.postMessage({ command: 'apiKeySaved', provider: msg.provider });
        break;
      case 'clearApiKey':
        await this.smartMode.clearApiKey(msg.provider);
        await this.sendCurrentSettings();
        this.postMessage({ command: 'apiKeyCleared' });
        break;
      case 'saveSettings':
        await this.smartMode.saveSettings(msg.provider, msg.model, msg.endpoint);
        this.statusBar.update();
        this.sendSmartModeStatus();
        await this.sendCurrentSettings();
        break;
      case 'testConnection': {
        const result = await this.smartMode.testConnection();
        this.postMessage({ command: 'testResult', success: result.success, message: result.message });
        break;
      }
      case 'toggleSmartMode':
        await this.smartMode.setEnabled(!!msg.enabled);
        this.statusBar.update();
        this.sendSmartModeStatus();
        await this.sendCurrentSettings();
        break;
    }
  }

  private async handleEnhance(rawPrompt: string, requestedMode: Mode | 'auto'): Promise<void> {
    if (!rawPrompt.trim()) {
      this.postMessage({ command: 'enhanceError', message: 'Please type a prompt first.' });
      return;
    }

    this.postMessage({ command: 'loading', state: true });

    try {
      const context = await this.contextReader.read();
      const mode = requestedMode === 'auto' ? this.promptEngine.detect(rawPrompt) : requestedMode;
      let result: string;
      let source: 'local' | 'smart' = 'local';

      if (this.smartMode.isEnabled) {
        try {
          result = await this.smartMode.enhance(rawPrompt, context);
          source = 'smart';
        } catch (e: any) {
          vscode.window.showWarningMessage(`PromptMaster: Smart Mode failed (${e.message}), using local engine.`);
          result = this.promptEngine.enhance(rawPrompt, context, mode);
        }
      } else {
        result = this.promptEngine.enhance(rawPrompt, context, mode);
      }

      this.lastEnhancedPrompt = result;
      this.postMessage({
        command: 'enhanceResult',
        prompt: result,
        mode,
        source,
        rawLength: rawPrompt.length,
        enhancedLength: result.length,
      });
    } catch (e: any) {
      this.postMessage({ command: 'enhanceError', message: e.message || 'Enhancement failed.' });
    } finally {
      this.postMessage({ command: 'loading', state: false });
    }
  }

  private async handleEnhanceTag(rawPrompt: string, requestedMode: Mode | 'auto'): Promise<void> {
    if (!rawPrompt.trim()) {
      this.postMessage({ command: 'enhanceError', message: 'Please type a prompt for the tagged code.' });
      return;
    }
    await this.handleEnhance(rawPrompt, requestedMode);
  }

  openSettings(): void {
    if (this._view) {
      this._view.show(true);
      this.postMessage({ command: 'switchTab', tab: 'smart' });
    }
  }

  async enhanceFromCommand(): Promise<void> {
    if (!this._view) {
      return;
    }
    this._view.show(true);
    this.postMessage({ command: 'triggerEnhance' });
  }

  async enhanceSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showWarningMessage('PromptMaster: Select text to use as a prompt.');
      return;
    }
    const selectedText = editor.document.getText(editor.selection);
    if (this._view) {
      this._view.show(true);
      this.postMessage({ command: 'setPromptAndEnhance', prompt: selectedText });
    }
  }

  copyLastPrompt(): void {
    if (this.lastEnhancedPrompt) {
      vscode.env.clipboard.writeText(this.lastEnhancedPrompt);
      vscode.window.showInformationMessage('PromptMaster: Last prompt copied!');
    } else {
      vscode.window.showWarningMessage('PromptMaster: No enhanced prompt to copy.');
    }
  }

  private sendTagUpdate(): void {
    const hasTag = this.tagManager.hasActiveTag();
    const tagInfo = this.tagManager.getTagInfo();
    const taggedCode = this.tagManager.getTaggedCode();
    this.postMessage({
      command: 'tagUpdate',
      hasTag,
      fileName: tagInfo?.fileName,
      lines: tagInfo?.lines,
      taggedCode,
    });
  }

  private sendSmartModeStatus(): void {
    const status = this.smartMode.getStatus();
    this.postMessage({
      command: 'smartModeStatus',
      enabled: status.enabled,
      provider: status.provider,
    });
  }

  private async sendCurrentSettings(): Promise<void> {
    const provider = this.smartMode.getStatus().provider;
    const hasKey = await this.smartMode.hasApiKey(provider);
    this.postMessage({
      command: 'settingsLoaded',
      settings: {
        smartModeEnabled: this.smartMode.isEnabled,
        provider,
        model: this.context.globalState.get<string>('promptmaster.model', DEFAULT_MODELS[provider] || ''),
        customEndpoint: this.context.globalState.get<string>('promptmaster.customEndpoint', ''),
        hasApiKey: hasKey,
      },
    });
  }

  private postMessage(msg: any): void {
    this._view?.webview.postMessage(msg);
  }

  private getHtml(webview: vscode.Webview): string {
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'sidebar.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'sidebar.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${cssUri}">
  <title>PromptMaster AI</title>
</head>
<body>
  <div class="tab-bar">
    <button class="tab-btn active" data-tab="enhance">Enhance</button>
    <button class="tab-btn" data-tab="smart">Smart Mode</button>
  </div>

  <div class="tab-content active" id="tab-enhance">
    <div class="section">
      <label class="label">Mode</label>
      <select id="mode-select" class="select">
        <option value="auto">Auto-detect</option>
        <option value="bugfix">Bug Fix</option>
        <option value="refactor">Refactor</option>
        <option value="feature">Add Feature</option>
        <option value="tests">Write Tests</option>
        <option value="security">Security</option>
        <option value="explain">Explain</option>
        <option value="general">General</option>
      </select>
    </div>

    <div class="section">
      <label class="label">Your Prompt</label>
      <textarea id="raw-prompt" class="textarea" placeholder="Describe what you want AI to do..." rows="4"></textarea>
    </div>

    <div id="tag-context-section" class="section hidden">
      <div class="tag-info">
        <span class="tag-icon">TAG</span>
        <div>
          <div class="tag-filename" id="tag-filename"></div>
          <div class="tag-lines" id="tag-lines"></div>
        </div>
      </div>

      <div class="section">
        <label class="label">Tagged Code Context</label>
        <pre id="tagged-code-preview" class="code-preview"></pre>
      </div>

      <button id="remove-tag-btn" class="btn btn-danger">Remove Tag</button>
    </div>

    <button id="enhance-btn" class="btn btn-primary">
      <span class="btn-text">Enhance Prompt</span>
      <span class="btn-spinner hidden">Enhancing...</span>
    </button>

    <div id="output-section" class="output-section hidden">
      <div class="output-header">
        <span class="output-title">Enhanced Prompt</span>
        <div class="output-badges">
          <span id="mode-badge" class="badge badge-mode"></span>
          <span id="source-badge" class="badge badge-source"></span>
        </div>
      </div>
      <div id="enhanced-output" class="enhanced-output"></div>
      <div class="output-footer">
        <span id="char-count" class="char-count"></span>
        <button id="copy-btn" class="btn btn-copy">Copy Prompt</button>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-smart">
    <div class="section">
      <div class="toggle-row">
        <label class="label">Smart Mode</label>
        <label class="toggle">
          <input type="checkbox" id="smart-mode-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <p class="hint">When enabled, PromptMaster uses your saved API key to enhance prompts with an AI provider.</p>
    </div>

    <div class="section">
      <label class="label">AI Provider</label>
      <select id="provider-select" class="select">
        <option value="gemini">Google Gemini</option>
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic Claude</option>
        <option value="custom">Custom (OpenAI-compatible)</option>
      </select>
    </div>

    <div class="section">
      <label class="label">API Key</label>
      <div class="input-group">
        <input type="password" id="api-key-input" class="input" placeholder="Enter your API key">
        <button id="toggle-key-visibility" class="btn btn-icon" title="Show or hide key">Show</button>
      </div>
      <button id="save-key-btn" class="btn btn-small">Save Key</button>
      <span id="key-status" class="key-status"></span>
    </div>

    <div class="section">
      <label class="label">Model Name</label>
      <input type="text" id="model-input" class="input" placeholder="e.g. gemini-2.0-flash">
    </div>

    <div class="section hidden" id="custom-endpoint-section">
      <label class="label">Custom Endpoint URL</label>
      <input type="text" id="endpoint-input" class="input" placeholder="https://your-api.com/v1/chat/completions">
    </div>

    <div class="settings-actions">
      <button id="save-settings-btn" class="btn btn-primary">Save Settings</button>
      <button id="test-connection-btn" class="btn btn-secondary">Test Connection</button>
      <button id="clear-key-btn" class="btn btn-danger">Clear API Key</button>
    </div>

    <div id="test-result" class="test-result hidden"></div>

    <div class="section" style="margin-top: 24px;">
      <p class="hint"><strong>API key links:</strong></p>
      <ul class="links-list">
        <li><a href="https://aistudio.google.com/app/apikey" class="link">Google Gemini API Key</a></li>
        <li><a href="https://platform.openai.com/api-keys" class="link">OpenAI API Key</a></li>
        <li><a href="https://console.anthropic.com/settings/keys" class="link">Anthropic API Key</a></li>
      </ul>
    </div>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
