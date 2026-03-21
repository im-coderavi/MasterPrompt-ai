import { KEYWORD_MAP } from './constants';
import {
  bugfixTemplate,
  refactorTemplate,
  featureTemplate,
  testsTemplate,
  securityTemplate,
  explainTemplate,
  generalTemplate,
} from './templates/index';
import type { Mode, PromptContext } from './types';

export type { Mode, PromptContext };

const TEMPLATE_MAP: Record<Mode, (raw: string, ctx: PromptContext) => string> = {
  bugfix: bugfixTemplate,
  refactor: refactorTemplate,
  feature: featureTemplate,
  tests: testsTemplate,
  security: securityTemplate,
  explain: explainTemplate,
  general: generalTemplate,
};

export class PromptEngine {

  /**
   * Detect the mode/intent from a raw prompt using keyword matching.
   * Returns the first matching mode, or 'general' as fallback.
   */
  detect(rawPrompt: string): Mode {
    const lower = rawPrompt.toLowerCase();
    for (const [mode, keywords] of Object.entries(KEYWORD_MAP)) {
      if (mode === 'general') { continue; }
      if (keywords.some((kw: string) => lower.includes(kw))) {
        return mode as Mode;
      }
    }
    return 'general';
  }

  /**
   * Enhance a raw prompt using the selected mode template + context.
   * Pure synchronous — zero async, zero network.
   */
  enhance(rawPrompt: string, context: PromptContext, mode: Mode): string {
    const templateFn = TEMPLATE_MAP[mode];
    return templateFn(rawPrompt, context);
  }
}
