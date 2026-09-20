/**
 * Comprehensive Backend Smoke Tests
 * Validates real disk persistence and uniform API contracts for all veterinary modules.
 */
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const STORE_PATH = path.join(process.cwd(), 'data', 'clinic_store.json');

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ suite, test: name, passed: true, durationMs: duration });
    console.log(`  ✓ [${suite}] ${name} (${duration}ms)`);
  } catch (err: any) {
    const duration = Date.now() - start;
    results.push({ suite, test: name, passed: false, details: err.message, durationMs: duration });
    console.error(`  ✗ [${suite}] ${name} (${duration}ms):`, err.message);
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function verifyDiskStore(predicate: (store: any) => boolean, msg: string) {
  if (!fs.existsSync(STORE_PATH)) {
    throw new Error(`Disk store does not exist at ${STORE_PATH}`);
  }
  const raw = fs.readFileSync(STORE_PATH, 'utf-8');
  const store = JSON.parse(raw);
  if (!predicate(store)) {
    throw new Error(`Disk verification failed: ${msg}`);
  }
}

async function runSmokeTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING VETCLINIC BACKEND SMOKE TESTS');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Disk Storage: ${STORE_PATH}`);
  console.log('======================================================\n');

  // 1. Health & Database Status
  await runTest('System', 'GET /api/health returns ok and timestamp', async () => {
    const res = await request('/api/health');
    if (!res.ok || res.data?.status !== 'ok' || !res.data?.success) {
      throw new Error(`Invalid health response: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('System', 'GET /api/database/status returns storage stats', async () => {
    const res = await request('/api/database/status');
    if (!res.ok || !res.data?.success || !res.data?.counts || !res.data?.storageFile) {
      throw new Error(`Invalid db status response: ${JSON.stringify(res.data)}`);
    }
  });

  // 2. Clinic Profile
  await runTest('Profile', 'GET & POST /api/clinic/profile updates and persists', async () => {
    const uniqueLicense = `VET-TEST-${Date.now()}`;
    const updateRes = await request('/api/clinic/profile', {
      method: 'POST',
      body: JSON.stringify({ licenseNumber: uniqueLicense, emergencyPhone: '09990001122' }),
    });
    if (!updateRes.ok || updateRes.data?.data?.licenseNumber !== uniqueLicense) {
      throw new Error(`Profile update failed: ${JSON.stringify(updateRes.data)}`);
    }
    verifyDiskStore(s => s.clinicProfile?.licenseNumber === uniqueLicense, 'Clinic profile not saved to clinic_store.json');
  });

  // 3. Patients & Owners
  const testPatientId = `smoke-patient-${Date.now()}`;
  const testOwnerId = `smoke-owner-${Date.now()}`;

  await runTest('Patients', 'POST /api/patients persists new patient to disk', async () => {
    const patientPayload = {
      id: testPatientId,
      name: 'پت تست دودی',
      species: 'سگ',
      breed: 'شیتزو تریر',
      age: 3,
      gender: 'male',
      ownerName: 'آزمایش‌کننده خودکار',
      ownerPhone: '09120000001',
      microchipNumber: 'CHIP-TEST-999',
    };
    const res = await request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientPayload),
    });
    if (!res.ok || !res.data?.success || res.data?.data?.id !== testPatientId) {
      throw new Error(`Patient creation failed: ${JSON.stringify(res.data)}`);
    }
    verifyDiskStore(s => s.patients.some((p: any) => p.id === testPatientId), 'Patient not written to clinic_store.json');
  });

  await runTest('Patients', 'GET /api/patients returns the persisted patient', async () => {
    const res = await request('/api/patients');
    if (!res.ok || !Array.isArray(res.data?.data)) {
      throw new Error(`Invalid patients list response: ${JSON.stringify(res.data)}`);
    }
    const found = res.data.data.find((p: any) => p.id === testPatientId);
    if (!found) {
      throw new Error(`Created patient ${testPatientId} not found in GET /api/patients`);
    }
  });

  await runTest('Owners', 'POST & GET /api/owners saves and retrieves owner', async () => {
    const ownerPayload = {
      id: testOwnerId,
      fullName: 'خانم دکتر رضایی',
      phone: '09121113344',
      nationalId: '0012345678',
      address: 'تهران، خیابان نیاوران',
      pets: [testPatientId],
    };
    const res = await request('/api/owners', {
      method: 'POST',
      body: JSON.stringify(ownerPayload),
    });
    if (!res.ok || !res.data?.success) {
      throw new Error(`Owner save failed: ${JSON.stringify(res.data)}`);
    }
    verifyDiskStore(s => s.owners.some((o: any) => o.id === testOwnerId), 'Owner not in disk store');
  });

  // 4. Medical Visits & Attachments
  const testVisitId = `smoke-visit-${Date.now()}`;
  await runTest('Visits', 'POST /api/visits & attachment upload persist properly', async () => {
    const visitPayload = {
      id: testVisitId,
      petId: testPatientId,
      date: '1403/06/20',
      reason: 'معاینه دوره‌ای و تست سلامت',
      diagnosis: 'سلامت عمومی تایید شد',
      treatment: 'تجویز قطره مولتی‌ویتامین',
      doctor: 'دکتر آزمون',
      cost: 450000,
    };
    const res = await request('/api/visits', {
      method: 'POST',
      body: JSON.stringify(visitPayload),
    });
    if (!res.ok || !res.data?.success) {
      throw new Error(`Visit creation failed: ${JSON.stringify(res.data)}`);
    }

    // Attach document
    const attachRes = await request(`/api/visits/${testVisitId}/attachments`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'lab-result.pdf',
        fileType: 'application/pdf',
        fileSize: 128400,
        category: 'lab_result',
        base64Data: 'data:application/pdf;base64,JVBERi0xLjQK...',
      }),
    });
    if (!attachRes.ok || !attachRes.data?.success) {
      throw new Error(`Attachment upload failed: ${JSON.stringify(attachRes.data)}`);
    }
    verifyDiskStore(s => {
      const v = s.visits.find((item: any) => item.id === testVisitId);
      return v && v.attachments && v.attachments.length > 0;
    }, 'Visit attachment not persisted');
  });

  // 5. Appointments & Queues
  const testApptId = `smoke-appt-${Date.now()}`;
  await runTest('Appointments', 'POST & PATCH status of appointment', async () => {
    const apptPayload = {
      id: testApptId,
      petName: 'پت تست دودی',
      ownerName: 'آزمایش‌کننده خودکار',
      ownerPhone: '09120000001',
      date: '1403/06/21',
      time: '11:30',
      type: 'examination',
      status: 'pending',
    };
    const createRes = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(apptPayload),
    });
    if (!createRes.ok || !createRes.data?.success) {
      throw new Error(`Appointment create failed: ${JSON.stringify(createRes.data)}`);
    }

    const patchRes = await request(`/api/appointments/${testApptId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    if (!patchRes.ok || patchRes.data?.data?.status !== 'completed') {
      throw new Error(`Appointment status patch failed: ${JSON.stringify(patchRes.data)}`);
    }
    verifyDiskStore(s => s.appointments.find((a: any) => a.id === testApptId)?.status === 'completed', 'Appointment status not updated on disk');
  });

  // 6. Invoices & Payments
  const testInvoiceId = `smoke-inv-${Date.now()}`;
  await runTest('Invoices', 'POST & PATCH /api/invoices/:id/pay', async () => {
    const invoicePayload = {
      id: testInvoiceId,
      petId: testPatientId,
      ownerName: 'آزمایش‌کننده خودکار',
      totalAmount: 1200000,
      paidAmount: 0,
      status: 'unpaid',
      items: [{ description: 'ویزیت عمومی دامپزشکی', amount: 1200000, count: 1 }],
      date: '1403/06/20',
    };
    const createRes = await request('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoicePayload),
    });
    if (!createRes.ok || !createRes.data?.success) {
      throw new Error(`Invoice create failed: ${JSON.stringify(createRes.data)}`);
    }

    const payRes = await request(`/api/invoices/${testInvoiceId}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ amount: 1200000 }),
    });
    if (!payRes.ok || payRes.data?.data?.status !== 'paid') {
      throw new Error(`Invoice payment failed: ${JSON.stringify(payRes.data)}`);
    }
    verifyDiskStore(s => s.invoices.find((i: any) => i.id === testInvoiceId)?.status === 'paid', 'Invoice payment not persisted on disk');
  });

  // 7. Boarding & Attendance
  const testBoardingId = `smoke-board-${Date.now()}`;
  await runTest('Boarding & Attendance', 'CRUD operations on Boarding & Staff Attendance', async () => {
    const boardRes = await request('/api/boarding', {
      method: 'POST',
      body: JSON.stringify({
        id: testBoardingId,
        petId: testPatientId,
        petName: 'پت تست دودی',
        cageNumber: 'C-04',
        startDate: '1403/06/20',
        expectedEndDate: '1403/06/25',
        status: 'active',
        dailyFee: 350000,
      }),
    });
    if (!boardRes.ok || !boardRes.data?.success) {
      throw new Error(`Boarding save failed: ${JSON.stringify(boardRes.data)}`);
    }

    // Staff Clock-in
    const clockInRes = await request('/api/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify({
        staffName: 'دکتر دستیار',
        role: 'veterinarian',
      }),
    });
    if (!clockInRes.ok || !clockInRes.data?.success) {
      throw new Error(`Staff clock-in failed: ${JSON.stringify(clockInRes.data)}`);
    }
    const attendanceRecord = clockInRes.data.data;

    // Staff Clock-out
    const clockOutRes = await request(`/api/attendance/${attendanceRecord.id}/clock-out`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: 'خروج منظم شیفت عصر' }),
    });
    if (!clockOutRes.ok || !clockOutRes.data?.success) {
      throw new Error(`Staff clock-out failed: ${JSON.stringify(clockOutRes.data)}`);
    }
  });

  // 8. Pet Shop & Loyalty
  const testProdId = `smoke-prod-${Date.now()}`;
  await runTest('Pet Shop', 'Product & Supplier management', async () => {
    const prodRes = await request('/api/petshop/products', {
      method: 'POST',
      body: JSON.stringify({
        id: testProdId,
        name: 'غذای خشک گربه جوسرا',
        category: 'غذای خشک',
        price: 890000,
        stock: 24,
        minStockAlert: 5,
      }),
    });
    if (!prodRes.ok || !prodRes.data?.success) {
      throw new Error(`Product save failed: ${JSON.stringify(prodRes.data)}`);
    }
    verifyDiskStore(s => s.products.some((p: any) => p.id === testProdId), 'Product not in disk store');
  });

  // 9. Surgery & Grooming
  const testSurgeryId = `smoke-surg-${Date.now()}`;
  await runTest('Surgery & Grooming', 'Surgery session tracking', async () => {
    const surgRes = await request('/api/surgery/sessions', {
      method: 'POST',
      body: JSON.stringify({
        id: testSurgeryId,
        petId: testPatientId,
        petName: 'پت تست دودی',
        surgeryType: 'عقیم‌سازی',
        surgeonName: 'دکتر جراح',
        date: '1403/06/22',
        status: 'scheduled',
      }),
    });
    if (!surgRes.ok || !surgRes.data?.success) {
      throw new Error(`Surgery session failed: ${JSON.stringify(surgRes.data)}`);
    }
    verifyDiskStore(s => s.surgerySessions.some((ss: any) => ss.id === testSurgeryId), 'Surgery session not in disk store');
  });

  // 10. Backup, Export, and Cleanups
  await runTest('Backup & Export', 'GET /api/backup/export returns valid full json store', async () => {
    const exportRes = await request('/api/backup/export');
    if (!exportRes.ok || !exportRes.data?.success || !exportRes.data?.data?.patients) {
      throw new Error(`Backup export failed: ${JSON.stringify(exportRes.data)}`);
    }
  });

  await runTest('Backup & Export', 'POST /api/backup/create creates physical file in data/backups/', async () => {
    const backupRes = await request('/api/backup/create', {
      method: 'POST',
      body: JSON.stringify({ tag: 'smoke_test_run' }),
    });
    if (!backupRes.ok || !backupRes.data?.success || !backupRes.data?.backupFile) {
      throw new Error(`Backup creation failed: ${JSON.stringify(backupRes.data)}`);
    }
    const backupFile = path.join(process.cwd(), 'data', 'backups', backupRes.data.backupFile);
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Physical backup file was not found on disk: ${backupFile}`);
    }
  });

  // 11. Cleanup Smoke Test Records
  await runTest('Cleanup', 'Clean up created smoke test records', async () => {
    await request(`/api/patients/${testPatientId}`, { method: 'DELETE' });
    await request(`/api/owners/${testOwnerId}`, { method: 'DELETE' });
    await request(`/api/visits/${testVisitId}`, { method: 'DELETE' });
    await request(`/api/appointments/${testApptId}`, { method: 'DELETE' });
    await request(`/api/invoices/${testInvoiceId}`, { method: 'DELETE' });
    await request(`/api/boarding/${testBoardingId}`, { method: 'DELETE' });
    await request(`/api/petshop/products/${testProdId}`, { method: 'DELETE' });
    await request(`/api/surgery/sessions/${testSurgeryId}`, { method: 'DELETE' });

    verifyDiskStore(s => !s.patients.some((p: any) => p.id === testPatientId), 'Patient cleanup not reflected on disk');
  });

  // Summary
  console.log('\n======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`🏁 SMOKE TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED (Total: ${results.length})`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch(err => {
  console.error('Fatal error during smoke test execution:', err);
  process.exit(1);
});
