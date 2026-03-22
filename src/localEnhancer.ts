export interface LocalEnhanceOptions {
  variation?: number;
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
  'Respond in structured markdown with examples.',
  'Respond in structured markdown with a concise example and a checklist.',
  'Respond in structured markdown with examples, edge cases, and implementation notes.',
];

const CONSTRAINT_VARIANTS = [
  'Keep the answer specific, actionable, and directly tied to the request.',
  'Avoid vague guidance and make each recommendation concrete.',
  'Call out assumptions explicitly and keep the response practical.',
];

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
    ? `Complete the task implied by this question and produce a direct, useful answer: ${firstLine.trim()}`
    : `Complete this task with high precision: ${firstLine.trim()}`;
}

export function enhancePrompt(rawPrompt: string, options: LocalEnhanceOptions = {}): string {
  const cleaned = normalizeWhitespace(replaceVagueWords(rawPrompt));
  const domain = detectDomain(cleaned);
  const variation = Math.abs(options.variation ?? 0) % OUTPUT_VARIANTS.length;
  const codeInstructions = containsCode(cleaned)
    ? 'Include working code with comments. Explain each step.'
    : 'Include concise examples where they improve clarity.';

  const constraints = [
    CONSTRAINT_VARIANTS[variation],
    'Think step by step before answering.',
    OUTPUT_VARIANTS[variation],
    codeInstructions,
  ];

  const contextBlock = isQuestion(cleaned)
    ? `Rewrite the original question into an explicit deliverable-oriented task.\nOriginal request:\n${cleaned}`
    : cleaned;

  return [
    `You are an expert in ${domain}.`,
    '',
    'Goal:',
    extractGoal(cleaned),
    '',
    'Context:',
    contextBlock,
    '',
    'Constraints:',
    ...constraints.map((item) => `- ${item}`),
    '',
    'Output Format:',
    '- Provide a structured markdown response.',
    '- Use labeled sections and concrete recommendations.',
    '- Include examples, sample outputs, or code where useful.',
  ].join('\n');
}
