import {spawn} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const apiPort = Number(process.env.PORT || 3001);
const webPort = Number(process.env.VITE_PORT || 5174);
const childEnv = {...process.env, PORT: String(apiPort), BUGBOARD_DATA: process.env.BUGBOARD_DATA || path.join(os.tmpdir(), 'tracefix-bugboard-target-data.json')};
const app = spawn(process.execPath, ['server/index.mjs'], {stdio: 'inherit', env: childEnv});
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(webPort)], {stdio: 'inherit', env: childEnv});
const shutdown = signal => {app.kill(signal); vite.kill(signal);};
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal));
app.on('exit', (code, signal) => {if (!signal && code && !vite.killed) vite.kill();});
vite.on('exit', (code, signal) => {if (!signal && code && !app.killed) app.kill();});
