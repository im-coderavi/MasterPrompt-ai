import * as vscode from 'vscode';
import { TagManager } from './tagManager';
import { ContextReader } from './contextReader';
import { PromptEngine } from './promptEngine';
import { SmartMode } from './smartMode';
import { SidebarProvider } from './sidebarProvider';
import { StatusBarManager } from './statusBar';

export function activate(context: vscode.ExtensionContext) {
  // Initialize all modules
  const tagManager = new TagManager(context);
  const contextReader = new ContextReader(tagManager);
  const promptEngine = new PromptEngine();
  const smartMode = new SmartMode(context);
  const statusBar = new StatusBarManager(smartMode, tagManager);
  const sidebarProvider = new SidebarProvider(
    context, tagManager, contextReader, promptEngine, smartMode, statusBar
  );

  // Register sidebar webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('promptmaster.sidebar', sidebarProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('promptmaster.openPanel', () => {
      vscode.commands.executeCommand('promptmaster.sidebar.focus');
    }),

    vscode.commands.registerCommand('promptmaster.tagSelection', () => {
      tagManager.tagSelection().then(() => {
        statusBar.update();
      });
    }),

    vscode.commands.registerCommand('promptmaster.removeTag', () => {
      tagManager.removeTag().then(() => {
        statusBar.update();
      });
    }),

    vscode.commands.registerCommand('promptmaster.enhanceCurrentPrompt', () => {
      sidebarProvider.enhanceFromCommand();
    }),

    vscode.commands.registerCommand('promptmaster.openSettings', () => {
      sidebarProvider.openSettings();
    }),

    vscode.commands.registerCommand('promptmaster.toggleSmartMode', () => {
      smartMode.toggle().then(() => {
        statusBar.update();
      });
    }),

    vscode.commands.registerCommand('promptmaster.copyLastPrompt', () => {
      sidebarProvider.copyLastPrompt();
    }),

    vscode.commands.registerCommand('promptmaster.clearHistory', () => {
      vscode.window.showInformationMessage('PromptMaster: Prompt history cleared.');
    }),

    vscode.commands.registerCommand('promptmaster.enhanceSelection', () => {
      sidebarProvider.enhanceSelection();
    })
  );

  // Scan for existing tags on startup
  tagManager.scanForExistingTags();

  // Listen for visible editor changes to reapply tag decorations
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      tagManager.scanForExistingTags();
      statusBar.update();
    })
  );

  // Dispose status bar on deactivation
  context.subscriptions.push({
    dispose: () => statusBar.dispose(),
  });
}

export function deactivate() {
  // Cleanup handled by subscription disposal
}
