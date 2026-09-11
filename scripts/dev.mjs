import {spawn} from 'node:child_process';
const app=spawn(process.execPath,['server/index.mjs'],{stdio:'inherit'});
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js'],{stdio:'inherit'});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{app.kill(sig);vite.kill(sig);});
