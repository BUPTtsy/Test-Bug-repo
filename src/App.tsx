import {FormEvent, useEffect, useRef, useState} from 'react';
import {createTask, loadTasks, removeTask, Task, updateTask} from './api';
import './style.css';

const PAGE_SIZE = 4;
export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const refresh = async () => {setTasks(await loadTasks());};
  useEffect(() => {refresh().catch(e => setError(String(e.message)));}, []);
  useEffect(() => {
    if (editing) {setDraft(editing.title); dialog.current?.showModal();}
    else dialog.current?.close();
  }, [editing]);
  const filtered = tasks.filter(t => (filter === 'All' || t.status === filter) && t.title.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {if(page >= pages) setPage(pages - 1);}, [page, pages]);
  async function action(work: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError('');
    try {await work(); await refresh();} catch(e) {setError(e instanceof Error ? e.message : '请求失败');}
    finally {setBusy(false);}
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {setError('Title is required'); return;}
    await action(async () => {await createTask(title.trim()); setTitle(''); setPage(0);});
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) {setError('Title is required'); return;}
    if (editing) await action(async () => {await updateTask(editing.id, {title: draft.trim()}); setEditing(null);});
  }
  return <div className="shell">
    <aside><div className="brand"><span className="mark">B</span> BugBoard</div><div className="workspace">TRACEFIX 工作区</div><nav aria-label="主导航"><a aria-current="page" href="/">▦ 任务</a></nav><div className="aside-note">一个小小的看板。<br/>每一次改动都很重要。</div><span className="local">● 本地沙箱</span></aside>
    <main><header><div><p className="eyebrow">团队协同，一目了然</p><h1>Task board</h1><p className="muted">让进度清晰可见，让细节井井有条。</p></div><button aria-label="刷新任务列表" onClick={() => action(refresh)} disabled={busy}>↻ 刷新</button></header>
      <section className="stats" aria-label="看板概览"><div><span>任务总数</span><strong>{tasks.length}</strong></div><div><span>进行中</span><strong>{tasks.filter(t=>t.status==='Todo').length}</strong></div><div><span>已完成</span><strong>{tasks.filter(t=>t.status==='Done').length}</strong></div></section>
      <section className="board"><div className="section-head"><h2>全部任务</h2><span>共 {filtered.length} 个任务</span></div>
        <form className="new-task" onSubmit={add}><label className="sr" htmlFor="new-title">New task title</label><input id="new-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="需要完成什么？" maxLength={120}/><button className="primary" disabled={busy}>Add task</button></form>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="toolbar"><div className="tabs" role="group" aria-label="筛选任务">{['All','Todo','Done'].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>{setFilter(f);setPage(0);}}>{f==='All'?'全部':f}</button>)}</div><label className="search"><span className="sr">Search tasks</span><input aria-label="Search tasks" placeholder="搜索任务…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label></div>
        <ul className="tasks">{filtered.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE).map(task=><li key={task.id}>
          <input type="checkbox" aria-label={`Complete ${task.title}`} checked={task.status==='Done'} disabled={busy} onChange={()=>action(()=>updateTask(task.id,{status:task.status==='Todo'?'Done':'Todo'}))}/>
          <div className="task-title"><span className={task.status==='Done'?'done':''}>{task.title}</span><small>BOARD-{String(task.id).padStart(3,'0')}</small></div><span className={`badge ${task.status.toLowerCase()}`}>{task.status==='Done'?'已完成':'待办'}</span>
          <button aria-label={`Edit ${task.title}`} onClick={()=>setEditing(task)}>编辑</button><button className="delete" aria-label={`Delete ${task.title}`} disabled={busy} onClick={()=>action(()=>removeTask(task.id))}>删除</button>
        </li>)}</ul>
        {filtered.length===0 && <p className="empty" role="status">未找到任务</p>}
        <footer><span role="status">第 {page+1} 页，共 {pages} 页</span><div><button disabled={page===0} onClick={()=>setPage(page-1)}>上一页</button><button disabled={page+1>=pages} onClick={()=>setPage(page+1)}>下一页</button></div></footer>
      </section><p className="footnote">改动会保存在此沙箱中，可以放心刷新浏览器。</p>
      <dialog ref={dialog} onCancel={()=>setEditing(null)} aria-labelledby="edit-heading"><form onSubmit={save}><h2 id="edit-heading">编辑任务</h2><label htmlFor="edit-title">Task title</label><input id="edit-title" value={draft} onChange={e=>setDraft(e.target.value)} autoFocus maxLength={120}/><div className="dialog-actions"><button type="button" onClick={()=>setEditing(null)}>Cancel</button><button className="primary" disabled={busy}>Save changes</button></div></form></dialog>
    </main>
  </div>;
}
