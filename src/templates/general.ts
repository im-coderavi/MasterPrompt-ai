import type { PromptContext } from '../types';

export function generalTemplate(raw: string, ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push('[CONTEXT]');
  lines.push(`File: ${ctx.fileName} (${ctx.relativePath})`);
  lines.push(`Language: ${ctx.languageId}`);
  if (ctx.functionName) {
    lines.push(`Function: ${ctx.functionName}()`);
  }
  if (ctx.activeErrors.length > 0) {
    lines.push(`Active errors:`);
    ctx.activeErrors.forEach(e => lines.push(`  - ${e}`));
  }

  lines.push('');
  lines.push('[TASK]');
  lines.push(`"${raw}"`);
  if (ctx.taggedCode) {
    lines.push('Apply this task to the tagged code block shown in [CODE] section.');
  } else if (ctx.functionName) {
    lines.push(`Apply this task in the context of the ${ctx.functionName}() function.`);
  }

  if (ctx.taggedCode) {
    lines.push('');
    lines.push('[CODE]');
    lines.push(ctx.taggedCode);
  }

  lines.push('');
  lines.push('[SCOPE LOCK]');
  lines.push('- Do NOT change unrelated code');
  lines.push('- Do NOT rename existing variables or functions unless specifically asked');
  lines.push('- Do NOT restructure code that is not directly related to the task');
  if (ctx.taggedCode) {
    lines.push(`- Limit changes to lines ${ctx.tagStartLine}–${ctx.tagEndLine}`);
  }

  lines.push('');
  lines.push('[OUTPUT]');
  lines.push('Return ONLY the changed parts of the code.');
  lines.push('Do not return the full file.');
  lines.push('Include brief inline comments on changed lines.');

  return lines.join('\n');
}
