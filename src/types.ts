export type Mode = 'bugfix' | 'refactor' | 'feature' | 'tests' | 'security' | 'explain' | 'general';

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
