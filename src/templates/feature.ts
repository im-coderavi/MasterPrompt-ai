import type { PromptContext } from '../types';

export function featureTemplate(raw: string, ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push('[CONTEXT]');
  lines.push(`File: ${ctx.fileName} (${ctx.relativePath})`);
  lines.push(`Language: ${ctx.languageId}`);
  if (ctx.functionName) {
    lines.push(`Current location: ${ctx.functionName}()`);
  }

  lines.push('');
  lines.push('[TASK]');
  lines.push(`Add the following feature or functionality: "${raw}"`);
  if (ctx.taggedCode) {
    lines.push('Add the new code relative to the tagged block shown in [CODE] section.');
  } else if (ctx.functionName) {
    lines.push(`Add the new code in or near the ${ctx.functionName}() function.`);
  }

  if (ctx.taggedCode) {
    lines.push('');
    lines.push('[CODE]');
    lines.push(ctx.taggedCode);
  }

  lines.push('');
  lines.push('[SCOPE LOCK]');
  lines.push('- Do NOT modify any existing code unless absolutely necessary for integration');
  lines.push('- Do NOT remove, rename, or refactor existing functions, variables, or logic');
  lines.push('- Do NOT change existing imports unless adding a new required import');
  lines.push('- Mark all new code additions with a // NEW comment');
  lines.push('- Keep all existing functionality intact');
  if (ctx.taggedCode) {
    lines.push(`- If modifying the tagged block, preserve lines outside ${ctx.tagStartLine}–${ctx.tagEndLine}`);
  }

  lines.push('');
  lines.push('[OUTPUT]');
  lines.push('Return the modified code block showing the additions clearly.');
  lines.push('Mark each new addition with a // NEW comment.');
  lines.push('Do not return the full file.');
  lines.push('Do not add any explanation outside the code block.');

  return lines.join('\n');
}
