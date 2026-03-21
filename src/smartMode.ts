import * as vscode from 'vscode';
import type { PromptContext } from './promptEngine';
import { SMART_MODE_SYSTEM_PROMPT, DEFAULT_MODELS, SMART_MODE_TIMEOUT_MS } from './constants';

export class SmartMode {
  private _isEnabled = false;

  constructor(private context: vscode.ExtensionContext) {
    this._isEnabled = context.globalState.get('promptmaster.smartModeEnabled', false);
  }

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  getCurrentProvider(): string {
    return this.context.globalState.get<string>('promptmaster.provider', 'gemini');
  }

  getModelForProvider(provider: string): string {
    const legacyModel = this.context.globalState.get<string>('promptmaster.model', '');
    return this.context.globalState.get<string>(
      `promptmaster.model.${provider}`,
      legacyModel || DEFAULT_MODELS[provider] || ''
    );
  }

  getCustomEndpointForProvider(provider: string): string {
    const legacyEndpoint = this.context.globalState.get<string>('promptmaster.customEndpoint', '');
    return this.context.globalState.get<string>(
      `promptmaster.customEndpoint.${provider}`,
      legacyEndpoint
    );
  }

  async enhance(rawPrompt: string, vsContext: PromptContext): Promise<string> {
    const provider = this.getCurrentProvider();
    const apiKey = await this.context.secrets.get(`promptmaster.apikey.${provider}`);
    const model = this.getModelForProvider(provider);

    if (!apiKey) {
      throw new Error('No API key configured for ' + provider);
    }

    const userMessage = this.buildUserMessage(rawPrompt, vsContext);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SMART_MODE_TIMEOUT_MS);

    try {
      const response = await this.callProvider(
        provider, apiKey, model,
        SMART_MODE_SYSTEM_PROMPT, userMessage,
        controller.signal
      );
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUserMessage(rawPrompt: string, ctx: PromptContext): string {
    const parts: string[] = [
      'RAW PROMPT FROM DEVELOPER:',
      rawPrompt,
      '',
      'VS CODE CONTEXT:',
      `- File: ${ctx.fileName} (${ctx.relativePath})`,
      `- Language: ${ctx.languageId}`,
      `- Function at cursor: ${ctx.functionName || 'none'}`,
      `- Active errors: ${ctx.activeErrors.length > 0 ? ctx.activeErrors.join('; ') : 'none'}`,
      `- Active warnings: ${ctx.activeWarnings.length > 0 ? ctx.activeWarnings.join('; ') : 'none'}`,
      `- Tagged code block: ${ctx.taggedCode || 'none'}`,
      '',
      'Transform this into an engineering-grade prompt following your rules.',
    ];
    return parts.join('\n');
  }

  private async callProvider(
    provider: string, apiKey: string, model: string,
    system: string, user: string, signal: AbortSignal
  ): Promise<string> {
    switch (provider) {
      case 'gemini': return this.callGemini(apiKey, model, system, user, signal);
      case 'openai': return this.callOpenAI(apiKey, model, system, user, signal);
      case 'anthropic': return this.callAnthropic(apiKey, model, system, user, signal);
      case 'custom': return this.callCustom(apiKey, model, system, user, signal);
      default: throw new Error('Unknown provider: ' + provider);
    }
  }

  private async callGemini(apiKey: string, model: string, system: string, user: string, signal: AbortSignal): Promise<string> {
    const body = {
      contents: [{ role: 'user', parts: [{ text: system + '\n\n' + user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }
    const data = await res.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callOpenAI(apiKey: string, model: string, system: string, user: string, signal: AbortSignal): Promise<string> {
    const body = {
      model,
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }
    const data = await res.json() as any;
    return data?.choices?.[0]?.message?.content || '';
  }

  private async callAnthropic(apiKey: string, model: string, system: string, user: string, signal: AbortSignal): Promise<string> {
    const body = {
      model,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errText}`);
    }
    const data = await res.json() as any;
    return data?.content?.[0]?.text || '';
  }

  private async callCustom(apiKey: string, model: string, system: string, user: string, signal: AbortSignal): Promise<string> {
    const endpoint = this.getCustomEndpointForProvider('custom');
    if (!endpoint) {
      throw new Error('Custom endpoint URL is not configured');
    }

    // OpenAI-compatible format
    const body = {
      model,
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Custom API error (${res.status}): ${errText}`);
    }
    const data = await res.json() as any;
    return data?.choices?.[0]?.message?.content || '';
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const provider = this.getCurrentProvider();
    const apiKey = await this.context.secrets.get(`promptmaster.apikey.${provider}`);

    if (!apiKey) {
      return { success: false, message: `No API key configured for ${provider}` };
    }

    const model = this.getModelForProvider(provider);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        await this.callProvider(
          provider, apiKey, model,
          'Reply with the single word: OK',
          'Test',
          controller.signal
        );
        return { success: true, message: `Connected to ${provider} (${model}) successfully!` };
      } finally {
        clearTimeout(timeout);
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection failed' };
    }
  }

  async toggle(): Promise<void> {
    this._isEnabled = !this._isEnabled;
    await this.context.globalState.update('promptmaster.smartModeEnabled', this._isEnabled);
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this._isEnabled = enabled;
    await this.context.globalState.update('promptmaster.smartModeEnabled', enabled);
  }

  getStatus(): { enabled: boolean; provider: string } {
    return {
      enabled: this._isEnabled,
      provider: this.getCurrentProvider(),
    };
  }

  async saveSettings(provider: string, model: string, endpoint?: string): Promise<void> {
    await this.context.globalState.update('promptmaster.provider', provider);
    await this.context.globalState.update(`promptmaster.model.${provider}`, model);
    if (endpoint !== undefined) {
      await this.context.globalState.update(`promptmaster.customEndpoint.${provider}`, endpoint);
    }
  }

  async saveApiKey(provider: string, key: string): Promise<void> {
    await this.context.secrets.store(`promptmaster.apikey.${provider}`, key.trim());
  }

  async clearApiKey(provider: string): Promise<void> {
    await this.context.secrets.delete(`promptmaster.apikey.${provider}`);
  }

  async hasApiKey(provider: string): Promise<boolean> {
    const key = await this.context.secrets.get(`promptmaster.apikey.${provider}`);
    return !!key;
  }

  async getProviderSettings(provider: string): Promise<{ model: string; customEndpoint: string; hasApiKey: boolean }> {
    return {
      model: this.getModelForProvider(provider),
      customEndpoint: this.getCustomEndpointForProvider(provider),
      hasApiKey: await this.hasApiKey(provider),
    };
  }
}
