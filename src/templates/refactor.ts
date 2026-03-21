import type { PromptContext } from '../types';

export function refactorTemplate(raw: string, ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push('[CONTEXT]');
  lines.push(`File: ${ctx.fileName} (${ctx.relativePath})`);
  lines.push(`Language: ${ctx.languageId}`);
  if (ctx.functionName) {
    lines.push(`Function: ${ctx.functionName}()`);
  }

  lines.push('');
  lines.push('[TASK]');
  lines.push(`Refactor the following code as described: "${raw}"`);
  if (ctx.taggedCode) {
    lines.push('Refactor ONLY the tagged code block shown in [CODE] section.');
  } else if (ctx.functionName) {
    lines.push(`Refactor ONLY the ${ctx.functionName}() function.`);
  }
  lines.push('The refactored code must produce the exact same behavior and outputs as the original.');

  if (ctx.taggedCode) {
    lines.push('');
    lines.push('[CODE]');
    lines.push(ctx.taggedCode);
  }

  lines.push('');
  lines.push('[SCOPE LOCK]');
  if (ctx.taggedCode) {
    lines.push(`- Do NOT modify any code outside the tagged block (lines ${ctx.tagStartLine}–${ctx.tagEndLine})`);
  } else {
    lines.push(`- Do NOT modify any code outside the ${ctx.functionName ?? 'described'} function`);
  }
  lines.push('- Do NOT change external behavior, return values, or API contracts');
  lines.push('- Do NOT rename exported functions or public API methods');
  lines.push('- Do NOT remove or alter existing comments unless they are clearly wrong');
  lines.push('- Do NOT change function signatures');
  lines.push('- Keep all existing functionality intact');

  lines.push('');
  lines.push('[OUTPUT]');
  lines.push('Return the refactored code with brief inline comments explaining significant changes.');
  lines.push('Do not return the full file.');
  lines.push('Do not add any explanation outside the code block.');

  return lines.join('\n');
}
