// 列表查询：筛选、排序、分页与统计。页码从 0 开始。
const PRIORITY_RANK = {High: 0, Medium: 1, Low: 2};

export function filterTasks(tasks, {status, priority, q} = {}) {
  const needle = (q || '').trim().toLowerCase();
  return tasks.filter(task =>
    (!status || status === 'All' || task.status === status) &&
    (!priority || priority === 'All' || task.priority === priority) &&
    (!needle || task.title.toLowerCase().includes(needle) || task.tags.some(tag => tag.toLowerCase().includes(needle))));
}

export function sortTasks(tasks, sort = 'newest') {
  const list = [...tasks];
  if (sort === 'priority') return list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  if (sort === 'due') return list.sort((a, b) => (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31'));
  if (sort === 'title') return list.sort((a, b) => a.title.localeCompare(b.title));
  return list.sort((a, b) => b.id - a.id);
}

export function paginate(items, page, pageSize) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return {items: items.slice(page * pageSize, (page + 1) * pageSize), total, page, pages, pageSize};
}

export function summarize(tasks, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const byPriority = {Low: 0, Medium: 0, High: 0};
  let done = 0, overdue = 0;
  for (const task of tasks) {
    byPriority[task.priority] += 1;
    if (task.status === 'Done') done += 1;
    if (task.status !== 'Done' && task.due && task.due < today) overdue += 1;
  }
  return {total: tasks.length, todo: tasks.length - done, done, overdue, byPriority};
}
