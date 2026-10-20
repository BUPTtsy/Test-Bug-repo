export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Todo', 'Done'];

export class ValidationError extends Error {
  constructor(message) {super(message); this.name = 'ValidationError';}
}
const fail = message => {throw new ValidationError(message);};

const entry = (id, title, status, priority, due, tags, assignee) => ({id, title, status, priority, due, tags, assignee});
export const seed = () => [
  entry(1, 'Write project brief', 'Todo', 'High', '2026-01-15', ['docs'], 'Alice'),
  entry(2, 'Review navigation flow', 'Todo', 'Medium', '2099-03-01', ['design', 'ux'], 'Bob'),
  entry(3, 'Prepare release checklist', 'Done', 'High', '2026-01-10', ['release'], null),
  entry(4, 'Update design tokens', 'Todo', 'Low', '2099-05-20', ['design'], null),
  entry(5, 'Schedule user interviews', 'Todo', 'Medium', '2026-02-01', ['research'], 'Carol'),
  entry(6, 'Archive old notes', 'Done', 'Low', null, [], null),
  entry(7, 'Fix login redirect', 'Todo', 'High', '2026-03-12', ['bug', 'auth'], 'Bob'),
  entry(8, 'Draft onboarding emails', 'Todo', 'Medium', '2099-01-01', ['marketing'], 'Alice'),
  entry(9, 'Audit accessibility labels', 'Todo', 'High', '2099-02-14', ['a11y'], null),
  entry(10, 'Plan Q4 roadmap', 'Todo', 'Medium', '2099-09-30', ['planning'], 'Carol'),
  entry(11, 'Clean up CI cache', 'Done', 'Low', '2026-01-05', ['infra'], 'Dave'),
  entry(12, 'Translate release notes', 'Todo', 'Low', null, ['i18n', 'docs'], null),
  entry(13, 'Review security checklist', 'Todo', 'High', '2026-04-01', ['security'], 'Dave'),
];

export function validateTitle(title) {
  if (typeof title !== 'string' || !title.trim()) fail('Title is required');
  if (title.trim().length > 120) fail('Title is too long');
  return title.trim();
}
export function validatePriority(value) {
  if (!PRIORITIES.includes(value)) fail('Invalid priority');
  return value;
}
export function validateDue(value) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Invalid due date');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) fail('Invalid due date');
  return value;
}
export function validateTags(value) {
  if (!Array.isArray(value) || value.length > 5) fail('Invalid tags');
  const tags = value.map(tag => {
    if (typeof tag !== 'string' || !tag.trim() || tag.trim().length > 20) fail('Invalid tags');
    return tag.trim();
  });
  return [...new Set(tags)];
}
function normalizeAssignee(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') fail('Invalid assignee');
  return value.trim().slice(0, 40) || null;
}

export function createTask(id, fields) {
  return {
    id, title: validateTitle(fields.title), status: 'Todo',
    priority: 'priority' in fields ? validatePriority(fields.priority) : 'Medium',
    due: 'due' in fields ? validateDue(fields.due) : null,
    tags: 'tags' in fields ? validateTags(fields.tags) : [],
    assignee: normalizeAssignee(fields.assignee),
  };
}

export function applyFields(task, fields) {
  const next = {...task};
  if ('title' in fields) next.title = validateTitle(fields.title);
  if ('status' in fields) {
    if (!STATUSES.includes(fields.status)) fail('Invalid status');
    next.status = fields.status;
  }
  if ('priority' in fields) next.priority = validatePriority(fields.priority);
  if ('due' in fields) next.due = validateDue(fields.due);
  if ('tags' in fields) next.tags = validateTags(fields.tags);
  if ('assignee' in fields) next.assignee = normalizeAssignee(fields.assignee);
  return next;
}

export function completeTasks(tasks, ids) {
  if (!Array.isArray(ids) || ids.some(id => !Number.isInteger(id))) fail('ids must be an array of task ids');
  const selected = new Set(ids);
  return tasks.map(task => selected.has(task.id) ? {...task, status: 'Done'} : task);
}
