import * as vscode from 'vscode';
import type {
  ChatMessage,
  ConnectionState,
  ExtensionSettings,
  ProviderId,
  SavedPrompt,
  SettingsPayload,
  ViewState,
} from './types';

const SETTINGS_KEY = 'promptmaster.settings';
const CHAT_HISTORY_KEY = 'promptmaster.chatHistory';
const SAVED_PROMPTS_KEY = 'promptmaster.savedPrompts';
const VIEW_STATE_KEY = 'promptmaster.viewState';

export const DEFAULT_MODELS: Record<ProviderId, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  ollama: 'llama3.2',
  custom: 'gpt-4o',
};

export const DEFAULT_BASE_URLS: Record<ProviderId, string> = {
  gemini: '',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  ollama: 'http://localhost:11434',
  custom: '',
};

const DEFAULT_CONNECTION_STATES: Record<ProviderId, ConnectionState> = {
  gemini: { status: 'not_configured' },
  openai: { status: 'not_configured' },
  anthropic: { status: 'not_configured' },
  ollama: { status: 'not_configured' },
  custom: { status: 'not_configured' },
};

export const DEFAULT_SYSTEM_PROMPT = `You are PromptMaster, a senior prompt engineer focused on rewriting raw developer requests into precise prompts for another AI assistant.

Your primary job:
- Transform rough user input into a high-quality prompt.
- Use any provided file context, code, workspace details, and errors only as supporting context.
- Preserve the user's real intent and sharpen it without changing scope.

Rules:
1. Return the enhanced prompt, not an answer to the task itself.
2. Do not write code unless the user explicitly asks for code generation, refactoring, debugging, review, or implementation help.
3. Do not add extra suggestions, best practices, or architecture advice unless the user asked for them.
4. If an active file is provided, use it to make the prompt specific and grounded.
5. Add strict scope boundaries so the downstream AI does not change unrelated files, logic, or behavior.
6. Make the expected output format explicit.
7. Keep the final prompt clear, concise, and professional.

Output rules:
- Return only the improved prompt text.
- Do not wrap it in markdown fences.
- Do not include commentary about what you improved.`;

export class StorageService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async getSettings(): Promise<ExtensionSettings> {
    const stored = this.context.globalState.get<Partial<ExtensionSettings>>(SETTINGS_KEY);
    const provider = stored?.api?.provider ?? 'gemini';

