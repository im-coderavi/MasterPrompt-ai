export type Mode =
  | 'bugfix'
  | 'refactor'
  | 'feature'
  | 'tests'
  | 'security'
  | 'explain'
  | 'general';

export interface PromptContext {
  fileName: string;
  relativePath: string;
  languageId: string;
  functionName: string | null;
  activeErrors: string[];
  activeWarnings: string[];
  selectedText: string | null;
  taggedCode: string | null;
  tagStartLine: number | null;
  tagEndLine: number | null;
}

export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'custom';
export type SaveStatus = 'not_configured' | 'saved' | 'verified';
export type EnhancementStyle = 'concise' | 'balanced' | 'detailed';
export type PersonaOption =
  | 'Senior Prompt Engineer'
  | 'Staff Engineer'
  | 'Technical Writer'
  | 'Research Scientist';
export type EnterKeyBehavior = 'send' | 'newline';

export interface ApiProviderSettings {
  provider: ProviderId;
  model: string;
  baseUrl: string;
}

export interface SmartModeBehaviorSettings {
  enhancementStyle: EnhancementStyle;
  persona: PersonaOption;
  autoAttachActiveFile: boolean;
  includeWorkspaceInfo: boolean;
  maxResponseTokens: 1024 | 2048 | 4096 | 8192;
  temperature: number;
  systemPromptOverride: string;
}

export interface ChatSettings {
  enterKeyBehavior: EnterKeyBehavior;
  showTimestamps: boolean;
  showTokenUsage: boolean;
  autoScroll: boolean;
}

export interface ConnectionState {
  status: SaveStatus;
  lastCheckedAt?: string;
  lastError?: string;
  model?: string;
  latencyMs?: number;
}

export interface ExtensionSettings {
  api: ApiProviderSettings;
  smartModeEnabled: boolean;
  behavior: SmartModeBehaviorSettings;
  chat: ChatSettings;
  connectionStates: Record<ProviderId, ConnectionState>;
}

export interface SavedPrompt {
  id: string;
  content: string;
  provider: ProviderId | 'local';
  timestamp: string;
  preview: string;
}

export interface AttachedFile {
  fileName: string;
  filePath: string;
  language: string;
  content: string;
}

export interface ActiveEditorContext {
  fileName: string;
  relativePath: string;
  language: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: ProviderId | 'local';
  tokenUsage?: number;
  attachedFile?: AttachedFile;
}

export interface ViewState {
  activeTab: 'chat' | 'settings';
  smartModeEnabled: boolean;
  localDraft: string;
  smartDraft: string;
  localResult: string;
  localVariation: number;
  attachedFile?: AttachedFile;
}

export interface SettingsPayload {
  settings: ExtensionSettings;
  chatHistory: ChatMessage[];
  savedPrompts: SavedPrompt[];
  viewState: ViewState;
  providerSecrets: Record<ProviderId, boolean>;
  version: string;
}

export interface SmartChatRequest {
  userMessage: string;
  history: ChatMessage[];
  attachedFile?: AttachedFile;
}

export interface StreamRequest {
  systemPrompt: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  settings: ExtensionSettings;
  apiKey?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  model?: string;
}
