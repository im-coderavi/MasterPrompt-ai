// Message types for webview ↔ extension communication for settings

// Messages the webview can send to extension:
export type SettingsMessage =
  | { command: 'saveApiKey'; provider: string; key: string; model?: string; endpoint?: string }
  | { command: 'clearApiKey'; provider: string }
  | { command: 'saveSettings'; provider: string; model: string; endpoint?: string }
  | { command: 'testConnection' }
  | { command: 'toggleSmartMode'; enabled: boolean }
  | { command: 'ready' };

// Messages extension sends to webview:
export type ExtensionMessage =
  | { command: 'settingsLoaded'; settings: CurrentSettings }
  | { command: 'testResult'; success: boolean; message: string }
  | { command: 'apiKeySaved'; provider: string };

export interface CurrentSettings {
  smartModeEnabled: boolean;
  provider: string;
  model: string;
  customEndpoint: string;
  hasApiKey: boolean;
}
