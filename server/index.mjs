import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {seed, validateTitle, applyFields} from './tasks.mjs';

const dataFile = process.env.BUGBOARD_DATA || path.join(os.tmpdir(), 'tracefix-bugboard-data.json');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
let tasks = seed();
try {tasks = JSON.parse(await fs.readFile(dataFile, 'utf8'));} catch {}
const persist = () => fs.writeFile(dataFile, JSON.stringify(tasks));
let mutation = Promise.resolve();
async function body(req) {
  let raw = '';for await (const c of req) {raw += c;if(raw.length > 10000) throw new Error('Body too large');}
  return JSON.parse(raw || '{}');
}
function send(res, status, value) {res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') return send(res, 200, {ok:true});
    if (url.pathname === '/version') return send(res, 200, {source_manifest:process.env.TRACEFIX_SOURCE || 'manual-development'});
    if (url.pathname === '/__reset' && req.method === 'POST') {tasks=seed();await persist();return send(res,200,{ok:true});}
    if (url.pathname === '/api/tasks' && req.method === 'GET') return send(res,200,tasks);
    if (url.pathname === '/api/tasks' && req.method === 'POST') {
      const fields = await body(req);const title = validateTitle(fields.title);
      mutation = mutation.then(async () => {const task={id:Math.max(0,...tasks.map(t=>t.id))+1,title,status:'Todo'};tasks=[task,...tasks];await persist();send(res,201,task);});
      await mutation;return;
    }
    const match = url.pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (match) {
      const task = tasks.find(t=>t.id===Number(match[1]));if(!task) return send(res,404,{error:'Task not found'});
      if(req.method==='GET') return send(res,200,task);
      if(req.method==='PATCH') {const next=applyFields(task,await body(req));tasks=tasks.map(t=>t.id===task.id?next:t);await persist();return send(res,200,next);}
      if(req.method==='DELETE') {tasks=tasks.filter(t=>t.id!==task.id);await persist();return send(res,200,{ok:true});}
    }
    if (url.pathname.startsWith('/api/')) return send(res,404,{error:'Endpoint not found'});
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if(!file.startsWith(root+path.sep)) return send(res,403,{error:'Forbidden'});
    const content=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(content);
  } catch(e) {if(!res.headersSent)send(res,e.code==='ENOENT'?404:400,{error:e.message});}
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0');
