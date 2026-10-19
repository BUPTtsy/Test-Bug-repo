import test from 'node:test';
import assert from 'node:assert/strict';
import {seed, validateTitle, validateDue, validateTags, createTask, applyFields, ValidationError} from '../server/tasks.mjs';
import {filterTasks, sortTasks, paginate} from '../server/query.mjs';
import {loadSettings} from '../server/config.mjs';

test('seed is deterministic and isolated', () => {const a = seed(); a.pop(); assert.equal(seed().length, 13);});
test('seed ids are unique', () => assert.equal(new Set(seed().map(t => t.id)).size, 13));
test('title validation rejects blank input', () => {assert.throws(() => validateTitle('   '), ValidationError); assert.equal(validateTitle(' A '), 'A');});
test('due date validation accepts real dates only', () => {
  assert.equal(validateDue('2026-02-28'), '2026-02-28');
  assert.equal(validateDue(null), null);
  assert.throws(() => validateDue('2026-02-30'), ValidationError);
  assert.throws(() => validateDue('tomorrow'), ValidationError);
});
test('tags are trimmed, de-duplicated and bounded', () => {
  assert.deepEqual(validateTags([' a ', 'a', 'b']), ['a', 'b']);
  assert.throws(() => validateTags(['1', '2', '3', '4', '5', '6']), ValidationError);
  assert.throws(() => validateTags('docs'), ValidationError);
});
test('createTask applies defaults', () => {
  const task = createTask(20, {title: ' New '});
  assert.deepEqual(task, {id: 20, title: 'New', status: 'Todo', priority: 'Medium', due: null, tags: [], assignee: null});
});
test('patch preserves unrelated task fields', () => {const t = seed()[0]; const p = applyFields(t, {status: 'Done'}); assert.equal(p.title, t.title); assert.equal(p.status, 'Done'); assert.equal(t.status, 'Todo');});
test('status rejects out-of-contract values', () => assert.throws(() => applyFields(seed()[0], {status: 'hidden'}), ValidationError));
test('patch updates the due date', () => assert.equal(applyFields(seed()[0], {due: '2026-05-05'}).due, '2026-05-05'));
test('filter by status and priority', () => {
  assert.deepEqual(filterTasks(seed(), {status: 'Done'}).map(t => t.id), [3, 6, 11]);
  assert.equal(filterTasks(seed(), {priority: 'High'}).length, 5);
  assert.equal(filterTasks(seed(), {status: 'All', priority: 'All'}).length, 13);
});
test('search matches titles', () => assert.deepEqual(filterTasks(seed(), {q: 'Review'}).map(t => t.id), [2, 13]));
test('sort by title and newest', () => {
  assert.equal(sortTasks(seed(), 'title')[0].title, 'Archive old notes');
  assert.equal(sortTasks(seed(), 'newest')[0].id, 13);
});
test('paginate slices a page of items', () => {
  const first = paginate(seed(), 0, 4);
  assert.equal(first.total, 13);
  assert.deepEqual(first.items.map(t => t.id), [1, 2, 3, 4]);
  assert.equal(paginate(seed(), 3, 4).items.length, 1);
});
test('settings fall back to safe defaults', () => {
  assert.equal(loadSettings({}).pageSize, 4);
  assert.equal(loadSettings({BUGBOARD_PAGE_SIZE: '10'}).pageSize, 10);
  assert.equal(loadSettings({BUGBOARD_PAGE_SIZE: 'abc'}).pageSize, 4);
  assert.equal(loadSettings({BUGBOARD_PAGE_SIZE: '100'}).pageSize, 4);
  assert.equal(loadSettings({BUGBOARD_EXPORT: 'off'}).exportEnabled, false);
});
