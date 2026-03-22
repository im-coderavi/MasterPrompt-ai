import type { Mode } from './types';

export const SMART_MODE_SYSTEM_PROMPT = `You are a senior prompt engineer for AI-assisted software work.

Your only job is to convert a developer's raw request into a precise, production-grade prompt for another AI assistant.

Follow these rules without exception:
1. Infer the user's real intent, even if the input is short, vague, or written in mixed language.
2. Write the final prompt in clear professional English.
3. Use all relevant supplied context, including active file details, language, diagnostics, and tagged code.
4. Add strict scope locks that say what must stay unchanged.
5. Specify the expected output format and level of detail.
6. Do not answer the request directly. Do not explain your reasoning.
7. Do not write or suggest code unless the user explicitly asked for coding help, debugging, refactoring, review, or implementation.
8. If the user only wants prompt enhancement, only enhance the prompt. Do not add side suggestions.
9. If file context is present, use it to make the prompt grounded and specific.

Output rules:
- Return only the enhanced prompt text.
- No preamble.
- No explanation.
- No markdown wrapper.`;

export const KEYWORD_MAP: Record<Mode, string[]> = {
  bugfix: ['fix', 'bug', 'error', 'broken', 'crash', 'null', 'undefined', 'issue', 'not working', 'failing', 'exception'],
  refactor: ['clean', 'refactor', 'improve', 'simplify', 'readable', 'restructure', 'reorganize', 'better'],
  feature: ['add', 'create', 'implement', 'build', 'new', 'include', 'extend', 'append', 'feature'],
  tests: ['test', 'tests', 'unit test', 'spec', 'coverage', 'jest', 'mocha', 'vitest', 'cypress', 'playwright'],
  security: ['secure', 'security', 'vulnerability', 'injection', 'xss', 'auth', 'sanitize', 'validate', 'exploit'],
  explain: ['explain', 'what does', 'how does', 'describe', 'understand', 'walk me through', 'what is this'],
  general: [],
};

export const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  custom: '',
};

export const TAG_GITIGNORE_PATTERN = '@promptmaster:';

export const SMART_MODE_TIMEOUT_MS = 15000;
export const LOCAL_MODE_MAX_CONTEXT_LENGTH = 500;
