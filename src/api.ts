export type Status = 'Todo' | 'Done';
export type Priority = 'Low' | 'Medium' | 'High';
export interface Task { id: number; title: string; status: Status; priority: Priority; due: string | null; tags: string[]; assignee: string | null; }
export interface TaskPage { items: Task[]; total: number; page: number; pages: number; pageSize: number; }
export interface Stats { total: number; todo: number; done: number; overdue: number; byPriority: Record<Priority, number>; }
export interface TaskQuery { status: string; priority: string; q: string; sort: string; page: number; }
export interface NewTask { title: string; priority: Priority; due: string | null; tags: string[]; assignee: string; }

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {...options, headers: {'Content-Type': 'application/json', ...options.headers}});
  if (!response.ok) throw new Error((await response.json()).error || '请求失败');
  return response.json();
}
export const loadTasks = (query: TaskQuery) => {
  const params = new URLSearchParams({status: query.status, priority: query.priority, q: query.q, sort: query.sort, page: String(query.page)});
  return request<TaskPage>(`/api/tasks?${params}`);
};
export const loadStats = () => request<Stats>('/api/stats');
export const createTask = (task: NewTask) => request<Task>('/api/tasks', {method: 'POST', body: JSON.stringify(task)});
export const updateTask = (id: number, fields: Partial<Task>) => request<Task>(`/api/tasks/${id}`, {method: 'PATCH', body: JSON.stringify(fields)});
export const removeTask = (id: number) => request<{ok: boolean}>(`/api/tasks/${id}`, {method: 'DELETE'});
export const completeTasks = (ids: number[]) => request<{updated: number}>('/api/tasks/bulk-complete', {method: 'POST', body: JSON.stringify({ids})});
