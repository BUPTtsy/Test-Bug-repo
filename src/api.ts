export interface Task { id: number; title: string; status: 'Todo' | 'Done'; }

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {...options, headers: {'Content-Type': 'application/json', ...options.headers}});
  if (!response.ok) throw new Error((await response.json()).error || '请求失败');
  return response.json();
}
export const loadTasks = () => request<Task[]>('/api/tasks');
export const createTask = (title: string) => request<Task>('/api/tasks', {method: 'POST', body: JSON.stringify({title})});
export const updateTask = (id: number, fields: Partial<Task>) => request<Task>(`/api/tasks/${id}`, {method: 'PATCH', body: JSON.stringify(fields)});
export const removeTask = (id: number) => request<{ok: boolean}>(`/api/tasks/${id}`, {method: 'DELETE'});
