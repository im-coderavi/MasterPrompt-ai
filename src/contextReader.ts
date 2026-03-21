import * as vscode from 'vscode';
import * as path from 'path';
import type { PromptContext } from './promptEngine.js';
import type { TagManager } from './tagManager.js';
import { LOCAL_MODE_MAX_CONTEXT_LENGTH } from './constants.js';

const FUNCTION_PATTERNS: Record<string, RegExp[]> = {
  javascript: [/function\s+(\w+)\s*\(/, /const\s+(\w+)\s*=\s*(async\s*)?\(/, /(\w+)\s*\([^)]*\)\s*\{/],
  typescript: [/function\s+(\w+)\s*\(/, /const\s+(\w+)\s*=\s*(async\s*)?\(/, /(\w+)\s*\([^)]*\)\s*:/],
  javascriptreact: [/function\s+(\w+)\s*\(/, /const\s+(\w+)\s*=\s*(async\s*)?\(/, /(\w+)\s*\([^)]*\)\s*\{/],
  typescriptreact: [/function\s+(\w+)\s*\(/, /const\s+(\w+)\s*=\s*(async\s*)?\(/, /(\w+)\s*\([^)]*\)\s*:/],
  python: [/def\s+(\w+)\s*\(/, /async\s+def\s+(\w+)\s*\(/],
  go: [/func\s+(\w+)\s*\(/, /func\s+\(\w+\s+\*?\w+\)\s+(\w+)\s*\(/],
  rust: [/fn\s+(\w+)\s*\(/],
  java: [/(?:public|private|protected|static|\s)+\w+\s+(\w+)\s*\(/],
  csharp: [/(?:public|private|protected|static|\s)+\w+\s+(\w+)\s*\(/],
  c: [/\w+\s+(\w+)\s*\(/],
  cpp: [/\w+\s+(\w+)\s*\(/],
  php: [/function\s+(\w+)\s*\(/],
  ruby: [/def\s+(\w+)/],
  swift: [/func\s+(\w+)\s*\(/],
  kotlin: [/fun\s+(\w+)\s*\(/],
};

export class ContextReader {
  constructor(private tagManager: TagManager) {}

  async read(): Promise<PromptContext> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return this.empty();
    }

    return {
      fileName: path.basename(editor.document.fileName),
      relativePath: vscode.workspace.asRelativePath(editor.document.fileName),
      languageId: editor.document.languageId,
      functionName: this.detectFunctionAtCursor(editor),
      activeErrors: this.getErrors(editor.document.uri),
      activeWarnings: this.getWarnings(editor.document.uri),
      selectedText: this.getSelection(editor),
      taggedCode: this.tagManager.getTaggedCode(),
      tagStartLine: this.tagManager.getTagStartLine(),
      tagEndLine: this.tagManager.getTagEndLine(),
    };
  }

  private detectFunctionAtCursor(editor: vscode.TextEditor): string | null {
    const lang = editor.document.languageId;
    const patterns = FUNCTION_PATTERNS[lang] || FUNCTION_PATTERNS['javascript'];
    const cursorLine = editor.selection.active.line;

    // Scan upward from cursor to find nearest function declaration
    for (let line = cursorLine; line >= Math.max(0, cursorLine - 50); line--) {
      const text = editor.document.lineAt(line).text;
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          // Return the first capturing group (function name)
          return match[1] || null;
        }
      }
    }
    return null;
  }

  private getErrors(uri: vscode.Uri): string[] {
    return vscode.languages.getDiagnostics(uri)
      .filter(d => d.severity === vscode.DiagnosticSeverity.Error)
      .map(d => `Line ${d.range.start.line + 1}: ${d.message}`)
      .map(s => s.length > LOCAL_MODE_MAX_CONTEXT_LENGTH
        ? s.substring(0, LOCAL_MODE_MAX_CONTEXT_LENGTH) + '...'
        : s);
  }

  private getWarnings(uri: vscode.Uri): string[] {
    return vscode.languages.getDiagnostics(uri)
      .filter(d => d.severity === vscode.DiagnosticSeverity.Warning)
      .map(d => `Line ${d.range.start.line + 1}: ${d.message}`)
      .map(s => s.length > LOCAL_MODE_MAX_CONTEXT_LENGTH
        ? s.substring(0, LOCAL_MODE_MAX_CONTEXT_LENGTH) + '...'
        : s);
  }

  private getSelection(editor: vscode.TextEditor): string | null {
    const selection = editor.selection;
    if (selection.isEmpty) {
      return null;
    }
    return editor.document.getText(selection);
  }

  private empty(): PromptContext {
    return {
      fileName: 'unknown',
      relativePath: 'unknown',
      languageId: 'plaintext',
      functionName: null,
      activeErrors: [],
      activeWarnings: [],
      selectedText: null,
      taggedCode: null,
      tagStartLine: null,
      tagEndLine: null,
    };
  }
}
