import fs from 'node:fs';

const files = [
  'RM-JSON_STAGE_01_TOKEN_OPTIMIZATION.json',
  'RM-JSON_STAGE_02_CLINIC_READINESS.json',
  'RM-JSON_STAGE_01_EXECUTION_LOG.json',
  'PROJECT_CONTEXT_COMPACT.md',
  'RM-JSON_EXECUTION_PROTOCOL.md',
];
const forbidden = [/Mhrg-/i, /BEGIN (RSA|OPENSSH|PRIVATE) KEY/i, /Bearer\s+[A-Za-z0-9._-]{12,}/i];
const findings = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) if (pattern.test(text)) findings.push({ file, pattern: String(pattern) });
}
if (findings.length) {
  console.error(JSON.stringify({ safe: false, findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ safe: true, scannedFiles: files.length, credentialPatterns: 0 }, null, 2));
