import type { PromptContext } from '../types';

export function bugfixTemplate(raw: string, ctx: PromptContext): string {
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
  } else {
    lines.push('No active errors detected');
  }
  if (ctx.activeWarnings.length > 0) {
    lines.push(`Active warnings:`);
    ctx.activeWarnings.forEach(w => lines.push(`  - ${w}`));
  }

  lines.push('');
  lines.push('[TASK]');
  lines.push(`Fix ONLY the specific bug described: "${raw}"`);
  if (ctx.taggedCode) {
    lines.push('Work ONLY on the tagged code block shown in [CODE] section.');
  } else {
    lines.push('Work on the function at the cursor position.');
  }

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
  lines.push('- Do NOT rename any variables, parameters, or function names');
  lines.push('- Do NOT change the function signature or return type');
  lines.push('- Do NOT refactor or restructure logic that is not directly related to this bug');
  lines.push('- Do NOT add any imports unless they are required for this specific fix');
  lines.push('- Do NOT add comments unless explaining the fix itself');

  lines.push('');
  lines.push('[OUTPUT]');
  lines.push('Return ONLY the corrected code block.');
  lines.push('Add a single inline comment on the changed line explaining the fix.');
  lines.push('Do not return the full file.');
  lines.push('Do not add any explanation outside the code block.');

  return lines.join('\n');
}
