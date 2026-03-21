import { PromptEngine, type Mode, type PromptContext } from './promptEngine';

const HELP_TEXT = `PromptMaster CLI

Usage:
  avishek "your raw prompt"
  echo "your raw prompt" | avishek

Options:
  --mode <mode>   Force mode: bugfix|refactor|feature|tests|security|explain|general
  --json          Output JSON with mode + enhanced text
  -h, --help      Show this help
`;

const VALID_MODES: Set<Mode> = new Set([
  'bugfix',
  'refactor',
  'feature',
  'tests',
  'security',
  'explain',
  'general',
]);

function defaultContext(): PromptContext {
  return {
    fileName: 'terminal-input.txt',
    relativePath: '.',
    languageId: 'plaintext',
    functionName: null,
    activeErrors: [],
    activeWarnings: [],
    selectedText: null,
    taggedCode: null,
    tagStartLine: null,
    tagEndLine: null,
  };
}

function parseArgs(argv: string[]): { prompt: string; mode?: Mode; json: boolean; help: boolean } {
  let mode: Mode | undefined;
  let json = false;
  let help = false;
  const promptParts: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      help = true;
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--mode') {
      const next = argv[i + 1];
      if (!next || !VALID_MODES.has(next as Mode)) {
        throw new Error('Invalid mode. Use one of: bugfix, refactor, feature, tests, security, explain, general');
      }
      mode = next as Mode;
      i += 1;
      continue;
    }
    promptParts.push(arg);
  }

  return { prompt: promptParts.join(' ').trim(), mode, json, help };
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.trim());
    });
    process.stdin.resume();
  });
}

async function main(): Promise<void> {
  const { prompt: argPrompt, mode, json, help } = parseArgs(process.argv.slice(2));

  if (help) {
    process.stdout.write(`${HELP_TEXT}\n`);
    return;
  }

  const stdinPrompt = process.stdin.isTTY ? '' : await readStdin();
  const prompt = argPrompt || stdinPrompt;

  if (!prompt) {
    process.stderr.write('No prompt provided. Pass text as argument or via stdin.\n');
    process.stderr.write('Try: avishek --help\n');
    process.exit(1);
    return;
  }

  const engine = new PromptEngine();
  const detectedMode = mode ?? engine.detect(prompt);
  const enhanced = engine.enhance(prompt, defaultContext(), detectedMode);

  if (json) {
    process.stdout.write(`${JSON.stringify({ mode: detectedMode, enhanced }, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${enhanced}\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
