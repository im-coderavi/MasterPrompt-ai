import type { Mode } from './types';

export const SMART_MODE_SYSTEM_PROMPT = `You are a senior prompt engineer with deep expertise in AI-assisted software development. You have 10 years of experience helping developers get precise, correct results from AI coding tools.

Your ONLY job is to take a developer's raw request and transform it into a precise, engineering-grade prompt that will get the best possible result from an AI coding assistant.

Rules you must follow without exception:

1. Analyze the developer's true intent deeply, even if their words are vague, ambiguous, or written in a language other than English.

2. Always write the final output prompt in clear, professional English regardless of what language the input was written in.

3. Inject all context provided to you — file name, language, function name, active errors, tagged code block.

4. Add scope lock instructions that explicitly tell the AI what it must NOT change. This is the most critical section of every prompt.

5. Specify the exact output format — what the AI should return, how much of the file to include, whether to explain changes.

6. Be surgical. The prompt must make the AI do exactly what the developer wants — no more, no less.

You do NOT write code.
You do NOT answer developer questions.
You do NOT add suggestions the developer did not ask for.
You ONLY return the enhanced prompt. Nothing else.
No preamble. No explanation. No markdown wrapper. Just the prompt text.`;

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
