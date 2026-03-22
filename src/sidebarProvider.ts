import * as vscode from 'vscode';
import { ApiService } from './apiService';
import { enhancePrompt } from './localEnhancer';
import { DEFAULT_MODELS, DEFAULT_SYSTEM_PROMPT, StorageService } from './storageService';
import type {
  AttachedFile,
  ChatMessage,
  ExtensionSettings,
  SavedPrompt,
  SettingsPayload,
  SmartChatRequest,
  ViewState,
} from './types';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'promptmasterSidebar';
  private view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly storage: StorageService,
    private readonly apiService: ApiService,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: { command?: string; payload?: any }): Promise<void> {
    switch (message.command) {
      case 'loadSettings':
        await this.postSettingsLoaded();
        return;
      case 'localEnhance':
        await this.handleLocalEnhance(message.payload);
        return;
      case 'saveSettings':
        await this.handleSaveSettings(message.payload);
        return;
      case 'testConnection':
        await this.handleTestConnection();
        return;
      case 'clearApiKey':
        await this.handleClearApiKey();
        return;
      case 'smartChat':
        await this.handleSmartChat(message.payload as SmartChatRequest);
        return;
      case 'savePrompt':
        await this.handleSavePrompt(message.payload);
        return;
      case 'deletePrompt':
        await this.handleDeletePrompt(message.payload?.id);
        return;
      case 'clearSaved':
        await this.storage.clearSavedPrompts();
        await this.postSavedPrompts();
        this.toast('success', 'Saved prompts cleared');
        return;
      case 'clearChatHistory':
        await this.storage.clearChatHistory();
        this.postMessage({ command: 'chatHistoryCleared', payload: {} });
        this.toast('success', 'Chat history cleared');
        return;
      case 'applyCodeToFile':
        await this.handleApplyCodeToFile(message.payload);
        return;
      case 'getActiveFileContent':
        await this.handleGetActiveFileContent();
        return;
      case 'persistState':
        await this.storage.saveViewState(message.payload as ViewState);
        return;
      case 'openExternal':
        await this.handleOpenExternal(message.payload?.url);
        return;
      default:
        return;
    }
  }

  private async handleLocalEnhance(payload: { prompt?: string; variation?: number }): Promise<void> {
    const prompt = payload?.prompt?.trim() ?? '';
    if (!prompt) {
      this.postMessage({ command: 'error', payload: { message: 'Please enter a prompt to enhance.' } });
      return;
    }

    const enhanced = enhancePrompt(prompt, { variation: payload?.variation });
    const viewState = await this.storage.getViewState();
    await this.storage.saveViewState({
      ...viewState,
      localDraft: prompt,
      localResult: enhanced,
      localVariation: payload?.variation ?? 0,
    });

    this.postMessage({
      command: 'localResult',
      payload: {
        text: enhanced,
        variation: payload?.variation ?? 0,
      },
    });
  }

  private async handleSaveSettings(payload: Partial<ExtensionSettings> & { apiKey?: string }): Promise<void> {
    const current = await this.storage.getSettings();
    const next: ExtensionSettings = {
      ...current,
      ...payload,
      api: { ...current.api, ...(payload.api ?? {}) },
      behavior: { ...current.behavior, ...(payload.behavior ?? {}) },
      chat: { ...current.chat, ...(payload.chat ?? {}) },
      connectionStates: { ...current.connectionStates, ...(payload.connectionStates ?? {}) },
    };

    if (payload.api?.provider && !payload.api.model) {
      next.api.model = DEFAULT_MODELS[payload.api.provider];
    }

    await this.storage.saveSettings(next);
    if (typeof payload.apiKey === 'string' && payload.apiKey.trim()) {
      await this.storage.setApiKey(next.api.provider, payload.apiKey.trim());
    }

    const viewState = await this.storage.getViewState();
    await this.storage.saveViewState({
      ...viewState,
      smartModeEnabled: next.smartModeEnabled,
    });

    await this.postSettingsLoaded();
    this.toast('success', 'Settings saved');
  }

  private async handleTestConnection(): Promise<void> {
    const settings = await this.storage.getSettings();
    const apiKey = await this.storage.getApiKey(settings.api.provider);
    const result = await this.apiService.testConnection(settings, apiKey);

    await this.storage.updateConnectionState(settings.api.provider, {
      status: result.success ? 'verified' : apiKey || settings.api.provider === 'ollama' ? 'saved' : 'not_configured',
      lastCheckedAt: new Date().toISOString(),
      lastError: result.success ? undefined : result.message,
      model: result.model,
      latencyMs: result.latencyMs,
    });

    this.postMessage({ command: 'testResult', payload: result });
    this.toast(result.success ? 'success' : 'error', result.success ? 'Connected!' : 'Failed - invalid key');
    await this.postSettingsLoaded();
  }

  private async handleClearApiKey(): Promise<void> {
    const settings = await this.storage.getSettings();
    await this.storage.clearApiKey(settings.api.provider);
    await this.postSettingsLoaded();
    this.postMessage({ command: 'testResult', payload: { success: false, message: 'Key cleared.' } });
    this.toast('success', 'Key cleared');
  }

  private async handleSmartChat(payload: SmartChatRequest): Promise<void> {
    const settings = await this.storage.getSettings();
    const provider = settings.api.provider;
    const hasKey = provider === 'ollama' || (await this.storage.hasApiKey(provider));

    if (!hasKey) {
      await this.storage.savePartialSettings({ smartModeEnabled: false });
      this.postMessage({
        command: 'error',
        payload: {
          message: 'No API key saved. Go to Settings.',
          smartModeDisabled: true,
        },
      });
      await this.postSettingsLoaded();
      return;
    }

    const apiKey = await this.storage.getApiKey(provider);
    const userMessage: ChatMessage = {
      id: this.id(),
      role: 'user',
      content: payload.userMessage,
      timestamp: new Date().toISOString(),
      provider,
      attachedFile: payload.attachedFile,
    };

    const baseHistory = [...payload.history.filter((item) => item.id !== 'streaming'), userMessage];
    await this.storage.saveChatHistory(baseHistory);

    const streamId = this.id();
    let responseText = '';
    this.postMessage({ command: 'streamChunk', payload: { messageId: streamId, text: '', reset: true, provider } });

    try {
      await this.apiService.streamChat(
        {
          systemPrompt: settings.behavior.systemPromptOverride.trim() || DEFAULT_SYSTEM_PROMPT,
          messages: this.buildConversationMessages(payload, settings),
          settings,
          apiKey,
        },
        {
          onChunk: (chunk) => {
            responseText += chunk;
            this.postMessage({ command: 'streamChunk', payload: { messageId: streamId, text: chunk, provider } });
          },
        },
      );

      const assistantMessage: ChatMessage = {
        id: streamId,
        role: 'assistant',
        content: responseText.trim(),
        timestamp: new Date().toISOString(),
        provider,
        tokenUsage: this.estimateTokens(responseText),
      };

      await this.storage.saveChatHistory([...baseHistory, assistantMessage]);
      this.postMessage({ command: 'streamEnd', payload: { message: assistantMessage } });
      this.toast('success', 'Response ready');
    } catch (error) {
      this.postMessage({
        command: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Smart Mode failed.',
        },
      });
      this.postMessage({ command: 'streamEnd', payload: { message: undefined } });
    }
  }

  private async handleSavePrompt(payload: { content?: string; provider?: SavedPrompt['provider']; id?: string }): Promise<void> {
    const content = payload?.content?.trim() ?? '';
    if (!content) {
      return;
    }

    const prompts = await this.storage.upsertSavedPrompt({
      id: payload?.id ?? this.id(),
      content,
      provider: payload?.provider ?? 'local',
      timestamp: new Date().toISOString(),
      preview: content.slice(0, 80),
    });
    this.postMessage({ command: 'savedPromptsUpdated', payload: { prompts } });
    this.toast('success', 'Prompt saved');
  }

  private async handleDeletePrompt(id?: string): Promise<void> {
    if (!id) {
      return;
    }
    const prompts = await this.storage.deleteSavedPrompt(id);
    this.postMessage({ command: 'savedPromptsUpdated', payload: { prompts } });
    this.toast('success', 'Saved prompt deleted');
  }

  private async handleGetActiveFileContent(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.postMessage({ command: 'error', payload: { message: 'No active editor found.' } });
      return;
    }

    const document = editor.document;
    const attachedFile: AttachedFile = {
      fileName: document.fileName.split(/[\\/]/).pop() ?? 'untitled',
      filePath: document.uri.fsPath,
      language: document.languageId,
      content: document.getText(),
    };

    const viewState = await this.storage.getViewState();
    await this.storage.saveViewState({
      ...viewState,
      attachedFile,
    });

    this.postMessage({ command: 'activeFileContent', payload: attachedFile });
  }

  private async handleApplyCodeToFile(payload: { code?: string; language?: string }): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.postMessage({ command: 'error', payload: { message: 'Open a file before applying code.' } });
      return;
    }

    const document = editor.document;
    const previewUri = vscode.Uri.from({
      scheme: 'untitled',
      path: `${document.uri.path}.promptmaster-preview.${payload?.language || document.languageId}`,
    });
    const previewDocument = await vscode.workspace.openTextDocument(previewUri);
    const previewEdit = new vscode.WorkspaceEdit();
    previewEdit.insert(previewUri, new vscode.Position(0, 0), payload?.code ?? '');
    await vscode.workspace.applyEdit(previewEdit);

    await vscode.commands.executeCommand('vscode.diff', document.uri, previewUri, 'PromptMaster AI Suggested Changes');

    const decision = await vscode.window.showInformationMessage(
      'Review the diff, then choose whether to apply the suggested code to the active file.',
      'Apply Changes',
      'Cancel',
    );

    if (decision !== 'Apply Changes') {
      return;
    }

    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, fullRange, payload?.code ?? '');
    await vscode.workspace.applyEdit(edit);
    await document.save();

    this.postMessage({ command: 'codeApplied', payload: { filePath: document.uri.fsPath } });
    this.toast('success', 'Code applied');
  }

  private async handleOpenExternal(url?: string): Promise<void> {
    if (url) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  }

  private buildConversationMessages(
    payload: SmartChatRequest,
    settings: ExtensionSettings,
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const history = payload.history.slice(-12).map((message) => ({
      role: message.role,
      content: message.content,
    })) as Array<{ role: 'user' | 'assistant'; content: string }>;

    const extraContext: string[] = [
      `Persona: ${settings.behavior.persona}`,
      `Enhancement style: ${settings.behavior.enhancementStyle}`,
    ];

    if (settings.behavior.includeWorkspaceInfo) {
      const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name ?? 'No workspace';
      const activeLanguage = vscode.window.activeTextEditor?.document.languageId ?? 'unknown';
      extraContext.push(`Workspace: ${workspaceName}`);
      extraContext.push(`Active language: ${activeLanguage}`);
    }

    if (payload.attachedFile) {
      extraContext.push(
        `Attached file: ${payload.attachedFile.fileName} (${payload.attachedFile.language})\n${payload.attachedFile.content}`,
      );
    } else if (settings.behavior.autoAttachActiveFile && vscode.window.activeTextEditor) {
      const document = vscode.window.activeTextEditor.document;
      extraContext.push(
        `Active file context: ${document.fileName.split(/[\\/]/).pop()} (${document.languageId})\n${document.getText()}`,
      );
    }

    return [
      { role: 'system', content: settings.behavior.systemPromptOverride.trim() || DEFAULT_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: `${payload.userMessage}\n\nAdditional context:\n${extraContext.join('\n')}` },
    ];
  }

  private async postSettingsLoaded(): Promise<void> {
    const payload: SettingsPayload = await this.storage.buildSettingsPayload(this.context.extension.packageJSON.version as string);
    this.postMessage({ command: 'settingsLoaded', payload });
  }

  private async postSavedPrompts(): Promise<void> {
    const prompts = await this.storage.getSavedPrompts();
    this.postMessage({ command: 'savedPromptsUpdated', payload: { prompts } });
  }

  private toast(type: 'success' | 'error' | 'info', message: string): void {
    this.postMessage({ command: 'toast', payload: { type, message } });
  }

  private postMessage(message: unknown): void {
    void this.view?.webview.postMessage(message);
  }

  private estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  private id(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; connect-src https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com http://localhost:11434;">
  <link rel="stylesheet" href="${styleUri}">
  <title>PromptMaster AI</title>
</head>
<body>
  <div id="app"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
