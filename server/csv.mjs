// 任务导出为 CSV。
const COLUMNS = ['id', 'title', 'status', 'priority', 'due', 'assignee', 'tags'];
const cell = value => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text}"` : text;
};

export function toCsv(tasks) {
  const rows = tasks.map(task => [task.id, task.title, task.status, task.priority, task.due, task.assignee.trim(), task.tags.join(';')]);
  return [COLUMNS, ...rows].map(row => row.map(cell).join(',')).join('\n') + '\n';
}
