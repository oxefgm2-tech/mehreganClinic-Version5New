const base = (process.env.SMOKE_BASE_URL || 'https://mehreganpetclinic.ir').replace(/\/$/, '');
const checks = [
  ['/api/health', 'health', 200],
  ['/api/data-version', 'data-version', 200],
];

const sessionHeaders = { Accept: 'application/json' };
if (process.env.SMOKE_USERNAME && process.env.SMOKE_PASSWORD) {
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.SMOKE_USERNAME, password: process.env.SMOKE_PASSWORD }),
  });
  if (!login.ok) throw new Error(`login failed: expected HTTP 200, got ${login.status}`);
  const loginBody = await login.json();
  if (!loginBody?.token) throw new Error('login failed: response did not include a session token');
  sessionHeaders.Authorization = `Bearer ${loginBody.token}`;
}

const clinicalExpectedStatus = sessionHeaders.Authorization ? 200 : 401;
checks.push(
  ['/api/patients?limit=1', 'patients', clinicalExpectedStatus],
  ['/api/owners?limit=1', 'owners', clinicalExpectedStatus],
  ['/api/vaccinations', 'vaccinations', clinicalExpectedStatus],
  ['/api/staff', 'staff', sessionHeaders.Authorization ? 200 : 403],
);

const results = [];
for (const [endpoint, name, expectedStatus] of checks) {
  const response = await fetch(`${base}${endpoint}`, { headers: sessionHeaders });
  const ok = response.status === expectedStatus;
  results.push({ name, status: response.status, expectedStatus, ok });
  if (!ok) throw new Error(`${name} failed: expected HTTP ${expectedStatus}, got ${response.status}`);
}

console.log(JSON.stringify({ success: true, base, checks: results }, null, 2));
