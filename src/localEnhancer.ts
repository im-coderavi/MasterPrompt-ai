import type { ActiveEditorContext } from './types';

export interface LocalEnhanceOptions {
  variation?: number;
  activeFile?: ActiveEditorContext;
}

const VAGUE_WORDS: Array<[RegExp, string]> = [
  [/\bgood\b/gi, 'high-quality'],
  [/\bnice\b/gi, 'clear and polished'],
  [/\bbetter\b/gi, 'more effective'],
  [/\bimprove\b/gi, 'optimize'],
  [/\bfast\b/gi, 'low-latency'],
  [/\bclean\b/gi, 'well-structured'],
];

const OUTPUT_VARIANTS = [
  'Return only the enhanced prompt as plain text.',
  'Return only the enhanced prompt, structured for a coding assistant.',
  'Return only the enhanced prompt, with crisp sections and no commentary.',
];

const CONSTRAINT_VARIANTS = [
  'Keep the answer specific, actionable, and directly tied to the request.',
  'Avoid vague guidance and make each recommendation concrete.',
  'Call out assumptions explicitly and keep the response practical.',
];

const ACTIVE_FILE_CONTEXT_LIMIT = 1200;

function normalizeWhitespace(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
}

function detectDomain(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (/(code|bug|refactor|typescript|javascript|python|sql|api|function|class|react|node)/.test(lower)) {
    return 'software engineering';
  }
  if (/(market|brand|campaign|seo|copywriting|landing page|audience)/.test(lower)) {
    return 'marketing strategy';
  }
  if (/(research|paper|study|citation|experiment|hypothesis)/.test(lower)) {
    return 'research analysis';
  }
  if (/(design|ui|ux|layout|figma|visual)/.test(lower)) {
    return 'product design';
  }
  if (/(resume|cv|job|interview|career)/.test(lower)) {
    return 'career coaching';
  }

  return 'the requested subject';
}

function containsCode(prompt: string): boolean {
  return /(```|function\s+\w+|const\s+\w+|class\s+\w+|<\w+|=>|{[\s\S]*}|;)/.test(prompt);
}

function isQuestion(prompt: string): boolean {
  return /\?$/.test(prompt.trim()) || /^(what|why|how|when|where|can|could|should|would|is|are|do|does)\b/i.test(prompt.trim());
}

function replaceVagueWords(prompt: string): string {
  return VAGUE_WORDS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), prompt);
}

function extractGoal(prompt: string): string {
  const firstLine = prompt.split('\n').find((line) => line.trim().length > 0) ?? prompt;
  return isQuestion(prompt)
    ? `Rewrite this request into a precise prompt that helps the downstream AI answer it correctly: ${firstLine.trim()}`
    : `Rewrite this request into a precise prompt that executes the intended task with high precision: ${firstLine.trim()}`;
}

function needsCodeOutput(prompt: string): boolean {
  return /\b(code|snippet|implementation|function|component|query|sql|script|example code|working code)\b/i.test(prompt);
}

function buildFileContext(activeFile?: ActiveEditorContext): string[] {
  if (!activeFile) {
    return [];
  }

  const trimmedContent = normalizeWhitespace(activeFile.content).slice(0, ACTIVE_FILE_CONTEXT_LIMIT);

  return [
    'Active File Context:',
    `- File: ${activeFile.fileName}`,
    `- Path: ${activeFile.relativePath}`,
    `- Language: ${activeFile.language}`,
    '- Open file is part of the request context. Use it when relevant, but do not describe or modify unrelated code.',
    trimmedContent ? `- Current file excerpt:\n${trimmedContent}` : '- Current file excerpt: unavailable',
  ];
}

export function enhancePrompt(rawPrompt: string, options: LocalEnhanceOptions = {}): string {
  const cleaned = normalizeWhitespace(replaceVagueWords(rawPrompt));
  const domain = detectDomain(cleaned);
  const variation = Math.abs(options.variation ?? 0) % OUTPUT_VARIANTS.length;
  const explicitCodeRequest = containsCode(cleaned) || needsCodeOutput(cleaned);
  const codeInstructions = explicitCodeRequest
    ? 'Allow code output only because the user explicitly asked for code, implementation help, or code review.'
    : 'Do not ask the downstream AI to provide code, refactors, fixes, or implementation suggestions unless the user explicitly requests them.';

  const constraints = [
    CONSTRAINT_VARIANTS[variation],
    'Preserve the user intent while removing ambiguity.',
    'Use senior prompt engineering quality and concrete scope boundaries.',
    'If the request is partly ambiguous, resolve it into the safest likely interpretation without changing the main goal.',
    'Do not add new tasks, features, refactors, or debugging work that the user did not ask for.',
    OUTPUT_VARIANTS[variation],
    codeInstructions,
  ];

  const contextBlock = isQuestion(cleaned)
    ? `Rewrite the original question into an explicit deliverable-oriented task.\nOriginal request:\n${cleaned}`
    : cleaned;

  return [
    `You are a senior prompt engineer specializing in ${domain}.`,
    '',
    'Task:',
    extractGoal(cleaned),
    '',
    'User Request:',
    contextBlock,
    '',
    ...buildFileContext(options.activeFile),
    ...(options.activeFile ? [''] : []),
    'Constraints:',
    ...constraints.map((item) => `- ${item}`),
    '',
    'Output Format:',
    '- Return only the improved prompt text.',
    '- Write the prompt in professional English.',
    '- Include objective, relevant context, strict boundaries, and expected output shape.',
  ].join('\n');
}
