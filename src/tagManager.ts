import * as vscode from 'vscode';

const TAG_START_MARKER = '@promptmaster:start';
const TAG_END_MARKER = '@promptmaster:end';

export class TagManager {
  private tagDecoration: vscode.TextEditorDecorationType;
  private activeTag: { uri: vscode.Uri; startLine: number; endLine: number } | null = null;

  constructor(private context: vscode.ExtensionContext) {
    this.tagDecoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      borderWidth: '0 0 0 3px',
      borderStyle: 'solid',
      borderColor: new vscode.ThemeColor('charts.blue'),
      backgroundColor: 'rgba(137, 180, 250, 0.08)',
    });

    this.restoreTagState();
  }

  async tagSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showWarningMessage('PromptMaster: Select some code first, then tag it.');
      return;
    }

    await this.removeTag();

    const start = editor.selection.start.line;
    const end = editor.selection.end.line;
    const commentStart = this.getCommentMarker(editor.document.languageId, 'start');
    const commentEnd = this.getCommentMarker(editor.document.languageId, 'end');

    await editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(start, 0), `${commentStart} ${TAG_START_MARKER}${commentEnd}\n`);
      editBuilder.insert(new vscode.Position(end + 2, 0), `${commentStart} ${TAG_END_MARKER}${commentEnd}\n`);
    });

    this.activeTag = { uri: editor.document.uri, startLine: start + 1, endLine: end + 1 };
    this.applyDecoration(editor);
    await this.saveTagState();

    vscode.window.showInformationMessage('PromptMaster: Code tagged. Open the Enhance tab to use it as prompt context.');
  }

  getTaggedCode(): string | null {
    if (!this.activeTag) {
      return null;
    }

    const editor = vscode.window.visibleTextEditors.find(
      (visibleEditor) => visibleEditor.document.uri.toString() === this.activeTag!.uri.toString()
    );

    if (!editor) {
      const doc = vscode.workspace.textDocuments.find(
        (openDocument) => openDocument.uri.toString() === this.activeTag!.uri.toString()
      );
      if (!doc) {
        return null;
      }
      return this.extractTaggedCodeFromDoc(doc);
    }

    return this.extractTaggedCodeFromDoc(editor.document);
  }

  getTagStartLine(): number | null {
    return this.activeTag?.startLine ?? null;
  }

  getTagEndLine(): number | null {
    return this.activeTag?.endLine ?? null;
  }

  getTagFileName(): string | null {
    if (!this.activeTag) {
      return null;
    }
    const parts = this.activeTag.uri.path.split('/');
    return parts[parts.length - 1] || null;
  }

  getTagInfo(): { fileName: string; lines: string } | null {
    if (!this.activeTag) {
      return null;
    }

    return {
      fileName: this.getTagFileName() || 'unknown',
      lines: `${this.activeTag.startLine}-${this.activeTag.endLine}`,
    };
  }

  hasActiveTag(): boolean {
    return this.activeTag !== null;
  }

  async removeTag(): Promise<void> {
    if (!this.activeTag) {
      return;
    }

    const doc = vscode.workspace.textDocuments.find(
      (openDocument) => openDocument.uri.toString() === this.activeTag!.uri.toString()
    );

    if (doc) {
      const edit = new vscode.WorkspaceEdit();
      const lines = doc.getText().split('\n');
      const linesToRemove: number[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(TAG_START_MARKER) || lines[i].includes(TAG_END_MARKER)) {
          linesToRemove.push(i);
        }
      }

      for (let i = linesToRemove.length - 1; i >= 0; i--) {
        const lineNum = linesToRemove[i];
        const range = new vscode.Range(
          new vscode.Position(lineNum, 0),
          new vscode.Position(lineNum + 1, 0)
        );
        edit.delete(doc.uri, range);
      }

      await vscode.workspace.applyEdit(edit);
    }

    vscode.window.visibleTextEditors.forEach((editor) => {
      editor.setDecorations(this.tagDecoration, []);
    });

    this.activeTag = null;
    await this.saveTagState();
  }

  scanForExistingTags(): void {
    vscode.window.visibleTextEditors.forEach((editor) => {
      this.applyDecoration(editor);
    });

    vscode.workspace.textDocuments.forEach((doc) => {
      const text = doc.getText();
      const startIdx = text.indexOf(TAG_START_MARKER);
      const endIdx = text.indexOf(TAG_END_MARKER);

      if (startIdx !== -1 && endIdx !== -1) {
        const startLine = doc.positionAt(startIdx).line + 1;
        const endLine = doc.positionAt(endIdx).line - 1;
        this.activeTag = { uri: doc.uri, startLine, endLine };
        void this.saveTagState();

        const editor = vscode.window.visibleTextEditors.find(
          (visibleEditor) => visibleEditor.document.uri.toString() === doc.uri.toString()
        );
        if (editor) {
          this.applyDecoration(editor);
        }
      }
    });
  }

  private extractTaggedCodeFromDoc(doc: vscode.TextDocument): string | null {
    const text = doc.getText();
    const startIdx = text.indexOf(TAG_START_MARKER);
    const endIdx = text.indexOf(TAG_END_MARKER);
    if (startIdx === -1 || endIdx === -1) {
      return null;
    }

    const startLine = doc.positionAt(startIdx).line + 1;
    const endLine = doc.positionAt(endIdx).line - 1;
    if (endLine < startLine) {
      return null;
    }

    const lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(doc.lineAt(i).text);
    }
    return lines.join('\n');
  }

  private applyDecoration(editor: vscode.TextEditor): void {
    if (!this.activeTag) {
      return;
    }
    if (editor.document.uri.toString() !== this.activeTag.uri.toString()) {
      return;
    }

    const ranges: vscode.Range[] = [];
    for (let line = this.activeTag.startLine; line <= this.activeTag.endLine; line++) {
      if (line < editor.document.lineCount) {
        ranges.push(new vscode.Range(
          new vscode.Position(line, 0),
          new vscode.Position(line, editor.document.lineAt(line).text.length)
        ));
      }
    }
    editor.setDecorations(this.tagDecoration, ranges);
  }

  private async saveTagState(): Promise<void> {
    if (this.activeTag) {
      await this.context.globalState.update('promptmaster.activeTag', {
        uri: this.activeTag.uri.toString(),
        startLine: this.activeTag.startLine,
        endLine: this.activeTag.endLine,
      });
      return;
    }

    await this.context.globalState.update('promptmaster.activeTag', undefined);
  }

  private restoreTagState(): void {
    const saved = this.context.globalState.get<{
      uri: string;
      startLine: number;
      endLine: number;
    }>('promptmaster.activeTag');

    if (saved) {
      this.activeTag = {
        uri: vscode.Uri.parse(saved.uri),
        startLine: saved.startLine,
        endLine: saved.endLine,
      };
    }
  }

  private getCommentMarker(lang: string, type: 'start' | 'end'): string {
    const blockCommentLangs: Record<string, [string, string]> = {
      html: ['<!--', '-->'],
      xml: ['<!--', '-->'],
      css: ['/*', '*/'],
      sql: ['--', ''],
    };

    if (blockCommentLangs[lang]) {
      return type === 'start'
        ? blockCommentLangs[lang][0]
        : (blockCommentLangs[lang][1] ? ` ${blockCommentLangs[lang][1]}` : '');
    }

    const hashLangs = ['python', 'ruby', 'shellscript', 'bash', 'yaml', 'perl', 'r'];
    if (hashLangs.includes(lang)) {
      return type === 'start' ? '#' : '';
    }

    return type === 'start' ? '//' : '';
  }
}
