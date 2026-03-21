import type { PromptContext } from '../types';

export function securityTemplate(raw: string, ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push('[CONTEXT]');
  lines.push(`File: ${ctx.fileName} (${ctx.relativePath})`);
  lines.push(`Language: ${ctx.languageId}`);
  if (ctx.functionName) {
    lines.push(`Function: ${ctx.functionName}()`);
  }

  lines.push('');
  lines.push('[TASK]');
  lines.push(`Perform a security review as described: "${raw}"`);
  if (ctx.taggedCode) {
    lines.push('Analyze the tagged code block shown in [CODE] section for security issues.');
  } else if (ctx.functionName) {
    lines.push(`Analyze the ${ctx.functionName}() function for security issues.`);
  }

  if (ctx.taggedCode) {
    lines.push('');
    lines.push('[CODE]');
    lines.push(ctx.taggedCode);
  }

  lines.push('');
  lines.push('[SCOPE LOCK]');
  lines.push('- Do NOT refactor or restructure any code');
  lines.push('- Do NOT make performance optimizations');
  lines.push('- Focus ONLY on security vulnerabilities and fixes');
  lines.push('- Do NOT change any logic that is not directly related to security');
  lines.push('- Preserve all existing functionality');

  lines.push('');
  lines.push('[OUTPUT]');
  lines.push('Return a numbered list of security vulnerabilities found.');
  lines.push('For each vulnerability, include:');
  lines.push('  1. Severity (Critical / High / Medium / Low)');
  lines.push('  2. Description of the vulnerability');
  lines.push('  3. The specific line(s) affected');
  lines.push('  4. Recommended fix with code snippet');
  lines.push('If no vulnerabilities found, state that explicitly.');

  return lines.join('\n');
}
