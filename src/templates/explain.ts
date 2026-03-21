import type { PromptContext } from '../types';

export function explainTemplate(raw: string, ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push('[CONTEXT]');
  lines.push(`File: ${ctx.fileName} (${ctx.relativePath})`);
  lines.push(`Language: ${ctx.languageId}`);
  if (ctx.functionName) {
    lines.push(`Function: ${ctx.functionName}()`);
  }

  lines.push('');
  lines.push('[TASK]');
  lines.push(`Explain the following: "${raw}"`);
  if (ctx.taggedCode) {
    lines.push('Explain the tagged code block shown in [CODE] section.');
  } else if (ctx.functionName) {
    lines.push(`Explain the ${ctx.functionName}() function.`);
  }

  if (ctx.taggedCode) {
    lines.push('');
    lines.push('[CODE]');
    lines.push(ctx.taggedCode);
  }

  lines.push('');
  lines.push('[SCOPE LOCK]');
  lines.push('- Do NOT suggest any code changes or improvements');
  lines.push('- Do NOT rewrite or refactor any code');
  lines.push('- ONLY explain what the code does and how it works');
  lines.push('- Do NOT add any new code');

  lines.push('');
  lines.push('[OUTPUT]');
  lines.push('Provide a clear, plain-English explanation suitable for a developer.');
  lines.push('Structure the explanation as:');
  lines.push('  1. Purpose — what does this code do at a high level');
  lines.push('  2. How it works — step by step walkthrough');
  lines.push('  3. Key details — any important patterns, edge cases, or dependencies');
  lines.push('Keep the explanation concise and focused.');

  return lines.join('\n');
}
