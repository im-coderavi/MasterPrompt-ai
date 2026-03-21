import type { PromptContext } from '../types';

export function testsTemplate(raw: string, ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push('[CONTEXT]');
  lines.push(`File: ${ctx.fileName} (${ctx.relativePath})`);
  lines.push(`Language: ${ctx.languageId}`);
  if (ctx.functionName) {
    lines.push(`Function to test: ${ctx.functionName}()`);
  }

  lines.push('');
  lines.push('[TASK]');
  lines.push(`Write tests as described: "${raw}"`);
  if (ctx.taggedCode) {
    lines.push('Write tests for the tagged code block shown in [CODE] section.');
  } else if (ctx.functionName) {
    lines.push(`Write tests for the ${ctx.functionName}() function.`);
  }

  if (ctx.taggedCode) {
    lines.push('');
    lines.push('[CODE]');
    lines.push(ctx.taggedCode);
  }

  lines.push('');
  lines.push('[SCOPE LOCK]');
  lines.push('- Do NOT modify the source function or any production code');
  lines.push('- Do NOT change the function signature or behavior');
  lines.push('- Do NOT add or remove functionality from the source code');
  lines.push('- Write tests using the existing test framework in the project');

  lines.push('');
  lines.push('[OUTPUT]');
  lines.push('Return ONLY the test code.');
  lines.push('Use the project\'s existing test framework conventions.');
  lines.push('Include tests for: happy path, edge cases, error cases.');
  lines.push('Each test should have a clear, descriptive name.');
  lines.push('Do not include any explanation outside the code block.');

  return lines.join('\n');
}