    return {
      api: {
        provider,
        model: stored?.api?.model ?? DEFAULT_MODELS[provider],
        baseUrl: stored?.api?.baseUrl ?? DEFAULT_BASE_URLS[provider],
      },
      smartModeEnabled: stored?.smartModeEnabled ?? false,
      behavior: {
        enhancementStyle: stored?.behavior?.enhancementStyle ?? 'balanced',
        persona: stored?.behavior?.persona ?? 'Senior Prompt Engineer',
        autoAttachActiveFile: stored?.behavior?.autoAttachActiveFile ?? true,
        includeWorkspaceInfo: stored?.behavior?.includeWorkspaceInfo ?? false,
        maxResponseTokens: stored?.behavior?.maxResponseTokens ?? 2048,
        temperature: stored?.behavior?.temperature ?? 0.7,
        systemPromptOverride: stored?.behavior?.systemPromptOverride ?? '',
      },
      chat: {
        enterKeyBehavior: stored?.chat?.enterKeyBehavior ?? 'send',
        showTimestamps: stored?.chat?.showTimestamps ?? true,
        showTokenUsage: stored?.chat?.showTokenUsage ?? false,
        autoScroll: stored?.chat?.autoScroll ?? true,
      },
      connectionStates: {
        ...DEFAULT_CONNECTION_STATES,
        ...(stored?.connectionStates ?? {}),
      },
    };
  }

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    await this.context.globalState.update(SETTINGS_KEY, settings);
  }

  async savePartialSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.getSettings();
    const next: ExtensionSettings = {
      ...current,
      ...patch,
      api: { ...current.api, ...(patch.api ?? {}) },
      behavior: { ...current.behavior, ...(patch.behavior ?? {}) },
      chat: { ...current.chat, ...(patch.chat ?? {}) },
      connectionStates: { ...current.connectionStates, ...(patch.connectionStates ?? {}) },
    };
    await this.saveSettings(next);
    return next;
  }

  async getApiKey(provider: ProviderId): Promise<string | undefined> {
    return this.context.secrets.get(this.secretKey(provider));
  }

  async hasApiKey(provider: ProviderId): Promise<boolean> {
    return Boolean(await this.getApiKey(provider));
  }

  async setApiKey(provider: ProviderId, apiKey: string): Promise<void> {
    await this.context.secrets.store(this.secretKey(provider), apiKey);
    await this.updateConnectionState(provider, { status: 'saved', lastError: undefined });
  }

  async clearApiKey(provider: ProviderId): Promise<void> {
    await this.context.secrets.delete(this.secretKey(provider));
    await this.updateConnectionState(provider, {
      status: 'not_configured',
      lastError: undefined,
      model: undefined,
      latencyMs: undefined,
    });
  }

  async getProviderSecretsState(): Promise<Record<ProviderId, boolean>> {
    return {
      gemini: await this.hasApiKey('gemini'),
      openai: await this.hasApiKey('openai'),
      anthropic: await this.hasApiKey('anthropic'),
      ollama: await this.hasApiKey('ollama'),
      custom: await this.hasApiKey('custom'),
    };
  }

  async updateConnectionState(provider: ProviderId, patch: Partial<ConnectionState>): Promise<void> {
    const settings = await this.getSettings();
    settings.connectionStates[provider] = {
      ...settings.connectionStates[provider],
      ...patch,
    };
    await this.saveSettings(settings);
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    return this.context.globalState.get<ChatMessage[]>(CHAT_HISTORY_KEY, []);
  }

  async saveChatHistory(history: ChatMessage[]): Promise<void> {
    await this.context.globalState.update(CHAT_HISTORY_KEY, history.slice(-50));
  }

  async clearChatHistory(): Promise<void> {
    await this.context.globalState.update(CHAT_HISTORY_KEY, []);
  }

  async getSavedPrompts(): Promise<SavedPrompt[]> {
    return this.context.globalState.get<SavedPrompt[]>(SAVED_PROMPTS_KEY, []);
  }

  async saveSavedPrompts(prompts: SavedPrompt[]): Promise<void> {
    await this.context.globalState.update(SAVED_PROMPTS_KEY, prompts);
  }

  async upsertSavedPrompt(prompt: SavedPrompt): Promise<SavedPrompt[]> {
    const prompts = await this.getSavedPrompts();
    const next = [prompt, ...prompts.filter((item) => item.id !== prompt.id)].slice(0, 100);
    await this.saveSavedPrompts(next);
    return next;
  }

  async deleteSavedPrompt(id: string): Promise<SavedPrompt[]> {
    const prompts = await this.getSavedPrompts();
    const next = prompts.filter((item) => item.id !== id);
    await this.saveSavedPrompts(next);
    return next;
  }

  async clearSavedPrompts(): Promise<void> {
    await this.context.globalState.update(SAVED_PROMPTS_KEY, []);
  }

  async getViewState(): Promise<ViewState> {
    return this.context.globalState.get<ViewState>(VIEW_STATE_KEY, {
      activeTab: 'chat',
      smartModeEnabled: false,
      localDraft: '',
      smartDraft: '',
      localResult: '',
      localVariation: 0,
    });
  }

  async saveViewState(viewState: ViewState): Promise<void> {
    await this.context.globalState.update(VIEW_STATE_KEY, viewState);
  }

  async buildSettingsPayload(version: string): Promise<SettingsPayload> {
    const [settings, chatHistory, savedPrompts, viewState, providerSecrets] = await Promise.all([
      this.getSettings(),
      this.getChatHistory(),
      this.getSavedPrompts(),
      this.getViewState(),
      this.getProviderSecretsState(),
    ]);

    return {
      settings,
      chatHistory,
      savedPrompts,
      viewState,
      providerSecrets,
      version,
    };
  }

  private secretKey(provider: ProviderId): string {
    return `promptmaster.apiKey.${provider}`;
  }
}
