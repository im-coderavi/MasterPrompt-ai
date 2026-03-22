import type { ExtensionSettings, ProviderId, StreamRequest, TestConnectionResult } from './types';

interface StreamPayload {
  onChunk: (chunk: string) => void;
}

export class ApiService {
  async streamChat(request: StreamRequest, payload: StreamPayload): Promise<void> {
    const provider = request.settings.api.provider;

    switch (provider) {
      case 'gemini':
        await this.streamGemini(request, payload);
        return;
      case 'openai':
        await this.streamOpenAI(request, payload, request.settings.api.baseUrl || 'https://api.openai.com/v1');
        return;
      case 'anthropic':
        await this.streamAnthropic(request, payload);
        return;
      case 'ollama':
        await this.streamOllama(request, payload);
        return;
      case 'custom':
        await this.streamOpenAI(request, payload, request.settings.api.baseUrl);
        return;
    }
  }

  async testConnection(settings: ExtensionSettings, apiKey?: string): Promise<TestConnectionResult> {
    const started = Date.now();
    const provider = settings.api.provider;

    try {
      switch (provider) {
        case 'gemini': {
          this.ensureApiKey(apiKey, provider);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.api.model)}:generateContent?key=${encodeURIComponent(apiKey!)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Say connected.' }] }],
              }),
            },
          );
          await this.throwIfNotOk(response);
          return this.successResult(settings.api.model, started);
        }
        case 'openai':
        case 'custom': {
          if (provider !== 'custom' || apiKey) {
            this.ensureApiKey(apiKey, provider);
          }
          const baseUrl = provider === 'openai' ? 'https://api.openai.com/v1' : settings.api.baseUrl;
          const response = await fetch(`${this.trimSlash(baseUrl)}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey ?? ''}`,
            },
            body: JSON.stringify({
              model: settings.api.model,
              messages: [{ role: 'user', content: 'Say connected.' }],
              max_tokens: 16,
            }),
          });
          await this.throwIfNotOk(response);
          return this.successResult(settings.api.model, started);
        }
        case 'anthropic': {
          this.ensureApiKey(apiKey, provider);
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey!,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: settings.api.model,
              max_tokens: 16,
              messages: [{ role: 'user', content: 'Say connected.' }],
            }),
          });
          await this.throwIfNotOk(response);
          return this.successResult(settings.api.model, started);
        }
        case 'ollama': {
          const response = await fetch(`${this.trimSlash(settings.api.baseUrl || 'http://localhost:11434')}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: settings.api.model,
              stream: false,
              messages: [{ role: 'user', content: 'Say connected.' }],
            }),
          });
          await this.throwIfNotOk(response);
          return this.successResult(settings.api.model, started);
        }
      }
    } catch (error) {
      return this.failureResult(error, started);
    }
  }

  private async streamGemini(request: StreamRequest, payload: StreamPayload): Promise<void> {
    this.ensureApiKey(request.apiKey, 'gemini');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.settings.api.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(request.apiKey!)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.systemPrompt }] },
          contents: request.messages
            .filter((message) => message.role !== 'system')
            .map((message) => ({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
          generationConfig: {
            temperature: request.settings.behavior.temperature,
            maxOutputTokens: request.settings.behavior.maxResponseTokens,
          },
        }),
      },
    );

    await this.throwIfNotOk(response);
    await this.readSseStream(response, (data) => {
      const parsed = this.safeJsonParse(data);
      const text =
        parsed?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? '')
          .join('') ?? '';
      if (text) {
        payload.onChunk(text);
      }
    });
  }

  private async streamOpenAI(request: StreamRequest, payload: StreamPayload, baseUrl?: string): Promise<void> {
    this.ensureApiKey(request.apiKey, request.settings.api.provider);
    const response = await fetch(`${this.trimSlash(baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey!}`,
      },
      body: JSON.stringify({
        model: request.settings.api.model,
        messages: request.messages,
        temperature: request.settings.behavior.temperature,
        max_tokens: request.settings.behavior.maxResponseTokens,
        stream: true,
      }),
    });

    await this.throwIfNotOk(response);
    await this.readSseStream(response, (data) => {
      if (data === '[DONE]') {
        return;
      }
      const parsed = this.safeJsonParse(data);
      const text = parsed?.choices?.[0]?.delta?.content ?? '';
      if (text) {
        payload.onChunk(text);
      }
    });
  }

  private async streamAnthropic(request: StreamRequest, payload: StreamPayload): Promise<void> {
    this.ensureApiKey(request.apiKey, 'anthropic');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': request.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.settings.api.model,
        system: request.systemPrompt,
        messages: request.messages.filter((message) => message.role !== 'system'),
        temperature: request.settings.behavior.temperature,
        max_tokens: request.settings.behavior.maxResponseTokens,
        stream: true,
      }),
    });

    await this.throwIfNotOk(response);
    await this.readSseStream(response, (data) => {
      const parsed = this.safeJsonParse(data);
      const text = parsed?.delta?.text ?? '';
      if (text) {
        payload.onChunk(text);
      }
    });
  }

  private async streamOllama(request: StreamRequest, payload: StreamPayload): Promise<void> {
    const response = await fetch(`${this.trimSlash(request.settings.api.baseUrl || 'http://localhost:11434')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.settings.api.model,
        stream: true,
        messages: [
          { role: 'system', content: request.systemPrompt },
          ...request.messages.filter((message) => message.role !== 'system'),
        ],
        options: {
          temperature: request.settings.behavior.temperature,
          num_predict: request.settings.behavior.maxResponseTokens,
        },
      }),
    });

    await this.throwIfNotOk(response);
    await this.readJsonLineStream(response, (line) => {
      const parsed = this.safeJsonParse(line);
      const text = parsed?.message?.content ?? '';
      if (text) {
        payload.onChunk(text);
      }
    });
  }

  private async readSseStream(response: Response, onData: (data: string) => void): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming is not available for this response.');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split(/\r?\n\r?\n/);
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        for (const line of chunk.split(/\r?\n/)) {
          if (line.startsWith('data:')) {
            onData(line.slice(5).trim());
          }
        }
      }
    }

    if (buffer.trim()) {
      for (const line of buffer.split(/\r?\n/)) {
        if (line.startsWith('data:')) {
          onData(line.slice(5).trim());
        }
      }
    }
  }

  private async readJsonLineStream(response: Response, onLine: (data: string) => void): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming is not available for this response.');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          onLine(trimmed);
        }
      }
    }

    if (buffer.trim()) {
      onLine(buffer.trim());
    }
  }

  private successResult(model: string, started: number): TestConnectionResult {
    const latency = Date.now() - started;
    return {
      success: true,
      message: `Connected · Model: ${model} · Latency: ${latency}ms`,
      model,
      latencyMs: latency,
    };
  }

  private failureResult(error: unknown, started: number): TestConnectionResult {
    return {
      success: false,
      message: `Failed: ${this.toErrorMessage(error)}`,
      latencyMs: Date.now() - started,
    };
  }

  private ensureApiKey(apiKey: string | undefined, provider: ProviderId): void {
    if (!apiKey && provider !== 'ollama') {
      throw new Error(`No API key configured for ${provider}.`);
    }
  }

  private trimSlash(value?: string): string {
    return (value ?? '').replace(/\/+$/, '');
  }

  private safeJsonParse(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  private async throwIfNotOk(response: Response): Promise<void> {
    if (response.ok) {
      return;
    }

    const message = await response.text();
    throw new Error(`${response.status} ${response.statusText}${message ? ` — ${message}` : ''}`);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
