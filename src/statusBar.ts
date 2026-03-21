import * as vscode from 'vscode';
import type { SmartMode } from './smartMode';
import type { TagManager } from './tagManager';

export class StatusBarManager {
  private modeItem: vscode.StatusBarItem;
  private tagItem: vscode.StatusBarItem;

  constructor(
    private smartMode: SmartMode,
    private tagManager: TagManager
  ) {
    // Mode indicator
    this.modeItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.modeItem.command = 'promptmaster.openPanel';
    this.modeItem.tooltip = 'Click to open PromptMaster AI';

    // Tag indicator
    this.tagItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    this.tagItem.command = 'promptmaster.openPanel';

    this.update();
    this.modeItem.show();
  }

  update(): void {
    const status = this.smartMode.getStatus();

    if (status.enabled) {
      const providerName = status.provider.charAt(0).toUpperCase() + status.provider.slice(1);
      this.modeItem.text = `$(robot) PromptMaster: ${providerName}`;
      this.modeItem.backgroundColor = undefined;
    } else {
      this.modeItem.text = '$(robot) PromptMaster: Local';
      this.modeItem.backgroundColor = undefined;
    }

    // Tag status
    if (this.tagManager.hasActiveTag()) {
      const tagInfo = this.tagManager.getTagInfo();
      this.tagItem.text = `$(tag) Tag active — ${tagInfo?.fileName || 'unknown'}`;
      this.tagItem.show();
    } else {
      this.tagItem.hide();
    }
  }

  dispose(): void {
    this.modeItem.dispose();
    this.tagItem.dispose();
  }
}
