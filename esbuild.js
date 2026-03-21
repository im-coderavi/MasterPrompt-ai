const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const extensionCtx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
    target: 'es2022',
  });

  const cliCtx = await esbuild.context({
    entryPoints: ['src/cli.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/cli.js',
    logLevel: 'info',
    target: 'es2022',
    banner: {
      js: '#!/usr/bin/env node',
    },
  });

  if (watch) {
    await extensionCtx.watch();
    await cliCtx.watch();
    console.log('Watching for changes...');
  } else {
    await extensionCtx.rebuild();
    await cliCtx.rebuild();
    await extensionCtx.dispose();
    await cliCtx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
