import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] || 'RM-JSON_STAGE_01_TOKEN_OPTIMIZATION.json';
const absolute = path.resolve(file);
const document = JSON.parse(fs.readFileSync(absolute, 'utf8'));
const rm = document?.rm_json;
if (!rm || rm.v !== '2.21') throw new Error('RM-JSON v2.21 root is missing.');

const tasks = Array.isArray(rm.core) ? rm.core : [];
if (tasks.length !== 10) throw new Error(`Expected exactly 10 tasks, got ${tasks.length}.`);
const requiredTaskFields = file.includes('STAGE_01') ? ['id', 'claim', 'conf', 'infer'] : ['id', 'claim'];
const ids = new Set();
for (const task of tasks) {
  for (const field of requiredTaskFields) {
    if (task[field] === undefined || task[field] === null) throw new Error(`Task ${task.id || '?'} is missing ${field}.`);
  }
  if (ids.has(task.id)) throw new Error(`Duplicate task id: ${task.id}`);
  ids.add(task.id);
}
for (const relation of rm.relations || []) {
  if (!ids.has(relation.s) || !ids.has(relation.t)) throw new Error(`Invalid relation: ${relation.s} -> ${relation.t}`);
}

const raw = fs.readFileSync(absolute, 'utf8');
if (/Mhrg-|BEGIN (RSA|OPENSSH|PRIVATE) KEY|Bearer\s+[A-Za-z0-9._-]{12,}/i.test(raw)) {
  throw new Error('Potential credential or token found in RM-JSON artifact.');
}

console.log(JSON.stringify({
  valid: true,
  version: rm.v,
  taskCount: tasks.length,
  relationCount: (rm.relations || []).length,
  credentialScan: 'clear',
  file: absolute,
}, null, 2));
