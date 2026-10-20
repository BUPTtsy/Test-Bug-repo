import {FormEvent, useEffect, useRef, useState} from 'react';
import {completeTasks, createTask, loadStats, loadTasks, removeTask, Priority, Stats, Task, TaskPage, updateTask} from './api';
import './style.css';

const PRIORITY_LABEL: Record<Priority, string> = {Low: '低', Medium: '中', High: '高'};
const EMPTY_PAGE: TaskPage = {items: [], total: 0, page: 0, pages: 1, pageSize: 4};

export default function App() {
  const [data, setData] = useState<TaskPage>(EMPTY_PAGE);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [due, setDue] = useState('');
  const [tagText, setTagText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState('');
  const [draftPriority, setDraftPriority] = useState<Priority>('Medium');
  const [selected, setSelected] = useState<number[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);

  const refresh = async () => {
    const [next, summary] = await Promise.all([loadTasks({status: filter, priority: priorityFilter, q: query, sort, page}), loadStats()]);
    setData(next); setStats(summary);
  };
  useEffect(() => {refresh().catch(e => setError(String(e.message)));}, [filter, priorityFilter, sort, query, page]);
  useEffect(() => {
    if (editing) {setDraft(editing.title); setDraftPriority(editing.priority); dialog.current?.showModal();}
    else dialog.current?.close();
  }, [editing]);
  useEffect(() => {if (data.page >= data.pages) setPage(data.pages - 1);}, [data.page, data.pages]);

  async function action(work: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError('');
    try {await work(); await refresh();} catch(e) {setError(e instanceof Error ? e.message : '请求失败');}
    finally {setBusy(false);}
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {setError('Title is required'); return;}
    const tags = tagText.split(',').filter(Boolean);
    await action(async () => {
      await createTask({title: title.trim(), priority, due: due || null, tags, assignee});
      setTitle(''); setTagText(''); setDue(''); setAssignee(''); setPage(0);
    });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) {setError('Title is required'); return;}
    if (editing) await action(async () => {await updateTask(editing.id, {title: draft.trim(), priority: draftPriority}); setEditing(null);});
  }
  async function finishSelected() {
    await action(async () => {await completeTasks(selected); setSelected([]);});
  }
  function toggleSelected(id: number) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  function exportCsv() {window.location.href = '/api/export.csv';}

  return <div className="shell">
    <aside><div className="brand"><span className="mark">B</span> BugBoard</div><div className="workspace">TRACEFIX 工作区</div><nav aria-label="主导航"><a aria-current="page" href="/">▦ 任务</a></nav><div className="aside-note">一个小小的看板。<br/>每一次改动都很重要。</div><span className="local">● 本地沙箱</span></aside>
    <main><header><div><p className="eyebrow">团队协同，一目了然</p><h1>Task board</h1><p className="muted">让进度清晰可见，让细节井井有条。</p></div><div className="header-actions"><button onClick={exportCsv}>导出 CSV</button><button aria-label="刷新任务列表" onClick={() => action(refresh)} disabled={busy}>↻ 刷新</button></div></header>
      <section className="stats" aria-label="看板概览"><div><span>任务总数</span><strong>{stats?.total ?? 0}</strong></div><div><span>进行中</span><strong>{stats?.todo ?? 0}</strong></div><div><span>已完成</span><strong>{stats?.done ?? 0}</strong></div><div><span>已逾期</span><strong>{stats?.overdue ?? 0}</strong></div></section>
      <section className="board"><div className="section-head"><h2>全部任务</h2><span>共 {data.total} 个任务</span></div>
        <form className="new-task" onSubmit={add}>
          <label className="sr" htmlFor="new-title">New task title</label>
          <input id="new-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="需要完成什么？" maxLength={120}/>
          <select value={priority} onChange={e=>setPriority(e.target.value as Priority)}><option value="Low">低</option><option value="Medium">中</option><option value="High">高</option></select>
          <input type="date" value={due} onChange={e=>setDue(e.target.value)}/>
          <input placeholder="标签，用逗号分隔" value={tagText} onChange={e=>setTagText(e.target.value)}/>
          <input placeholder="负责人" value={assignee} onChange={e=>setAssignee(e.target.value)}/>
          <button className="primary" disabled={busy}>Add task</button>
        </form>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="toolbar">
          <div className="tabs" role="group" aria-label="筛选任务">{['All','Todo','Done'].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>{setFilter(f);setPage(0);}}>{f==='All'?'全部':f}</button>)}</div>
          <label className="search"><span className="sr">Search tasks</span><input aria-label="Search tasks" placeholder="搜索任务…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
          <div className="filters">
            <label className="sr" htmlFor="priority-filter">按优先级筛选</label>
            <select id="priority-filter" value={priorityFilter} onChange={e=>{setPriorityFilter(e.target.value);setPage(0);}}><option value="All">全部优先级</option><option value="High">高</option><option value="Medium">中</option><option value="Low">低</option></select>
            <label className="sr" htmlFor="sort-by">排序方式</label>
            <select id="sort-by" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">最新</option><option value="priority">优先级</option><option value="due">截止日期</option><option value="title">标题</option></select>
          </div>
        </div>
        {selected.length > 0 && <div className="bulk"><span>已选 {selected.length} 项</span><button className="primary" disabled={busy} onClick={finishSelected}>批量完成</button></div>}
        <ul className="tasks">{data.items.map(task=><li key={task.id}>
          <input type="checkbox" aria-label={`Select ${task.title}`} checked={selected.includes(task.id)} onChange={()=>toggleSelected(task.id)}/>
          <input type="checkbox" aria-label={`Complete ${task.title}`} checked={task.status==='Done'} disabled={busy} onChange={()=>action(()=>updateTask(task.id,{status:task.status==='Todo'?'Done':'Todo'}))}/>
          <div className="task-title"><span className={task.status==='Done'?'done':''}>{task.title}</span><small>BOARD-{String(task.id).padStart(3,'0')}{task.due ? ` · 截止 ${task.due}` : ''}{task.assignee ? ` · ${task.assignee}` : ''}</small>
            {task.tags.length > 0 && <div className="tags">{task.tags.map((tag, index)=><span className="tag" key={index}>{tag}</span>)}</div>}</div>
          <span className={`badge priority-${task.priority.toLowerCase()}`}>{PRIORITY_LABEL[task.priority]}</span>
          <span className={`badge ${task.status.toLowerCase()}`}>{task.status==='Done'?'已完成':'待办'}</span>
          <button aria-label={`Edit ${task.title}`} onClick={()=>setEditing(task)}>编辑</button><button className="delete" aria-label={`Delete ${task.title}`} disabled={busy} onClick={()=>action(()=>removeTask(task.id))}>删除</button>
        </li>)}</ul>
        <footer><span role="status">第 {data.page+1} 页，共 {data.pages} 页</span><div><button disabled={page===0} onClick={()=>setPage(page-1)}>上一页</button><button disabled={page+1>=data.pages} onClick={()=>setPage(page+1)}>下一页</button></div></footer>
      </section><p className="footnote">改动会保存在此沙箱中，可以放心刷新浏览器。</p>
      <dialog ref={dialog} onCancel={()=>setEditing(null)} aria-labelledby="edit-heading"><form onSubmit={save}><h2 id="edit-heading">编辑任务</h2><label htmlFor="edit-title">Task title</label><input id="edit-title" value={draft} onChange={e=>setDraft(e.target.value)} autoFocus maxLength={120}/><label htmlFor="edit-priority">优先级</label><select id="edit-priority" value={draftPriority} onChange={e=>setDraftPriority(e.target.value as Priority)}><option value="Low">低</option><option value="Medium">中</option><option value="High">高</option></select><div className="dialog-actions"><button type="button" onClick={()=>setEditing(null)}>Cancel</button><button className="primary" disabled={busy}>Save changes</button></div></form></dialog>
    </main>
  </div>;
}
