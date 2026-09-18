const base = (process.env.SMOKE_BASE_URL || 'https://mehreganpetclinic.ir').replace(/\/$/, '');
const checks = [
  ['/api/health', 'health', 200],
  ['/api/data-version', 'data-version', 200],
  ['/api/patients?limit=1', 'patients', 200],
  ['/api/owners?limit=1', 'owners', 200],
  ['/api/vaccinations', 'vaccinations', 200],
  ['/api/staff', 'staff-without-session', 403],
];

const results = [];
for (const [endpoint, name, expectedStatus] of checks) {
  const response = await fetch(`${base}${endpoint}`, { headers: { Accept: 'application/json' } });
  const ok = response.status === expectedStatus;
  results.push({ name, status: response.status, expectedStatus, ok });
  if (!ok) throw new Error(`${name} failed: expected HTTP ${expectedStatus}, got ${response.status}`);
}

console.log(JSON.stringify({ success: true, base, checks: results }, null, 2));
