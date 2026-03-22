import * as vscode from 'vscode';
import { ApiService } from './apiService';
import { SidebarProvider } from './sidebarProvider';
import { StorageService } from './storageService';

export function activate(context: vscode.ExtensionContext): void {
  const storage = new StorageService(context);
  const apiService = new ApiService();
  const sidebarProvider = new SidebarProvider(context, storage, apiService);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('promptmasterAI.focusSidebar', async () => {
      await vscode.commands.executeCommand(`${SidebarProvider.viewType}.focus`);
    }),
  );
}

export function deactivate(): void {}
