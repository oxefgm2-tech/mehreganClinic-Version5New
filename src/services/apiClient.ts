import {
  Pet,
  Owner,
  VisitRecord,
  Appointment,
  Invoice,
  MedicalAttachment,
  ClinicQueueDefinition,
  BoardingRecord,
  StaffAttendance,
  PetShopProduct,
  PetShopSupplier,
  LoyaltyMember,
  SurgeryOperationSession,
  GroomingStyleModel,
  GroomingPortfolioItem,
  RoleAccessMatrix,
  ClinicProfileConfig,
} from '../types';

export const STORAGE_KEY_CENTRAL_API = 'MEHREGAN_CENTRAL_API_URL';
export const STORAGE_KEY_AUTH_TOKEN = 'MEHREGAN_AUTH_TOKEN';
export const STORAGE_KEY_ETAG_PREFIX = 'MEHREGAN_ETAG_';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_CENTRAL_API);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    return envBase.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY_CENTRAL_API);
    } else {
      localStorage.setItem(STORAGE_KEY_CENTRAL_API, url.trim().replace(/\/+$/, ''));
    }
  }
}

export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

function getETagKey(endpoint: string): string {
  return `${STORAGE_KEY_ETAG_PREFIX}${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function getStoredETag(endpoint: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getETagKey(endpoint));
}

function setStoredETag(endpoint: string, etag: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getETagKey(endpoint), etag);
  }
}

export async function clinicFetch(endpoint: string, init?: RequestInit, useETag = false): Promise<Response> {
  const resolvedUrl = apiUrl(endpoint);
  const headers = new Headers(init?.headers || {});
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (useETag && (init?.method === 'GET' || !init?.method)) {
    const etag = getStoredETag(endpoint);
    if (etag) headers.set('If-None-Match', etag);
  }
  const res = await fetch(resolvedUrl, { ...init, headers });
  if (res.status === 304) {
    return new Response(null, { status: 304, statusText: 'Not Modified', headers: res.headers });
  }
  const newETag = res.headers.get('ETag');
  if (newETag && useETag && (init?.method === 'GET' || !init?.method)) {
    setStoredETag(endpoint, newETag);
  }
  return res;
}

export async function testCentralApiConnection(targetUrl?: string): Promise<{
  success: boolean;
  latencyMs?: number;
  clinicName?: string;
  message: string;
}> {
  const base = (targetUrl !== undefined ? targetUrl : getApiBaseUrl()).trim().replace(/\/+$/, '');
  const testUrl = base ? `${base}/api/health` : '/api/health';
  const start = performance.now();
  try {
    const res = await clinicFetch(testUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const latency = Math.round(performance.now() - start);
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        latencyMs: latency,
        clinicName: data.clinicName || 'کلینیک اختصاصی حیوانات خانگی مهرگان',
        message: `ارتباط با سرور مرکزی با موفقیت برقرار شد (تأخیر: ${latency} میلی‌ثانیه).`,
      };
    } else {
      return {
        success: false,
        latencyMs: latency,
        message: `پاسخ ناموفق از سرور مرکزی (کد وضعیت: ${res.status}).`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `عدم امکان برقراری ارتباط با ${testUrl}: ${err?.message || 'خطای شبکه یا مسدود شدن توسط مرورگر'}`,
    };
  }
}


export const apiClient = {
  async login(username: string, password: string): Promise<{ user: any; token: string }> {
    const res = await clinicFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'ورود ناموفق بود');
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, data.token);
    return { user: data.user, token: data.token };
  },

  async logout(): Promise<void> {
    try { await clinicFetch('/api/auth/logout', { method: 'POST' }); } finally {
      localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    }
  },

  async getCurrentUser(): Promise<any> {
    const res = await clinicFetch('/api/auth/me');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'نشست کاربر معتبر نیست.');
    return data;
  },

  async getDataVersion(): Promise<{ version: string; updatedAt: string; notModified?: boolean }> {
    const res = await clinicFetch('/api/data-version', { headers: { Accept: 'application/json' } }, true);
    if (res.status === 304) {
      return { version: '', updatedAt: '', notModified: true };
    }
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'نسخهٔ داده‌ها دریافت نشد.');
    return { version: String(data.version), updatedAt: String(data.updatedAt), notModified: false };
  },

  async updateCurrentUser(updates: Record<string, string>): Promise<any> {
    const res = await clinicFetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ذخیرهٔ پروفایل ناموفق بود.');
    return data.user;
  },

  async getTasks(username?: string): Promise<any[]> {
    const query = username ? `?username=${encodeURIComponent(username)}` : '';
    const res = await clinicFetch(`/api/tasks${query}`);
    const data = await res.json();
    return data.data || [];
  },

  async getStaff(): Promise<Array<{ username: string; name: string; role: string }>> {
    const res = await clinicFetch('/api/staff');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'فهرست پرسنل دریافت نشد.');
    return data.data || [];
  },

  async inviteUser(user: { name: string; phone: string; email?: string; role: string }): Promise<any> {
    const res = await clinicFetch('/api/auth/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'دعوت کاربر ناموفق بود.');
    return data;
  },

  async completeUserInvitation(token: string, user: { name: string; username: string; password: string; phone: string; email?: string }): Promise<any> {
    const res = await clinicFetch(`/api/auth/invitations/${encodeURIComponent(token)}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'تکمیل دعوتنامه ناموفق بود.');
    return data.user;
  },

  async getInvitation(token: string): Promise<any> {
    const res = await clinicFetch(`/api/auth/invitations/${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'دعوتنامه معتبر نیست.');
    return data.invitation;
  },

  async createTask(task: any): Promise<any> {
    const res = await clinicFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ثبت تیکت ناموفق بود');
    return data.data;
  },

  async updateTask(taskId: string, updates: any): Promise<any> {
    const res = await clinicFetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'به‌روزرسانی تیکت ناموفق بود');
    return data.data;
  },

  // --- Patients (Pets) ---
  async getPatients(query = '', limit = 0, species = ''): Promise<Pet[]> {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (limit > 0) params.set('limit', String(limit));
      if (species.trim() && species !== 'all') params.set('species', species.trim());
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const res = await clinicFetch(`/api/patients${suffix}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getPatients failed, falling back:', err);
      return [];
    }
  },

  async savePatient(patient: Pet): Promise<Pet> {
    const res = await clinicFetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error('Failed to save patient to server');
    const data = await res.json();
    return data.data;
  },

  async deletePatient(patientId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Owners ---
  async getOwners(): Promise<Owner[]> {
    try {
      const res = await clinicFetch('/api/owners');
      if (!res.ok) throw new Error('Failed to fetch owners');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getOwners failed:', err);
      return [];
    }
  },

  async saveOwner(owner: Owner): Promise<Owner> {
    const res = await clinicFetch('/api/owners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(owner),
    });
    if (!res.ok) throw new Error('Failed to save owner to server');
    const data = await res.json();
    return data.data;
  },

  // --- Visits (Medical Records) ---
  async getVisits(): Promise<VisitRecord[]> {
    try {
      const res = await clinicFetch('/api/visits');
      if (!res.ok) throw new Error('Failed to fetch visits');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getVisits failed:', err);
      return [];
    }
  },

  async saveVisit(visit: VisitRecord): Promise<VisitRecord> {
    const res = await clinicFetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visit),
    });
    if (!res.ok) throw new Error('Failed to save visit to server');
    const data = await res.json();
    return data.data;
  },

  async deleteVisit(visitId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/visits/${visitId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Vaccinations ---
  async getVaccinations(): Promise<any[]> {
    try {
      const res = await clinicFetch('/api/vaccinations');
      if (!res.ok) throw new Error('Failed to fetch vaccinations');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getVaccinations failed:', err);
      return [];
    }
  },

  async saveVaccination(vaccination: any): Promise<any> {
    const res = await clinicFetch('/api/vaccinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vaccination),
    });
    if (!res.ok) throw new Error('Failed to save vaccination');
    const data = await res.json();
    return data.data;
  },

  async addAttachmentToVisit(visitId: string, attachment: MedicalAttachment): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/visits/${visitId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachment),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Appointments & Queues ---
  async getAppointments(): Promise<Appointment[]> {
    try {
      const res = await clinicFetch('/api/appointments');
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getAppointments failed:', err);
      return [];
    }
  },

  async saveAppointment(appointment: Appointment): Promise<Appointment> {
    const res = await clinicFetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    });
    if (!res.ok) throw new Error('Failed to save appointment to server');
    const data = await res.json();
    return data.data;
  },

  async updateAppointmentStatus(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    try {
      const res = await clinicFetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update appointment status');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API updateAppointmentStatus failed:', err);
      return null;
    }
  },

  async deleteAppointment(appointmentId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getQueues(): Promise<ClinicQueueDefinition[]> {
    try {
      const res = await clinicFetch('/api/queues');
      if (!res.ok) throw new Error('Failed to fetch queues');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getQueues failed:', err);
      return [];
    }
  },

  async saveQueue(queue: ClinicQueueDefinition): Promise<ClinicQueueDefinition> {
    const res = await clinicFetch('/api/queues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queue),
    });
    if (!res.ok) throw new Error('Failed to save queue to server');
    const data = await res.json();
    return data.data;
  },

  // --- Invoices & Cashier ---
  async getInvoices(): Promise<Invoice[]> {
    try {
      const res = await clinicFetch('/api/invoices');
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getInvoices failed:', err);
      return [];
    }
  },

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const res = await clinicFetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    if (!res.ok) throw new Error('Failed to save invoice to server');
    const data = await res.json();
    return data.data;
  },

  async payInvoice(invoiceId: string, details: { paymentMethod: Invoice['paymentMethod'] | 'card_to_card' | 'online_gateway'; cashierName?: string; notes?: string }): Promise<Invoice | null> {
    try {
      const res = await clinicFetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (!res.ok) throw new Error('Failed to record invoice payment');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API payInvoice failed:', err);
      return null;
    }
  },

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Boarding & Hospitalization ---
  async getBoarding(): Promise<BoardingRecord[]> {
    try {
      const res = await clinicFetch('/api/boarding');
      if (!res.ok) throw new Error('Failed to fetch boarding');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getBoarding failed:', err);
      return [];
    }
  },

  async saveBoarding(record: BoardingRecord): Promise<BoardingRecord> {
    const res = await clinicFetch('/api/boarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to save boarding record');
    const data = await res.json();
    return data.data;
  },

  async updateBoardingTask(
    recordId: string,
    taskId: string,
    updates: { isCompleted: boolean; completedBy?: string; completedAt?: string; photoProofUrl?: string; voiceMemoText?: string }
  ): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/boarding/${recordId}/task`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...updates }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteBoarding(recordId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/boarding/${recordId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Attendance ---
  async getAttendance(): Promise<StaffAttendance[]> {
    try {
      const res = await clinicFetch('/api/attendance');
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getAttendance failed:', err);
      return [];
    }
  },

  async clockIn(attendance: StaffAttendance): Promise<StaffAttendance> {
    const res = await clinicFetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendance),
    });
    if (!res.ok) throw new Error('Failed to clock in');
    const data = await res.json();
    return data.data;
  },

  async clockOut(recordId: string, clockOutTime?: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/attendance/${recordId}/clock-out`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clockOutTime }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Pet Shop Products ---
  async getPetShopProducts(): Promise<PetShopProduct[]> {
    try {
      const res = await clinicFetch('/api/petshop/products');
      if (!res.ok) throw new Error('Failed to fetch petshop products');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getPetShopProducts failed:', err);
      return [];
    }
  },

  async savePetShopProduct(product: PetShopProduct): Promise<PetShopProduct> {
    const res = await clinicFetch('/api/petshop/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to save petshop product');
    const data = await res.json();
    return data.data;
  },

  async savePetShopProductsBatch(products: PetShopProduct[]): Promise<boolean> {
    try {
      const res = await clinicFetch('/api/petshop/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deletePetShopProduct(productId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/petshop/products/${productId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Clinic Profile ---
  async getClinicProfile(): Promise<ClinicProfileConfig | null> {
    try {
      const res = await clinicFetch('/api/clinic/profile');
      if (!res.ok) throw new Error('Failed to fetch clinic profile');
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      console.warn('API getClinicProfile failed:', err);
      return null;
    }
  },

  async saveClinicProfile(profile: ClinicProfileConfig): Promise<ClinicProfileConfig> {
    const res = await clinicFetch('/api/clinic/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to save clinic profile');
    const data = await res.json();
    return data.data;
  },

  // --- Pet Shop Suppliers ---
  async getSuppliers(): Promise<PetShopSupplier[]> {
    try {
      const res = await clinicFetch('/api/petshop/suppliers');
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getSuppliers failed:', err);
      return [];
    }
  },

  async saveSupplier(supplier: PetShopSupplier): Promise<PetShopSupplier> {
    const res = await clinicFetch('/api/petshop/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    if (!res.ok) throw new Error('Failed to save supplier');
    const data = await res.json();
    return data.data;
  },

  async saveSuppliersBatch(suppliers: PetShopSupplier[]): Promise<boolean> {
    try {
      const res = await clinicFetch('/api/petshop/suppliers/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suppliers),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteSupplier(supplierId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/petshop/suppliers/${supplierId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Loyalty Members ---
  async getLoyaltyMembers(): Promise<LoyaltyMember[]> {
    try {
      const res = await clinicFetch('/api/petshop/loyalty');
      if (!res.ok) throw new Error('Failed to fetch loyalty members');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getLoyaltyMembers failed:', err);
      return [];
    }
  },

  async saveLoyaltyMember(member: LoyaltyMember): Promise<LoyaltyMember> {
    const res = await clinicFetch('/api/petshop/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to save loyalty member');
    const data = await res.json();
    return data.data;
  },

  async saveLoyaltyMembersBatch(members: LoyaltyMember[]): Promise<boolean> {
    try {
      const res = await clinicFetch('/api/petshop/loyalty/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(members),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteLoyaltyMember(memberId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/petshop/loyalty/${memberId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Surgery Sessions ---
  async getSurgerySessions(): Promise<SurgeryOperationSession[]> {
    try {
      const res = await clinicFetch('/api/surgery/sessions');
      if (!res.ok) throw new Error('Failed to fetch surgery sessions');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getSurgerySessions failed:', err);
      return [];
    }
  },

  async saveSurgerySession(session: SurgeryOperationSession): Promise<SurgeryOperationSession> {
    const res = await clinicFetch('/api/surgery/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error('Failed to save surgery session');
    const data = await res.json();
    return data.data;
  },

  async saveSurgerySessionsBatch(sessions: SurgeryOperationSession[]): Promise<boolean> {
    try {
      const res = await clinicFetch('/api/surgery/sessions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessions),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteSurgerySession(sessionId: string): Promise<boolean> {
    try {
      const res = await clinicFetch(`/api/surgery/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Grooming Styles & Portfolio ---
  async getGroomingStyles(): Promise<GroomingStyleModel[]> {
    try {
      const res = await clinicFetch('/api/grooming/styles');
      if (!res.ok) throw new Error('Failed to fetch grooming styles');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getGroomingStyles failed:', err);
      return [];
    }
  },

  async saveGroomingStylesBatch(styles: GroomingStyleModel[]): Promise<boolean> {
    try {
      const res = await clinicFetch('/api/grooming/styles/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(styles),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getGroomingPortfolio(): Promise<GroomingPortfolioItem[]> {
    try {
      const res = await clinicFetch('/api/grooming/portfolio');
      if (!res.ok) throw new Error('Failed to fetch grooming portfolio');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('API getGroomingPortfolio failed:', err);
      return [];
    }
  },

  async saveGroomingPortfolioBatch(portfolio: GroomingPortfolioItem[]): Promise<boolean> {
    try {
      const res = await clinicFetch('/api/grooming/portfolio/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Access Matrix & Security ---
  async getAccessMatrix(): Promise<RoleAccessMatrix | null> {
    try {
      const res = await clinicFetch('/api/system/access-matrix');
      if (!res.ok) throw new Error('Failed to fetch access matrix');
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      console.warn('API getAccessMatrix failed:', err);
      return null;
    }
  },

  async saveAccessMatrix(matrix: RoleAccessMatrix): Promise<RoleAccessMatrix> {
    const res = await clinicFetch('/api/system/access-matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matrix),
    });
    if (!res.ok) throw new Error('Failed to save access matrix');
    const data = await res.json();
    return data.data;
  },

  // --- Migration Commit ---
  async commitMigrationData(records: any[]): Promise<{ success: boolean; message: string; stats?: any }> {
    const res = await clinicFetch('/api/migration/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    return res.json();
  },

  // --- Database Status & Wipe ---
  async getDatabaseStatus(): Promise<{
    success: boolean;
    initialized: boolean;
    clinicProfileConfigured: boolean;
    counts: Record<string, number>;
  }> {
    try {
      const res = await clinicFetch('/api/database/status');
      if (!res.ok) throw new Error('Failed to fetch database status');
      return res.json();
    } catch {
      return {
        success: false,
        initialized: false,
        clinicProfileConfigured: false,
        counts: {},
      };
    }
  },

  async wipeDatabase(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await clinicFetch('/api/database/wipe', {
        method: 'POST',
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch {
      return { success: false };
    }
  },

  // --- Health Check ---
  async getHealth(): Promise<{ status: string; clinicName: string; version: string }> {
    const res = await clinicFetch('/api/health');
    return res.json();
  },

  // --- Backup, Export & Restore ---
  async exportBackup(download: boolean = false): Promise<any> {
    if (download) {
      window.location.href = apiUrl('/api/backup/export?download=true');
      return { success: true };
    }
    const res = await clinicFetch('/api/backup/export');
    return res.json();
  },

  async importBackup(storeData: any): Promise<{ success: boolean; message: string; counts?: any }> {
    const res = await clinicFetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store: storeData }),
    });
    return res.json();
  },

  async listBackups(): Promise<{ success: boolean; backups: Array<{ fileName: string; sizeBytes: number; createdAt: string }> }> {
    const res = await clinicFetch('/api/backup/list');
    return res.json();
  },

  async restoreBackup(fileName: string): Promise<{ success: boolean; message: string }> {
    const res = await clinicFetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName }),
    });
    return res.json();
  },

  async createBackup(tag?: string): Promise<{ success: boolean; message: string; backupFile?: string }> {
    const res = await clinicFetch('/api/backup/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
    return res.json();
  },

  async clearDevDatabase(preserveAdminUsers: boolean = true): Promise<{ success: boolean; message: string }> {
    const res = await clinicFetch('/api/dev/database/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preserveAdminUsers, confirmWipe: true }),
    });
    return res.json();
  },
};
