import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {seed, createTask, applyFields, completeTasks, ValidationError} from './tasks.mjs';
import {filterTasks, sortTasks, paginate, summarize} from './query.mjs';
import {toCsv} from './csv.mjs';
import {loadSettings} from './config.mjs';

const dataFile = process.env.BUGBOARD_DATA || path.join(os.tmpdir(), 'tracefix-bugboard-data.json');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const settings = loadSettings();
const defaults = {priority: 'Medium', due: null, tags: [], assignee: null};
let tasks = seed();
try {tasks = JSON.parse(await fs.readFile(dataFile, 'utf8')).map(task => ({...defaults, ...task}));} catch {}
const persist = () => fs.writeFile(dataFile, JSON.stringify(tasks));
let mutation = Promise.resolve();
async function body(req) {
  let raw = '';for await (const c of req) {raw += c;if(raw.length > 10000) throw new ValidationError('Body too large');}
  return JSON.parse(raw || '{}');
}
function send(res, status, value) {res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
const intParam = (value, fallback, min, max) => {
  const number = Number.parseInt(value ?? '', 10);
  return Number.isInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
const nextId = () => Math.max(0, ...tasks.map(t => t.id)) + 1;

const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') return send(res, 200, {ok:true});
    if (url.pathname === '/version') return send(res, 200, {source_manifest:process.env.TRACEFIX_SOURCE || 'manual-development'});
    if (url.pathname === '/__reset' && req.method === 'POST') {tasks=seed();await persist();return send(res,200,{ok:true});}
    if (url.pathname === '/api/settings' && req.method === 'GET') return send(res, 200, settings);
    if (url.pathname === '/api/stats' && req.method === 'GET') return send(res, 200, summarize(tasks));
    if (url.pathname === '/api/export.csv' && req.method === 'GET') {
      if (!settings.exportEnabled) return send(res, 404, {error:'Export disabled'});
      const csv = toCsv(sortTasks(tasks, 'newest'));
      res.writeHead(200, {'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tasks.csv"','Cache-Control':'no-store'});
      return res.end(csv);
    }
    if (url.pathname === '/api/tasks' && req.method === 'GET') {
      const p = url.searchParams;
      const visible = sortTasks(filterTasks(tasks, {status:p.get('status'), priority:p.get('priority'), q:p.get('q')}), p.get('sort') || 'newest');
      return send(res, 200, paginate(visible, intParam(p.get('page'), 0, 0, 10000), intParam(p.get('pageSize'), settings.pageSize, 1, 50)));
    }
    if (url.pathname === '/api/tasks' && req.method === 'POST') {
      const fields = await body(req);
      const created = mutation.then(async () => {const task=createTask(nextId(), fields);tasks=[task,...tasks];await persist();return task;});
      mutation = created.catch(() => {});
      return send(res, 201, await created);
    }
    if (url.pathname === '/api/tasks/bulk-complete' && req.method === 'POST') {
      const {ids} = await body(req);
      const next = completeTasks(tasks, ids);
      const updated = next.filter((task, index) => task !== tasks[index]).length;
      tasks = next;
      await persist();return send(res, 200, {updated});
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
  } catch(e) {
    if(res.headersSent) return;
    const status = e.code==='ENOENT' ? 404 : e instanceof ValidationError || e instanceof SyntaxError ? 400 : 500;
    send(res, status, {error:e.message});
  }
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0');
