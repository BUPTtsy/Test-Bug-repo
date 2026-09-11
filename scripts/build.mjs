import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
await fs.mkdir('dist', {recursive:true});
await esbuild.build({entryPoints:['src/main.tsx'],bundle:true,outfile:'dist/app.js',format:'esm',jsx:'automatic',nodePaths:[process.env.NODE_PATH || 'node_modules'],minify:true});
await fs.writeFile('dist/index.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BugBoard</title><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
