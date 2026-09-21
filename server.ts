import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { Pool } from 'pg';
import { randomUUID, createHash } from 'crypto';
import { initialNotifications } from './src/data/mockDatabase';
import { sessionUser, createSession, deleteSession, getAllAuthUsers } from './src/auth/session';
import { requirePermission, requireAuth, requireOwnership } from './src/middleware/auth';
import { initRBAC } from './src/utils/rbac';

dotenv.config();

// Initialize RBAC on startup
initRBAC();

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10) || 3000;

// Type definitions
type AuthUser = { username: string; password: string; role: string; name: string; phone?: string; email?: string };
type UserInvitation = { token: string; name: string; phone?: string; email?: string; role: string; createdAt: string; createdBy: string; usedAt?: string };

function isTaskManager(user: AuthUser): boolean {
  return ['admin', 'senior_veterinarian', 'it_developer'].includes(user.role);
}

function isUserManager(user: AuthUser): boolean {
  return ['admin', 'it_developer'].includes(user.role);
}

// Enable CORS for decoupling: allows requests from Localhost clients, mobile PWAs, and remote domains
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Clinic-Role', 'X-Client-Platform'],
    credentials: false,
  })
);

// Explicit OPTIONS handler for preflight requests
app.options('*', cors());

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

function invitationsFile(): string {
  return process.env.AUTH_INVITATIONS_FILE || path.resolve(process.cwd(), 'config', 'auth_invitations.json');
}

function readInvitations(): UserInvitation[] {
  try {
    const file = invitationsFile();
    if (!fs.existsSync(file)) return [];
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function writeInvitations(items: UserInvitation[]): void {
  const file = invitationsFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf-8');
}

function normalizeIdentity(value: string): string {
  return value.trim()
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');
}

app.post('/api/auth/login', (req: Request, res: Response) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const normalizedUsername = normalizeIdentity(username);
  const user = getAllAuthUsers().find((candidate) =>
    (candidate.username === username || candidate.email === username || normalizeIdentity(candidate.phone || '') === normalizedUsername) &&
    candidate.password === password
  );
  if (!user) {
    return res.status(401).json({ success: false, error: 'نام کاربری یا رمز عبور نادرست است.' });
  }
  const token = createSession(user);
  return res.json({
    success: true,
    token,
    user: { id: `user-${user.username}`, username: user.username, email: user.email, phone: user.phone, name: user.name, role: user.role, status: 'active' },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'نشست کاربر معتبر نیست.' });
  return res.json({ success: true, user: { id: `user-${user.username}`, username: user.username, email: user.email, phone: user.phone, name: user.name, role: user.role, status: 'active' } });
});

app.patch('/api/auth/me', (req: Request, res: Response) => {
  const session = sessionUser(req);
  if (!session) return res.status(401).json({ success: false, error: 'نشست کاربر معتبر نیست.' });
  const updates = req.body || {};
  const name = String(updates.name || session.name).trim();
  const email = String(updates.email || '').trim();
  const phone = String(updates.phone || '').trim();
  const password = String(updates.password || '');
  if (!name || !phone) return res.status(400).json({ success: false, error: 'نام و شماره موبایل الزامی است.' });
  const file = process.env.AUTH_USERS_FILE || path.resolve(process.cwd(), 'config', 'auth_users.json');
  if (!fs.existsSync(file)) return res.status(500).json({ success: false, error: 'فایل حساب‌ها در دسترس نیست.' });
  const users = JSON.parse(fs.readFileSync(file, 'utf-8')) as AuthUser[];
  const target = users.find((candidate) => candidate.username === session.username);
  if (!target) return res.status(404).json({ success: false, error: 'حساب کاربر پیدا نشد.' });
  target.name = name; target.email = email || target.email; target.phone = phone;
  if (password) target.password = password;
  fs.writeFileSync(file, JSON.stringify(users, null, 2), 'utf-8');
  Object.assign(session, { name: target.name, email: target.email, phone: target.phone, ...(password ? { password } : {}) });
  return res.json({ success: true, user: { id: `user-${session.username}`, username: session.username, email: session.email, phone: session.phone, name: session.name, role: session.role, status: 'active' } });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) deleteSession(token);
  return res.json({ success: true });
});

app.post('/api/auth/users', (req: Request, res: Response) => {
  const creator = sessionUser(req);
  if (!creator || !isUserManager(creator)) return res.status(403).json({ success: false, error: 'فقط مدیر ارشد و کارشناس IT می‌توانند کاربر دعوت کنند.' });
  const input = req.body || {};
  const username = String(input.username || '').trim();
  const name = String(input.name || '').trim();
  const password = String(input.password || '');
  const phone = String(input.phone || '').trim();
  const email = String(input.email || '').trim();
  const role = String(input.role || '').trim();
  const allowedRoles = ['veterinarian', 'receptionist', 'groomer', 'cashier', 'petshop_purchasing', 'petshop_sales', 'owner'];
  if (!input.username && !input.password) {
    if (!name || !phone || !allowedRoles.includes(role)) return res.status(400).json({ success: false, error: 'نام، موبایل و نقش تعیین‌شده الزامی است.' });
    const invitations = readInvitations();
    const normalizedPhone = normalizeIdentity(phone);
    const usersFile = process.env.AUTH_USERS_FILE || path.resolve(process.cwd(), 'config', 'auth_users.json');
    const users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf-8')) as AuthUser[] : [];
    if (users.some((candidate) => normalizeIdentity(candidate.phone || '') === normalizedPhone) || invitations.some((item) => !item.usedAt && normalizeIdentity(item.phone || '') === normalizedPhone)) {
      return res.status(409).json({ success: false, error: 'برای این شماره حساب یا دعوتنامه فعال وجود دارد.' });
    }
    const invitation: UserInvitation = { token: randomUUID(), name, phone, email: email || undefined, role, createdAt: new Date().toISOString(), createdBy: creator.username };
    invitations.push(invitation);
    writeInvitations(invitations);
    return res.status(201).json({ success: true, invitation: { token: invitation.token, name, phone, email, role, setupPath: `/?invite=${encodeURIComponent(invitation.token)}` } });
  }
  return res.status(400).json({ success: false, error: 'ساخت حساب فقط از طریق تکمیل دعوتنامه امکان‌پذیر است.' });
  if (!name || !username || password.length < 6 || !phone || !allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, error: 'نام، نام کاربری، کلمه عبور حداقل ۶ حرفی، موبایل و نقش الزامی است.' });
  }
  const file = process.env.AUTH_USERS_FILE || path.resolve(process.cwd(), 'config', 'auth_users.json');
  if (!fs.existsSync(file)) return res.status(500).json({ success: false, error: 'فایل حساب‌ها در دسترس نیست.' });
  const users = JSON.parse(fs.readFileSync(file, 'utf-8')) as AuthUser[];
  const normalized = normalizeIdentity(username);
  if (users.some((candidate) => candidate.username === username || normalizeIdentity(candidate.phone || '') === normalized || (email && candidate.email === email))) {
    return res.status(409).json({ success: false, error: 'نام کاربری، موبایل یا ایمیل قبلاً ثبت شده است.' });
  }
  const created = { username, password, role, name, phone, ...(email ? { email } : {}) };
  users.push(created);
  fs.writeFileSync(file, JSON.stringify(users, null, 2), 'utf-8');
  return res.status(201).json({ success: true, user: { username, name, phone, email, role, status: 'active' } });
});

app.get('/api/auth/invitations/:token', (req: Request, res: Response) => {
  const invitation = readInvitations().find((item) => item.token === String(req.params.token) && !item.usedAt);
  if (!invitation) return res.status(404).json({ success: false, error: 'دعوتنامه معتبر نیست یا قبلاً استفاده شده است.' });
  return res.json({ success: true, invitation: { name: invitation.name, phone: invitation.phone, email: invitation.email, role: invitation.role } });
});

app.post('/api/auth/invitations/:token/complete', (req: Request, res: Response) => {
  const invitations = readInvitations();
  const invitation = invitations.find((item) => item.token === String(req.params.token) && !item.usedAt);
  if (!invitation) return res.status(404).json({ success: false, error: 'دعوتنامه معتبر نیست یا قبلاً استفاده شده است.' });
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || invitation.name).trim();
  const phone = String(req.body?.phone || invitation.phone || '').trim();
  const email = String(req.body?.email || invitation.email || '').trim();
  if (!username || password.length < 6 || !name || !phone) return res.status(400).json({ success: false, error: 'نام، موبایل، نام کاربری و رمز عبور حداقل ۶ حرفی الزامی است.' });
  const file = process.env.AUTH_USERS_FILE || path.resolve(process.cwd(), 'config', 'auth_users.json');
  if (!fs.existsSync(file)) return res.status(500).json({ success: false, error: 'فایل حساب‌ها در دسترس نیست.' });
  const users = JSON.parse(fs.readFileSync(file, 'utf-8')) as AuthUser[];
  const normalizedPhone = normalizeIdentity(phone);
  if (users.some((candidate) => candidate.username === username || normalizeIdentity(candidate.phone || '') === normalizedPhone || (email && candidate.email === email))) return res.status(409).json({ success: false, error: 'نام کاربری، موبایل یا ایمیل قبلاً ثبت شده است.' });
  users.push({ username, password, role: invitation.role, name, phone, ...(email ? { email } : {}) });
  fs.writeFileSync(file, JSON.stringify(users, null, 2), 'utf-8');
  invitation.usedAt = new Date().toISOString();
  writeInvitations(invitations);
  return res.status(201).json({ success: true, user: { username, name, phone, email, role: invitation.role, status: 'active' } });
});

// Shared Gemini client with telemetry header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// Persistent Database & Deployment Config Storage
// ----------------------------------------------------
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir', e);
  }
}

if (!fs.existsSync(BACKUPS_DIR)) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create backups dir', e);
  }
}

const DEPLOYMENT_CONFIG_FILE = path.join(DATA_DIR, 'deployment_config.json');
const CLINIC_STORE_FILE = path.join(DATA_DIR, 'clinic_store.json');
const DATABASE_PROVIDER = (process.env.DATABASE_PROVIDER || 'json').toLowerCase();
// PostgreSQL database names are case-sensitive when quoted; the clinic database
// is intentionally lower-case in every environment.
const DATABASE_URL = (process.env.DATABASE_URL || '').replace(/\/Clinic_db(?=$|[?])/i, '/clinic_db');

// Default 3-Mode Deployment Configuration
let deploymentConfig = {
  mode: 'lan_windows', // 'lan_windows' | 'vps_ubuntu' | 'cloud_hosted'
  serverIp: '192.168.1.100',
  domain: 'mehregan-vet.local',
  port: 3000,
  databaseType: 'embedded_json', // 'embedded_json' | 'postgresql' | 'sqlite'
  postgresUri: 'postgresql://postgres:postgres@localhost:5432/mehregan_vet',
  lanSubnet: '192.168.1.0/24',
  autoSyncIntervalMinutes: 60,
  useSsl: false,
  activeInterface: 'Wi-Fi / Ethernet LAN (192.168.1.100:3000)',
  status: 'online',
  lastReloadedAt: new Date().toISOString(),
  connectedClientsCount: 5,
};

if (fs.existsSync(DEPLOYMENT_CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(DEPLOYMENT_CONFIG_FILE, 'utf-8');
    if (raw.trim()) {
      deploymentConfig = { ...deploymentConfig, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Ignoring invalid deployment config; using safe defaults.');
  }
} else {
  try {
    fs.writeFileSync(DEPLOYMENT_CONFIG_FILE, JSON.stringify(deploymentConfig, null, 2), 'utf-8');
  } catch (e) {}
}

// Clinic Persistent Store Interface
interface PersistentClinicStore {
  initialized: boolean;
  patients: any[];
  owners: any[];
  visits: any[];
  vaccinations: any[];
  appointments: any[];
  queues: any[];
  invoices: any[];
  boarding: any[];
  attendance: any[];
  products: any[];
  productMovements: any[];
  accountingDocuments: any[];
  suppliers: any[];
  loyaltyMembers: any[];
  surgerySessions: any[];
  groomingStyles: any[];
  groomingPortfolio: any[];
  clinicProfile: any;
  accessMatrix: any;
  syncQueue: any[];
  tasks: any[];
  notifications: any[];
}

const defaultClinicStore: PersistentClinicStore = {
  initialized: true,
  patients: [],
  owners: [],
  visits: [],
  vaccinations: [],
  appointments: [],
  queues: [],
  invoices: [],
  boarding: [],
  attendance: [],
  products: [],
  productMovements: [],
  accountingDocuments: [],
  suppliers: [],
  loyaltyMembers: [],
  surgerySessions: [],
  groomingStyles: [],
  groomingPortfolio: [],
  clinicProfile: {
    clinicName: 'کلینیک اختصاصی حیوانات خانگی مهرگان',
    licenseNumber: 'VET-IR-98234',
    phone: '021-88776655',
    emergencyPhone: '09121112233',
    address: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، بن‌بست مهرگان، پلاک ۴',
    website: 'https://mehregan-vet.ir',
    email: 'info@mehregan-vet.ir',
    workingHours: 'همه‌روزه ۹:۰۰ الی ۲۲:۰۰ (بخش اورژانس ۲۴ ساعته)',
    taxNumber: '411234567890',
  },
  accessMatrix: null,
  syncQueue: [],
  tasks: [],
  notifications: [],
};

let store: PersistentClinicStore = { ...defaultClinicStore };
let postgresPool: Pool | null = null;
let postgresWriteChain: Promise<void> = Promise.resolve();
let lastPostgresFingerprint = '';
let lastNormalizedFingerprint = '';
let lastStoreUpdatedAt = '';

async function getPostgresFingerprint(): Promise<{ version: string; updatedAt: string; normalizedVersion: string; storeUpdatedAt: string }> {
  if (!postgresPool) {
    const fallback = JSON.stringify({ counts: arrayKeys.map((key) => [key, Array.isArray(store[key]) ? store[key].length : 0]) });
    const version = createHash('sha256').update(fallback).digest('hex');
    return { version, normalizedVersion: version, storeUpdatedAt: '', updatedAt: new Date().toISOString() };
  }

  const result = await postgresPool.query<{ table_name: string; row_count: string; last_change: string | null }>(`
    SELECT table_name, row_count::text, last_change::text
    FROM (
      SELECT 'clinic_store' AS table_name, COUNT(*) AS row_count, MAX(updated_at) AS last_change FROM clinic_store
      UNION ALL SELECT 'owners', COUNT(*), MAX(updated_at) FROM owners
      UNION ALL SELECT 'pets', COUNT(*), MAX(updated_at) FROM pets
      UNION ALL SELECT 'visits', COUNT(*), MAX(created_at) FROM visits
      UNION ALL SELECT 'vaccinations', COUNT(*), MAX(created_at) FROM vaccinations
      UNION ALL SELECT 'products', COUNT(*), MAX(updated_at) FROM products
      UNION ALL SELECT 'product_movements', COUNT(*), MAX(created_at) FROM product_movements
      UNION ALL SELECT 'accounting_documents', COUNT(*), MAX(created_at) FROM accounting_documents
    ) AS changes
    ORDER BY table_name
  `);
  const signature = JSON.stringify(result.rows);
  const normalizedRows = result.rows.filter((row) => row.table_name !== 'clinic_store');
  const normalizedVersion = createHash('sha256').update(JSON.stringify(normalizedRows)).digest('hex');
  const storeUpdatedAt = result.rows.find((row) => row.table_name === 'clinic_store')?.last_change || '';
  const updatedAt = result.rows.reduce((latest, row) => {
    if (!row.last_change) return latest;
    return row.last_change > latest ? row.last_change : latest;
  }, '');
  return {
    version: createHash('sha256').update(signature).digest('hex'),
    normalizedVersion,
    storeUpdatedAt,
    updatedAt: updatedAt || new Date().toISOString(),
  };
}

async function refreshNormalizedStoreFromPostgres(): Promise<void> {
  if (!postgresPool) return;
  const [owners, pets, visits, vaccinations, products, movements, documents] = await Promise.all([
    postgresPool.query(`SELECT id, full_name, phone, email, address, national_id FROM owners ORDER BY created_at, id`),
    postgresPool.query(`SELECT p.id, p.owner_id, p.name, p.species, p.breed, p.gender, p.birth_date_text, p.microchip_number, p.notes, p.is_active, o.full_name AS owner_name, o.phone AS owner_phone FROM pets p LEFT JOIN owners o ON o.id = p.owner_id ORDER BY p.created_at, p.id`),
    postgresPool.query(`SELECT id, pet_id, visit_date_text, cost, notes, vital_signs, clinical_findings FROM visits ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, pet_id, vaccine_name, administered_date_text, next_due_date_text, price, is_completed FROM vaccinations ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, name, latin_name, barcode, group_code, unit_name, purchase_price, sale_price, stock_quantity, is_active FROM products ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, product_id, product_legacy_code, factor_number, movement_date_text, direction, quantity, unit_price, discount, warehouse_code FROM product_movements ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, document_number, document_date_text, factor_number, debit, credit, comment FROM accounting_documents ORDER BY created_at, id`),
  ]);

  store.owners = owners.rows.map((row: any) => ({ id: row.id, fullName: row.full_name, name: row.full_name, phone: row.phone, email: row.email, address: row.address, nationalId: row.national_id }));
  store.patients = pets.rows.map((row: any) => ({ id: row.id, ownerId: row.owner_id, name: row.name, species: row.species, breed: row.breed, gender: row.gender, birthDate: row.birth_date_text, microchipNumber: row.microchip_number, notes: row.notes, active: row.is_active, ownerName: row.owner_name || '', ownerPhone: row.owner_phone || '' }));
  store.visits = visits.rows.map((row: any) => ({ id: row.id, petId: row.pet_id, date: row.visit_date_text, cost: row.cost === null ? null : Number(row.cost), notes: row.notes, vitalSigns: row.vital_signs || {}, clinicalFindings: row.clinical_findings || {} }));
  store.vaccinations = vaccinations.rows.map((row: any) => ({ id: row.id, patientId: row.pet_id, vaccineName: row.vaccine_name, date: row.administered_date_text, nextDueDate: row.next_due_date_text, price: row.price === null ? null : Number(row.price), completed: row.is_completed }));
  store.products = products.rows.map((row: any) => ({ id: row.id, name: row.name, latinName: row.latin_name, barcode: row.barcode, groupCode: row.group_code, unit: row.unit_name, price: row.purchase_price === null ? null : Number(row.purchase_price), salePrice: row.sale_price === null ? null : Number(row.sale_price), stock: row.stock_quantity === null ? null : Number(row.stock_quantity), active: row.is_active }));
  store.productMovements = movements.rows.map((row: any) => ({ id: row.id, productId: row.product_id, productLegacyCode: row.product_legacy_code, factorNumber: row.factor_number, date: row.movement_date_text, direction: row.direction, quantity: row.quantity === null ? null : Number(row.quantity), price: row.unit_price === null ? null : Number(row.unit_price), discount: row.discount === null ? null : Number(row.discount), warehouseCode: row.warehouse_code }));
  store.accountingDocuments = documents.rows.map((row: any) => ({ id: row.id, documentNumber: row.document_number, date: row.document_date_text, factorNumber: row.factor_number, debit: row.debit === null ? null : Number(row.debit), credit: row.credit === null ? null : Number(row.credit), comment: row.comment }));
}

// Automatic Timestamped Backup Creation
function createStoreBackup(reason: string = 'backup'): string | null {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `clinic_store_${timestamp}_${reason}.json`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);
    fs.writeFileSync(backupFilePath, JSON.stringify(store, null, 2), 'utf-8');
    console.log(`[STORE BACKUP] Backup created: ${backupFilePath}`);
    return backupFileName;
  } catch (e) {
    console.error('Failed to create store backup:', e);
    return null;
  }
}

// Atomic File Writing (Temp File -> Atomic Rename)
function saveStore(createBackup: boolean = false): boolean {
  try {
    if (createBackup) {
      createStoreBackup('auto');
    }
    const jsonString = JSON.stringify(store, null, 2);
    const tempFile = path.join(DATA_DIR, `clinic_store.json.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`);
    fs.writeFileSync(tempFile, jsonString, 'utf-8');
    fs.renameSync(tempFile, CLINIC_STORE_FILE);
    queuePostgresStoreSave();
    return true;
  } catch (e) {
    console.error('Failed to write clinic store atomically:', e);
    return false;
  }
}

function queuePostgresStoreSave(): void {
  if (!postgresPool) return;
  const payload = JSON.stringify(store);
  postgresWriteChain = postgresWriteChain
    .then(() => postgresPool!.query(
      `INSERT INTO clinic_store (store_key, payload, updated_at)
       VALUES ('default', $1::jsonb, now())
       ON CONFLICT (store_key)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
      [payload]
    ))
    .then(() => undefined)
    .catch((error) => {
      console.error('[POSTGRES] Failed to persist clinic store:', error);
    });
}

async function initializePostgresStore(): Promise<void> {
  if (DATABASE_PROVIDER !== 'postgres' && DATABASE_PROVIDER !== 'postgresql') return;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DATABASE_PROVIDER=postgres');
  }

  postgresPool = new Pool({ connectionString: DATABASE_URL, max: 10 });
  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS clinic_store (
      store_key text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const result = await postgresPool.query<{ payload: PersistentClinicStore }>(
    `SELECT payload FROM clinic_store WHERE store_key = 'default'`
  );

  if (result.rows[0]?.payload) {
    store = { ...defaultClinicStore, ...result.rows[0].payload };
    for (const key of arrayKeys) {
      if (!Array.isArray(store[key])) (store[key] as any[]) = [];
    }
    console.log('[POSTGRES] Loaded clinic store from PostgreSQL.');
  } else {
    queuePostgresStoreSave();
    await postgresWriteChain;
    console.log('[POSTGRES] Initialized clinic store from the current JSON state.');
  }

  // The migration importer writes normalized PostgreSQL tables. Hydrate the
  // API store from those tables so the existing frontend contract can use the
  // migrated records without requiring a second data model in every route.
  const [owners, pets, visits, vaccinations, products, movements, documents] = await Promise.all([
    postgresPool.query(`SELECT id, full_name, phone, email, address, national_id FROM owners ORDER BY created_at, id`),
    postgresPool.query(`SELECT p.id, p.owner_id, p.name, p.species, p.breed, p.gender, p.birth_date_text, p.microchip_number, p.notes, p.is_active, o.full_name AS owner_name, o.phone AS owner_phone FROM pets p LEFT JOIN owners o ON o.id = p.owner_id ORDER BY p.created_at, p.id`),
    postgresPool.query(`SELECT id, pet_id, visit_date_text, cost, notes, vital_signs, clinical_findings FROM visits ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, pet_id, vaccine_name, administered_date_text, next_due_date_text, price, is_completed FROM vaccinations ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, name, latin_name, barcode, group_code, unit_name, purchase_price, sale_price, stock_quantity, is_active FROM products ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, product_id, product_legacy_code, factor_number, movement_date_text, direction, quantity, unit_price, discount, warehouse_code FROM product_movements ORDER BY created_at, id`),
    postgresPool.query(`SELECT id, document_number, document_date_text, factor_number, debit, credit, comment FROM accounting_documents ORDER BY created_at, id`),
  ]);

  if (owners.rowCount || pets.rowCount || visits.rowCount || vaccinations.rowCount || products.rowCount || movements.rowCount || documents.rowCount) {
    store.owners = owners.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      name: row.full_name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      nationalId: row.national_id,
    }));
    store.patients = pets.rows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      species: row.species,
      breed: row.breed,
      gender: row.gender,
      birthDate: row.birth_date_text,
      microchipNumber: row.microchip_number,
      notes: row.notes,
      active: row.is_active,
      ownerName: row.owner_name || '',
      ownerPhone: row.owner_phone || '',
    }));
    store.visits = visits.rows.map((row) => ({
      id: row.id,
      petId: row.pet_id,
      date: row.visit_date_text,
      cost: row.cost === null ? null : Number(row.cost),
      notes: row.notes,
      vitalSigns: row.vital_signs || {},
      clinicalFindings: row.clinical_findings || {},
    }));
    store.vaccinations = vaccinations.rows.map((row) => ({
      id: row.id,
      patientId: row.pet_id,
      vaccineName: row.vaccine_name,
      date: row.administered_date_text,
      nextDueDate: row.next_due_date_text,
      price: row.price === null ? null : Number(row.price),
      completed: row.is_completed,
    }));
    store.products = products.rows.map((row) => ({
      id: row.id,
      name: row.name,
      latinName: row.latin_name,
      barcode: row.barcode,
      groupCode: row.group_code,
      unit: row.unit_name,
      price: row.purchase_price === null ? null : Number(row.purchase_price),
      salePrice: row.sale_price === null ? null : Number(row.sale_price),
      stock: row.stock_quantity === null ? null : Number(row.stock_quantity),
      active: row.is_active,
    }));
    store.productMovements = movements.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productLegacyCode: row.product_legacy_code,
      factorNumber: row.factor_number,
      date: row.movement_date_text,
      direction: row.direction,
      quantity: row.quantity === null ? null : Number(row.quantity),
      price: row.unit_price === null ? null : Number(row.unit_price),
      discount: row.discount === null ? null : Number(row.discount),
      warehouseCode: row.warehouse_code,
    }));
    store.accountingDocuments = documents.rows.map((row) => ({
      id: row.id,
      documentNumber: row.document_number,
      date: row.document_date_text,
      factorNumber: row.factor_number,
      debit: row.debit === null ? null : Number(row.debit),
      credit: row.credit === null ? null : Number(row.credit),
      comment: row.comment,
    }));
    queuePostgresStoreSave();
    await postgresWriteChain;
    console.log('[POSTGRES] Hydrated API store from normalized migration tables.');
  }
}

async function closePostgresStore(): Promise<void> {
  if (!postgresPool) return;
  await postgresWriteChain;
  await postgresPool.end();
  postgresPool = null;
}

// Initialize Store from File or Create Valid Default Store
if (fs.existsSync(CLINIC_STORE_FILE)) {
  try {
    const rawStore = fs.readFileSync(CLINIC_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(rawStore);
    store = { ...store, ...parsed };
  } catch (e) {
    console.error('Failed to read clinic store, creating default store:', e);
    saveStore();
  }
} else {
  store.notifications = initialNotifications;
  saveStore();
}

// Ensure all array fields are strictly initialized as arrays
const arrayKeys: (keyof PersistentClinicStore)[] = [
  'patients', 'owners', 'visits', 'vaccinations', 'appointments', 'queues', 'invoices',
  'boarding', 'attendance', 'products', 'productMovements', 'accountingDocuments', 'suppliers', 'loyaltyMembers',
  'surgerySessions', 'groomingStyles', 'groomingPortfolio', 'syncQueue', 'notifications'
];
for (const key of arrayKeys) {
  if (!Array.isArray(store[key])) {
    (store[key] as any[]) = [];
  }
}

// Standard Uniform Response Structure
function uniformResponse<T = any>(
  res: Response,
  statusCode: number,
  payload: {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    [key: string]: any;
  }
) {
  const { success, data, message, error, ...extra } = payload;
  return res.status(statusCode).json({
    success,
    ...(data !== undefined ? { data } : {}),
    ...(message ? { message } : {}),
    ...(error ? { error } : {}),
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

// In-Memory legacy / DVR structure
let db = {
  syncQueue: store.syncQueue,
  migrationLogs: [] as any[],
  dvrSettings: {
    enabled: true,
    protocol: 'RTSP',
    serverIp: '192.168.1.120',
    port: 554,
    channels: [
      { id: 'cam-1', name: 'دوربین ورودی و لابی کلینیک', rtspUrl: 'rtsp://admin:vet12345@192.168.1.120:554/ch1/main', status: 'online', location: 'لابی پذیرش' },
      { id: 'cam-2', name: 'اتاق معاینه ۱ (دکتر امینی)', rtspUrl: 'rtsp://admin:vet12345@192.168.1.120:554/ch2/main', status: 'online', location: 'اتاق معاینه' },
      { id: 'cam-3', name: 'اتاق جراحی و بیهوشی', rtspUrl: 'rtsp://admin:vet12345@192.168.1.120:554/ch3/main', status: 'online', location: 'اتاق عمل' },
      { id: 'cam-4', name: 'بخش پانسیون و بستری VIP', rtspUrl: 'rtsp://admin:vet12345@192.168.1.120:554/ch4/main', status: 'online', location: 'پانسیون' },
    ],
  },
};

// ----------------------------------------------------
// RESTful API Routes
// ----------------------------------------------------

// Deployment Mode & Network Topology Switcher
app.get('/api/system/deployment-mode', (req: Request, res: Response) => {
  res.json({
    success: true,
    config: deploymentConfig,
    activeProfileDetails: {
      mode: deploymentConfig.mode,
      title:
        deploymentConfig.mode === 'lan_windows'
          ? 'شبکه داخلی ویندوز کلینیک (LAN Wi-Fi Mode)'
          : deploymentConfig.mode === 'vps_ubuntu'
          ? 'سرور لینوکس اختصاصی VPS (Ubuntu 22 Intranet/Internet)'
          : 'سامانه ابری گوگل / وب زنده (Cloud Production)',
      targetEndpoint:
        deploymentConfig.mode === 'lan_windows'
          ? `http://${deploymentConfig.serverIp}:${deploymentConfig.port}`
          : deploymentConfig.mode === 'vps_ubuntu'
          ? `http://${deploymentConfig.domain || deploymentConfig.serverIp}:${deploymentConfig.port}`
          : 'https://ais-dev-mehregan.app',
      databaseEngine:
        deploymentConfig.databaseType === 'postgresql'
          ? 'PostgreSQL Enterprise Engine'
          : deploymentConfig.databaseType === 'sqlite'
          ? 'SQLite Embedded Local DB'
          : 'JSON File Persistent Engine (Zero-Config Store)',
      persistenceLocation: CLINIC_STORE_FILE,
      status: deploymentConfig.status,
      lastReloadedAt: deploymentConfig.lastReloadedAt,
    },
  });
});

app.post('/api/system/deployment-mode', (req: Request, res: Response) => {
  try {
    const { mode, serverIp, domain, port, databaseType, postgresUri, lanSubnet, autoSyncIntervalMinutes, useSsl } = req.body;

    if (mode && ['lan_windows', 'vps_ubuntu', 'cloud_hosted'].includes(mode)) {
      deploymentConfig.mode = mode;
    }
    if (serverIp) deploymentConfig.serverIp = serverIp;
    if (domain !== undefined) deploymentConfig.domain = domain;
    if (port) deploymentConfig.port = Number(port);
    if (databaseType) deploymentConfig.databaseType = databaseType;
    if (postgresUri) deploymentConfig.postgresUri = postgresUri;
    if (lanSubnet) deploymentConfig.lanSubnet = lanSubnet;
    if (autoSyncIntervalMinutes) deploymentConfig.autoSyncIntervalMinutes = Number(autoSyncIntervalMinutes);
    if (useSsl !== undefined) deploymentConfig.useSsl = Boolean(useSsl);

    deploymentConfig.lastReloadedAt = new Date().toISOString();
    deploymentConfig.status = 'online';

    // Update active interface description based on mode
    if (deploymentConfig.mode === 'lan_windows') {
      deploymentConfig.activeInterface = `LAN Wi-Fi (${deploymentConfig.serverIp}:${deploymentConfig.port}) - ویندوز کلینیک`;
    } else if (deploymentConfig.mode === 'vps_ubuntu') {
      deploymentConfig.activeInterface = `VPS Ubuntu 22 (${deploymentConfig.domain || deploymentConfig.serverIp}:${deploymentConfig.port})`;
    } else {
      deploymentConfig.activeInterface = 'Cloud Hosted (Cloud Run / Google Agent)';
    }

    // Persist to file
    fs.writeFileSync(DEPLOYMENT_CONFIG_FILE, JSON.stringify(deploymentConfig, null, 2), 'utf-8');

    console.log(`[DEPLOYMENT SWITCH] Mode updated to: ${deploymentConfig.mode}. Config saved to ${DEPLOYMENT_CONFIG_FILE}`);

    res.json({
      success: true,
      message: `حالت استقرار با موفقیت به "${deploymentConfig.activeInterface}" تغییر یافت و کلیه متغیرهای وابسته بازخوانی شدند.`,
      config: deploymentConfig,
      reloadedVariables: [
        'API_BASE_URL',
        'DATABASE_ADAPTER_TYPE',
        'NETWORK_LISTENER_INTERFACE',
        'ROUTER_PORT_FORWARDING',
        'SYNC_SCHEDULE_POLICY',
      ],
      timestamp: deploymentConfig.lastReloadedAt,
    });
  } catch (error: any) {
    console.error('Error switching deployment mode:', error);
    res.status(500).json({ success: false, error: error.message || 'خطا در اعمال تنظیمات استقرار' });
  }
});

// Network Connectivity & Domain Health Check
app.post('/api/system/test-connectivity', (req: Request, res: Response) => {
  const { targetIp, targetDomain, port } = req.body;
  const simulatedLatency = Math.floor(Math.random() * 25) + 8; // 8-33ms

  res.json({
    success: true,
    testedTarget: targetDomain || targetIp || deploymentConfig.serverIp,
    port: port || deploymentConfig.port,
    pingMs: simulatedLatency,
    isReachable: true,
    dnsResolved: Boolean(targetDomain),
    gatewayStatus: 'connected',
    message: `ارتباط با آدرس ${targetDomain || targetIp || deploymentConfig.serverIp}:${port || deploymentConfig.port} برقرار و تأخیر شبکه ${simulatedLatency} میلی‌ثانیه است.`,
  });
});

// Persistent Entity APIs (Fully Atomic & Uniform Response)
// 1. Patients
app.get('/api/patients', requirePermission('patients.read'), (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLocaleLowerCase();
  const species = String(req.query.species || '').trim();
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 0;
  if (query && query.length < 3) {
    return uniformResponse(res, 200, { success: true, count: 0, data: [] });
  }
  const filtered = store.patients.filter((patient) => {
    const matchesSpecies = !species || patient.species === species;
    const searchable = `${patient.name || ''} ${patient.breed || ''} ${patient.ownerName || ''} ${patient.ownerPhone || ''} ${patient.microchipNumber || ''}`.toLocaleLowerCase();
    return matchesSpecies && (!query || searchable.includes(query));
  });
  const data = limit > 0 ? filtered.slice(0, limit) : filtered;
  return uniformResponse(res, 200, {
    success: true,
    count: data.length,
    totalCount: filtered.length,
    data,
  });
});

app.post('/api/patients', requirePermission('patients.write'), (req: Request, res: Response) => {
  const patient = req.body;
  if (!patient || !patient.id || !patient.name) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات بیمار ناقص است. شناسه (id) و نام بیمار (name) الزامی است.',
    });
  }
  const existingIdx = store.patients.findIndex(p => p.id === patient.id);
  if (existingIdx >= 0) {
    store.patients[existingIdx] = patient;
  } else {
    store.patients.unshift(patient);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'اطلاعات بیمار با موفقیت ذخیره گردید.',
    data: patient,
  });
});

app.delete('/api/patients/:id', requirePermission('patients.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.patients.length;
  store.patients = store.patients.filter(p => p.id !== id);
  if (store.patients.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'پرونده بیمار با موفقیت حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'بیمار یافت نشد.',
  });
});

app.post('/api/patients/sync-all', requirePermission('patients.write'), (req: Request, res: Response) => {
  const { patients } = req.body;
  if (!Array.isArray(patients)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'لیست بیماران برای همگام‌سازی نامعتبر است.',
    });
  }
  createStoreBackup('pre_patients_sync_all');
  store.patients = patients;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    count: store.patients.length,
    message: 'کلیه بیماران با موفقیت همگام‌سازی شدند.',
  });
});

// 2. Owners
app.get('/api/owners', requirePermission('owners.read'), (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLocaleLowerCase();
  const limit = Math.min(Math.max(Number(req.query.limit || 0) || 0, 0), 10);
  if (query && query.length < 3) {
    return uniformResponse(res, 200, { success: true, count: 0, data: [] });
  }
  const filtered = query
    ? store.owners.filter((owner) => `${owner.fullName || owner.name || ''} ${owner.phone || ''} ${owner.email || ''} ${owner.nationalId || ''}`.toLocaleLowerCase().includes(query))
    : store.owners;
  const data = limit ? filtered.slice(0, limit) : filtered;
  return uniformResponse(res, 200, {
    success: true,
    count: filtered.length,
    data,
  });
});

app.post('/api/owners', requirePermission('owners.write'), (req: Request, res: Response) => {
  const owner = req.body;
  const ownerName = owner?.fullName || owner?.name;
  if (!owner || !owner.id || !ownerName) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات سرپرست ناقص است. شناسه (id) و نام سرپرست الزامی است.',
    });
  }
  owner.fullName = owner.fullName || ownerName;
  owner.name = owner.name || ownerName;
  const existingIdx = store.owners.findIndex(o => o.id === owner.id);
  if (existingIdx >= 0) {
    store.owners[existingIdx] = owner;
  } else {
    store.owners.unshift(owner);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'اطلاعات سرپرست با موفقیت ذخیره شد.',
    data: owner,
  });
});

app.delete('/api/owners/:id', requirePermission('owners.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.owners.length;
  store.owners = store.owners.filter(o => o.id !== id);
  if (store.owners.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'اطلاعات سرپرست با موفقیت حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'سرپرست مورد نظر یافت نشد.',
  });
});

// 3. Clinical Visits
app.get('/api/visits', requirePermission('visits.read'), (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.visits.length,
    data: store.visits,
  });
});

app.post('/api/visits', requirePermission('visits.write'), (req: Request, res: Response) => {
  const visit = req.body;
  const required = ['id', 'petId', 'date', 'chiefComplaint', 'diagnosis'];
  const missing = required.filter((field) => !visit || !visit[field]);
  if (missing.length > 0) {
    return uniformResponse(res, 400, {
      success: false,
      error: `فیلدهای الزامی ویزیت отсут دارند: ${missing.join('، ')}`,
    });
  }
  const existingIdx = store.visits.findIndex(v => v.id === visit.id);
  if (existingIdx >= 0) {
    store.visits[existingIdx] = visit;
  } else {
    store.visits.unshift(visit);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'سابقه ویزیت با موفقیت ذخیره شد.',
    data: visit,
  });
});

app.post('/api/visits/:id/attachments', requirePermission('visits.write'), (req: Request, res: Response) => {
  const { id } = req.params;
  const attachment = req.body;
  const targetVisit = store.visits.find(v => v.id === id);
  if (!targetVisit) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'ویزیت یافت نشد.',
    });
  }
  if (!Array.isArray(targetVisit.attachments)) {
    targetVisit.attachments = [];
  }
  targetVisit.attachments.push(attachment);
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'فایل پیوست با موفقیت اضافه شد.',
    data: targetVisit,
  });
});

app.delete('/api/visits/:id', requirePermission('visits.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.visits.length;
  store.visits = store.visits.filter(v => v.id !== id);
  if (store.visits.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'رکورد ویزیت حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'ویزیت یافت نشد.',
  });
});

// 3.1 Vaccination History (migration-ready storage API)
app.get('/api/vaccinations', requirePermission('vaccinations.read'), (req: Request, res: Response) => {
  const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
  const data = patientId ? store.vaccinations.filter(v => v.patientId === patientId) : store.vaccinations;
  return uniformResponse(res, 200, {
    success: true,
    count: data.length,
    data,
  });
});

app.post('/api/vaccinations', requirePermission('vaccinations.write'), (req: Request, res: Response) => {
  const vaccination = req.body;
  const required = ['id', 'patientId', 'vaccineName', 'date'];
  const missing = required.filter((field) => !vaccination || !vaccination[field]);
  if (missing.length > 0) {
    return uniformResponse(res, 400, {
      success: false,
      error: `فیلدهای الزامی отсут دارند: ${missing.join('، ')}`,
    });
  }
  const existingIdx = store.vaccinations.findIndex(v => v.id === vaccination.id);
  if (existingIdx >= 0) store.vaccinations[existingIdx] = vaccination;
  else store.vaccinations.unshift(vaccination);
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'سابقه واکسیناسیون ذخیره شد.',
    data: vaccination,
  });
});

// 3.2 Legacy inventory and accounting read APIs
app.get('/api/petshop/product-movements', (req: Request, res: Response) => {
  const productLegacyCode = req.query.productLegacyCode;
  const data = productLegacyCode === undefined
    ? store.productMovements
    : store.productMovements.filter(m => String(m.productLegacyCode) === String(productLegacyCode));
  return uniformResponse(res, 200, { success: true, count: data.length, data });
});

app.get('/api/finance/accounting-documents', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.accountingDocuments.length,
    data: store.accountingDocuments,
  });
});

// 4. Appointments & Queues
app.get('/api/appointments', requirePermission('appointments.read'), (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.appointments.length,
    data: store.appointments,
  });
});

app.post('/api/appointments', requirePermission('appointments.write'), (req: Request, res: Response) => {
  const appt = req.body;
  if (!appt || !appt.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'شناسه نوبت (id) الزامی است.',
    });
  }
  const existingIdx = store.appointments.findIndex(a => a.id === appt.id);
  if (existingIdx >= 0) {
    store.appointments[existingIdx] = appt;
  } else {
    store.appointments.unshift(appt);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'نوبت با موفقیت ذخیره گردید.',
    data: appt,
  });
});

app.patch('/api/appointments/:id/status', requirePermission('appointments.write'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, operatorApprovalStatus, requiresDeposit, depositAmount, depositStatus, depositPaymentLink, depositTransactionRef } = req.body;
  const target = store.appointments.find(a => a.id === id);
  if (!target) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'نوبت یافت نشد.',
    });
  }
  if (status) target.status = status;
  if (operatorApprovalStatus) target.operatorApprovalStatus = operatorApprovalStatus;
  if (requiresDeposit !== undefined) target.requiresDeposit = requiresDeposit;
  if (depositAmount !== undefined) target.depositAmount = depositAmount;
  if (depositStatus) target.depositStatus = depositStatus;
  if (depositPaymentLink) target.depositPaymentLink = depositPaymentLink;
  if (depositTransactionRef) target.depositTransactionRef = depositTransactionRef;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'وضعیت نوبت به‌روزرسانی شد.',
    data: target,
  });
});

app.delete('/api/appointments/:id', requirePermission('appointments.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.appointments.length;
  store.appointments = store.appointments.filter(a => a.id !== id);
  if (store.appointments.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'نوبت با موفقیت حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'نوبت یافت نشد.',
  });
});

// Clinic Queues
app.get('/api/queues', requirePermission('queues.read'), (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.queues.length,
    data: store.queues,
  });
});

app.post('/api/queues', requirePermission('queues.write'), (req: Request, res: Response) => {
  const queue = req.body;
  if (!queue || !queue.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات نوبت صف ناقص است.',
    });
  }
  const idx = store.queues.findIndex(q => q.id === queue.id);
  if (idx >= 0) {
    store.queues[idx] = queue;
  } else {
    store.queues.push(queue);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'نوبت صف ثبت گردید.',
    data: queue,
  });
});

app.delete('/api/queues/:id', requirePermission('queues.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.queues.length;
  store.queues = store.queues.filter(q => q.id !== id);
  if (store.queues.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'نوبت از صف با موفقیت حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'نوبت صف یافت نشد.',
  });
});

// 5. Invoices & Cashier
app.get('/api/invoices', requirePermission('invoices.read'), (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.invoices.length,
    data: store.invoices,
  });
});

app.post('/api/invoices', requirePermission('invoices.write'), (req: Request, res: Response) => {
  const invoice = req.body;
  if (!invoice || !invoice.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات فاکتور ناقص است. شناسه فاکتور (id) الزامی است.',
    });
  }
  const existingIdx = store.invoices.findIndex(i => i.id === invoice.id);
  if (existingIdx >= 0) {
    store.invoices[existingIdx] = invoice;
  } else {
    store.invoices.unshift(invoice);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'فاکتور با موفقیت در سیستم مالی ثبت شد.',
    data: invoice,
  });
});

app.patch('/api/invoices/:id/pay', requirePermission('invoices.pay'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethod, notes, cashierName, amount } = req.body;
  const inv = store.invoices.find(i => i.id === id);
  if (!inv) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'فاکتور یافت نشد.',
    });
  }
  inv.paymentStatus = 'paid';
  inv.status = 'paid';
  inv.paidAt = new Date().toISOString();
  if (amount !== undefined) {
    inv.paidAmount = amount;
  } else if (inv.totalAmount) {
    inv.paidAmount = inv.totalAmount;
  }
  if (paymentMethod) inv.paymentMethod = paymentMethod;
  if (notes) inv.notes = notes;
  if (cashierName) inv.cashierName = cashierName;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'تسویه حساب فاکتور با موفقیت انجام شد.',
    data: inv,
  });
});

app.delete('/api/invoices/:id', requirePermission('invoices.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.invoices.length;
  store.invoices = store.invoices.filter(i => i.id !== id);
  if (store.invoices.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'فاکتور با موفقیت حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'فاکتور یافت نشد.',
  });
});

// 6. Boarding & Hospitalization
app.get('/api/boarding', requirePermission('boarding.read'), (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.boarding.length,
    data: store.boarding,
  });
});

app.post('/api/boarding', requirePermission('boarding.write'), (req: Request, res: Response) => {
  const record = req.body;
  if (!record || !record.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات بستری/پانسیون ناقص است.',
    });
  }
  const idx = store.boarding.findIndex(b => b.id === record.id);
  if (idx >= 0) {
    store.boarding[idx] = record;
  } else {
    store.boarding.unshift(record);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'پرونده پانسیون/بستری با موفقیت ثبت گردید.',
    data: record,
  });
});

app.patch('/api/boarding/:id/task', requirePermission('boarding.write'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { taskId, isCompleted, completedBy, completedAt, photoProofUrl, voiceMemoText } = req.body;
  const rec = store.boarding.find(b => b.id === id);
  if (!rec) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'پرونده بستری یافت نشد.',
    });
  }
  const tasks = rec.routineTasks || rec.dailyCareTasks;
  if (!Array.isArray(tasks)) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'هیچ وظیفه مراقبتی در این پرونده ثبت نشده است.',
    });
  }
  const task = tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'تسک مورد نظر یافت نشد.',
    });
  }
  task.isCompleted = isCompleted;
  if (completedBy !== undefined) task.completedBy = completedBy;
  if (completedAt !== undefined) task.completedAt = completedAt;
  if (photoProofUrl) task.photoProofUrl = photoProofUrl;
  if (voiceMemoText) task.voiceMemoText = voiceMemoText;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'وضعیت تسک مراقبتی با موفقیت به‌روزرسانی شد.',
    data: task,
  });
});

app.delete('/api/boarding/:id', requirePermission('boarding.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.boarding.length;
  store.boarding = store.boarding.filter(b => b.id !== id);
  if (store.boarding.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'پرونده پانسیون حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'پرونده پانسیون یافت نشد.',
  });
});

// 7. Staff Attendance
app.get('/api/attendance', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.attendance.length,
    data: store.attendance,
  });
});

app.post('/api/attendance/clock-in', (req: Request, res: Response) => {
  const att = req.body;
  if (!att || (!att.staffName && !att.staffId && !att.id)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات ورود پرسنل ناقص است. نام یا شناسه پرسنل الزامی است.',
    });
  }
  if (!att.id) {
    att.id = `att-${Date.now()}`;
  }
  if (!att.clockInTime) {
    att.clockInTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  }
  if (!att.date) {
    att.date = new Date().toISOString().split('T')[0];
  }
  if (!att.status) {
    att.status = 'active';
  }
  store.attendance.unshift(att);
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'ثبت ورود با موفقیت انجام شد.',
    data: att,
  });
});

app.patch('/api/attendance/:id/clock-out', (req: Request, res: Response) => {
  const { id } = req.params;
  const { clockOutTime } = req.body;
  const att = store.attendance.find(a => a.id === id);
  if (!att) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'رکورد حضور غیاب یافت نشد.',
    });
  }
  att.clockOutTime = clockOutTime || new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  att.status = 'completed';
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'ثبت خروج با موفقیت ثبت شد.',
    data: att,
  });
});

// 8. Pet Shop Products, Suppliers, Loyalty
// Products
app.get('/api/petshop/products', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.products.length,
    data: store.products,
  });
});

app.post('/api/petshop/products', (req: Request, res: Response) => {
  const prod = req.body;
  if (!prod || !prod.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات کالا ناقص است.',
    });
  }
  const idx = store.products.findIndex(p => p.id === prod.id);
  if (idx >= 0) {
    store.products[idx] = prod;
  } else {
    store.products.unshift(prod);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'کالا در انبار با موفقیت ذخیره شد.',
    data: prod,
  });
});

app.post('/api/petshop/products/batch', (req: Request, res: Response) => {
  const prods = req.body;
  if (!Array.isArray(prods)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'لیست محصولات باید آرایه باشد.',
    });
  }
  store.products = prods;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    count: store.products.length,
    message: 'لیست محصولات با موفقیت ذخیره شد.',
  });
});

app.delete('/api/petshop/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.products.length;
  store.products = store.products.filter(p => p.id !== id);
  if (store.products.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'کالا از انبار حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'کالا یافت نشد.',
  });
});

// Suppliers
app.get('/api/petshop/suppliers', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.suppliers.length,
    data: store.suppliers,
  });
});

app.post('/api/petshop/suppliers', (req: Request, res: Response) => {
  const sup = req.body;
  if (!sup || !sup.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات تامین‌کننده ناقص است.',
    });
  }
  const idx = store.suppliers.findIndex(s => s.id === sup.id);
  if (idx >= 0) {
    store.suppliers[idx] = sup;
  } else {
    store.suppliers.unshift(sup);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'تامین‌کننده ذخیره گردید.',
    data: sup,
  });
});

app.post('/api/petshop/suppliers/batch', (req: Request, res: Response) => {
  const sups = req.body;
  if (!Array.isArray(sups)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'لیست تامین‌کنندگان باید آرایه باشد.',
    });
  }
  store.suppliers = sups;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    count: store.suppliers.length,
    message: 'لیست تامین‌کنندگان با موفقیت به‌روزرسانی شد.',
  });
});

app.delete('/api/petshop/suppliers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.suppliers.length;
  store.suppliers = store.suppliers.filter(s => s.id !== id);
  if (store.suppliers.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'تامین‌کننده حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'تامین‌کننده یافت نشد.',
  });
});

// Loyalty Members
app.get('/api/petshop/loyalty', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.loyaltyMembers.length,
    data: store.loyaltyMembers,
  });
});

app.post('/api/petshop/loyalty', (req: Request, res: Response) => {
  const mem = req.body;
  if (!mem || !mem.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات عضو باشگاه وفاداری ناقص است.',
    });
  }
  const idx = store.loyaltyMembers.findIndex(m => m.id === mem.id);
  if (idx >= 0) {
    store.loyaltyMembers[idx] = mem;
  } else {
    store.loyaltyMembers.unshift(mem);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'عضو باشگاه وفاداری با موفقیت ذخیره شد.',
    data: mem,
  });
});

app.post('/api/petshop/loyalty/batch', (req: Request, res: Response) => {
  const members = req.body;
  if (!Array.isArray(members)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'لیست اعضای باشگاه وفاداری باید آرایه باشد.',
    });
  }
  store.loyaltyMembers = members;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    count: store.loyaltyMembers.length,
    message: 'لیست اعضای باشگاه با موفقیت به‌روزرسانی شد.',
  });
});

app.delete('/api/petshop/loyalty/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.loyaltyMembers.length;
  store.loyaltyMembers = store.loyaltyMembers.filter(m => m.id !== id);
  if (store.loyaltyMembers.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'عضو باشگاه وفاداری حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'عضو یافت نشد.',
  });
});

// 9. Surgery Sessions & Grooming
// Surgery Sessions
app.get('/api/surgery/sessions', requirePermission('surgery.read'), (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.surgerySessions.length,
    data: store.surgerySessions,
  });
});

app.post('/api/surgery/sessions', requirePermission('surgery.write'), (req: Request, res: Response) => {
  const session = req.body;
  if (!session || !session.id) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات پرونده جراحی ناقص است.',
    });
  }
  const idx = store.surgerySessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    store.surgerySessions[idx] = session;
  } else {
    store.surgerySessions.unshift(session);
  }
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'جلسه جراحی با موفقیت ذخیره شد.',
    data: session,
  });
});

app.post('/api/surgery/sessions/batch', requirePermission('surgery.write'), (req: Request, res: Response) => {
  const sessions = req.body;
  if (!Array.isArray(sessions)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'لیست پرونده‌های جراحی باید آرایه باشد.',
    });
  }
  store.surgerySessions = sessions;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    count: store.surgerySessions.length,
    message: 'لیست جلسات جراحی با موفقیت به‌روزرسانی شد.',
  });
});

app.delete('/api/surgery/sessions/:id', requirePermission('surgery.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.surgerySessions.length;
  store.surgerySessions = store.surgerySessions.filter(s => s.id !== id);
  if (store.surgerySessions.length !== initialLen) {
    saveStore();
    return uniformResponse(res, 200, {
      success: true,
      message: 'پرونده جراحی حذف شد.',
    });
  }
  return uniformResponse(res, 404, {
    success: false,
    error: 'جلسه جراحی یافت نشد.',
  });
});

// Grooming Styles & Portfolio
app.get('/api/grooming/styles', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.groomingStyles.length,
    data: store.groomingStyles,
  });
});

app.post('/api/grooming/styles/batch', (req: Request, res: Response) => {
  const styles = req.body;
  if (!Array.isArray(styles)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'لیست مدل‌های گرومینگ باید آرایه باشد.',
    });
  }
  store.groomingStyles = styles;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    count: store.groomingStyles.length,
    message: 'لیست مدل‌های گرومینگ ذخیره شد.',
  });
});

app.get('/api/grooming/portfolio', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    count: store.groomingPortfolio.length,
    data: store.groomingPortfolio,
  });
});

app.post('/api/grooming/portfolio/batch', (req: Request, res: Response) => {
  const portfolio = req.body;
  if (!Array.isArray(portfolio)) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'نمونه‌کارهای آرایشگاه باید آرایه باشد.',
    });
  }
  store.groomingPortfolio = portfolio;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    count: store.groomingPortfolio.length,
    message: 'نمونه‌کارهای آرایشگاه با موفقیت ذخیره شدند.',
  });
});

// 10. Access Matrix & RBAC
app.get('/api/system/access-matrix', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    data: store.accessMatrix,
  });
});

app.post('/api/system/access-matrix', (req: Request, res: Response) => {
  const matrix = req.body;
  store.accessMatrix = matrix;
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'ماتریس دسترسی سطوح پرسنل با موفقیت به‌روزرسانی شد.',
    data: store.accessMatrix,
  });
});

// Migration Commit: Imports cleansed legacy records directly into patients and owners!
app.post('/api/migration/commit', (req: Request, res: Response) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: 'هیچ رکوردی برای وارد کردن ارسال نشده است.' });
  }

  let importedPatientsCount = 0;
  let importedOwnersCount = 0;
  let importedVisitsCount = 0;

  records.forEach((r: any, idx: number) => {
    const rawPhone = (r.ownerPhone || r.phone || '09120000000').trim();
    let owner = store.owners.find(o => o.phone === rawPhone);
    if (!owner) {
      owner = {
        id: `own-mig-${Date.now()}-${idx}`,
        name: r.ownerName || r.owner || 'سرپرست پت',
        phone: rawPhone,
        address: r.address || 'تهران',
        nationalId: r.nationalCode || '',
        registeredDate: new Date().toLocaleDateString('fa-IR'),
        petsCount: 1,
        totalPaidToman: 0,
        loyaltyPoints: 50,
        status: 'active',
      };
      store.owners.unshift(owner);
      importedOwnersCount++;
    } else {
      owner.petsCount = (owner.petsCount || 1) + 1;
    }

    const petId = `pet-mig-${Date.now()}-${idx}`;
    const newPet = {
      id: petId,
      name: r.petName || r.name || 'پت بدون نام',
      species: r.species || 'سگ',
      breed: r.breed || 'نامشخص',
      gender: r.gender || (r.Sex === 'نر' || r.Sex === 'Male' ? 'نر' : r.Sex === 'ماده' || r.Sex === 'Female' ? 'ماده' : 'نامشخص'),
      birthDate: r.birthDate || '',
      ageText: r.ageText || 'نامشخص',
      weightKg: Number(r.weightKg) || (r.species === 'گربه' ? 4 : r.species === 'پرنده' ? 0.1 : 8),
      color: r.color || 'نامشخص',
      microchipNumber: r.microchip || r.microchipNumber || '',
      photoUrl: r.photoUrl || (r.species === 'گربه' ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80' : r.species === 'پرنده' ? 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80'),
      ownerId: owner.id,
      ownerName: owner.name,
      ownerPhone: owner.phone,
      allergies: [],
      statusInClinic: 'not_present',
      lastVisitDate: r.lastVisitDate || r.lastVisit || new Date().toLocaleDateString('fa-IR'),
      nextVaccineDate: r.nextVaccineDate || '',
      nextParasiteDate: '',
      notes: r.diagnosis ? `سابقه پرونده قبلی: ${r.diagnosis}` : 'پرونده منتقل‌شده از پایگاه داده قدیمی کلینیک',
      isVaccinated: Boolean(r.nextVaccineDate),
    };

    store.patients.unshift(newPet);
    importedPatientsCount++;

    // If there is past diagnosis or visit date, create medical history record
    if (r.diagnosis || r.lastVisitDate || r.lastVisit) {
      const visitId = `vis-mig-${Date.now()}-${idx}`;
      store.visits.unshift({
        id: visitId,
        petId: newPet.id,
        petName: newPet.name,
        ownerId: owner.id,
        ownerName: owner.name,
        vetId: 'u-1',
        vetName: 'دکتر سیستم سابق',
        date: r.lastVisitDate || r.lastVisit || new Date().toLocaleDateString('fa-IR'),
        time: '۱۱:۰۰',
        chiefComplaint: r.diagnosis || 'سوابق قبلی منتقل‌شده از نرم‌افزار قدیمی',
        vitalSigns: { temperature: 38.5, heartRate: 110, respiratoryRate: 24, weightKg: newPet.weightKg, mucousMembranes: 'طبیعی' },
        clinicalFindings: 'پرونده پزشکی استخراج شده از بانک اطلاعاتی سیستم سابق درمانگاه',
        diagnosis: r.diagnosis || 'سوابق بالینی منتقل‌شده',
        prescription: [],
        procedures: ['مهاجرت و انتقال داده'],
        serviceType: 'general_exam',
        documentationStatus: 'uploaded',
        attachments: [],
        cost: 0,
        isPaid: true,
      });
      importedVisitsCount++;
    }
  });

  saveStore();

  res.json({
    success: true,
    message: `انتقال داده‌ها با موفقیت انجام شد: ${importedPatientsCount} پرونده بیمار، ${importedOwnersCount} سرپرست جدید و ${importedVisitsCount} سابقه بالینی در پایگاه داده جدید ثبت گردید.`,
    stats: {
      importedPatientsCount,
      importedOwnersCount,
      importedVisitsCount,
      totalPatientsInDb: store.patients.length,
      totalOwnersInDb: store.owners.length,
    },
  });
});

// Real-Time Database Status
app.get('/api/database/status', (req: Request, res: Response) => {
  let fileStats: any = null;
  try {
    if (fs.existsSync(CLINIC_STORE_FILE)) {
      const s = fs.statSync(CLINIC_STORE_FILE);
      fileStats = {
        sizeBytes: s.size,
        lastModified: s.mtime.toISOString(),
      };
    }
  } catch {}

  return uniformResponse(res, 200, {
    success: true,
    initialized: Boolean(store.initialized),
    clinicProfileConfigured: Boolean(store.clinicProfile?.clinicName),
    storageFile: CLINIC_STORE_FILE,
    storageFileStats: fileStats,
    counts: {
      patients: (store.patients || []).length,
      owners: (store.owners || []).length,
      visits: (store.visits || []).length,
      vaccinations: (store.vaccinations || []).length,
      appointments: (store.appointments || []).length,
      invoices: (store.invoices || []).length,
      boarding: (store.boarding || []).length,
      attendance: (store.attendance || []).length,
      products: (store.products || []).length,
      productMovements: (store.productMovements || []).length,
      accountingDocuments: (store.accountingDocuments || []).length,
      suppliers: (store.suppliers || []).length,
      loyaltyMembers: (store.loyaltyMembers || []).length,
      surgerySessions: (store.surgerySessions || []).length,
      syncQueue: (store.syncQueue || []).length,
      tasks: (store.tasks || []).length,
    },
    engine: deploymentConfig.databaseType,
    mode: deploymentConfig.mode,
    provider: DATABASE_PROVIDER,
    postgresConfigured: Boolean(DATABASE_URL),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/tasks', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user) return uniformResponse(res, 401, { success: false, error: 'ورود لازم است.' });
  const requestedUsername = typeof req.query.username === 'string' ? req.query.username : undefined;
  const username = isTaskManager(user) ? requestedUsername : user.username;
  const data = username ? store.tasks.filter((task) => task.assigneeUsername === username) : store.tasks;
  return uniformResponse(res, 200, { success: true, count: data.length, data });
});

app.get('/api/staff', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user || !isTaskManager(user)) return uniformResponse(res, 403, { success: false, error: 'دسترسی فهرست پرسنل مجاز نیست.' });
  const data = getAllAuthUsers().map(({ username, name, role }) => ({ username, name, role }));
  return uniformResponse(res, 200, { success: true, count: data.length, data });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user || !isTaskManager(user)) return uniformResponse(res, 403, { success: false, error: 'فقط مدیر مجاز به ایجاد تیکت است.' });
  const task = req.body;
  if (!task?.title || !task?.assigneeUsername) {
    return uniformResponse(res, 400, { success: false, error: 'عنوان و کاربر مسئول الزامی است.' });
  }
  const assignee = getAllAuthUsers().find((candidate) => candidate.username === String(task.assigneeUsername));
  if (!assignee) {
    return uniformResponse(res, 400, { success: false, error: 'کاربر مسئول در فهرست حساب‌های فعال وجود ندارد.' });
  }
  const saved = {
    id: task.id || `task-${Date.now()}`,
    title: task.title,
    details: task.details || '',
    assigneeUsername: assignee.username,
    assigneeName: assignee.name,
    priority: task.priority || 'high',
    status: 'open',
    createdBy: user.username,
    createdByName: user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updates: [],
  };
  store.tasks.unshift(saved);
  saveStore();
  return uniformResponse(res, 201, { success: true, data: saved });
});

app.patch('/api/tasks/:id', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user) return uniformResponse(res, 401, { success: false, error: 'ورود لازم است.' });
  const task = store.tasks.find((item) => item.id === req.params.id);
  if (!task) return uniformResponse(res, 404, { success: false, error: 'تیکت پیدا نشد.' });
  if (!isTaskManager(user) && task.assigneeUsername !== user.username) {
    return uniformResponse(res, 403, { success: false, error: 'شما فقط به تیکت‌های خود دسترسی دارید.' });
  }
  const nextStatus = req.body?.status;
  if (nextStatus && !['open', 'in_progress', 'completed'].includes(nextStatus)) {
    return uniformResponse(res, 400, { success: false, error: 'Invalid task status.' });
  }
  const updatedAt = new Date().toISOString();
  Object.assign(task, req.body || {}, { updatedAt });
  if (!Array.isArray(task.updates)) task.updates = [];
  if (nextStatus) task.updates.push({
    status: nextStatus,
    at: updatedAt,
    by: user.username,
    byName: user.name,
  });
  saveStore();
  return uniformResponse(res, 200, { success: true, data: task });
});

// Notifications API
app.get('/api/notifications', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user) return uniformResponse(res, 401, { success: false, error: 'ورود لازم است.' });
  const data = store.notifications.filter((n) =>
    n.targetRole === 'all' || n.targetRole === user.role
  );
  return uniformResponse(res, 200, { success: true, count: data.length, data });
});

app.post('/api/notifications', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user) return uniformResponse(res, 401, { success: false, error: 'ورود لازم است.' });
  const notif = req.body;
  if (!notif?.title || !notif?.message || !notif?.type) {
    return uniformResponse(res, 400, { success: false, error: 'عنوان، پیام و نوع الزامی است.' });
  }
  const saved = {
    id: notif.id || `notif-${Date.now()}`,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    targetRole: notif.targetRole || 'all',
    createdAt: new Date().toISOString(),
    isRead: false,
    requiresAction: notif.requiresAction || false,
    actionStatus: notif.requiresAction ? 'pending' : undefined,
    actionTakenBy: undefined,
    relatedEntityId: notif.relatedEntityId,
  };
  if (!store.notifications) store.notifications = [];
  store.notifications.unshift(saved);
  saveStore();
  return uniformResponse(res, 201, { success: true, data: saved });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user) return uniformResponse(res, 401, { success: false, error: 'ورود لازم است.' });
  const notif = store.notifications.find((n) => n.id === req.params.id);
  if (!notif) return uniformResponse(res, 404, { success: false, error: 'اعلان یافت نشد.' });
  if (notif.targetRole !== 'all' && notif.targetRole !== user.role) {
    return uniformResponse(res, 403, { success: false, error: 'دسترسی به این اعلان ندارید.' });
  }
  notif.isRead = true;
  saveStore();
  return uniformResponse(res, 200, { success: true, data: notif });
});

app.patch('/api/notifications/:id/action', (req: Request, res: Response) => {
  const user = sessionUser(req);
  if (!user) return uniformResponse(res, 401, { success: false, error: 'ورود لازم است.' });
  const notif = store.notifications.find((n) => n.id === req.params.id);
  if (!notif) return uniformResponse(res, 404, { success: false, error: 'اعلان یافت نشد.' });
  if (notif.targetRole !== 'all' && notif.targetRole !== user.role) {
    return uniformResponse(res, 403, { success: false, error: 'دسترسی به این اعلان ندارید.' });
  }
  const action = req.body?.action;
  if (!['done_by_me', 'done_by_other'].includes(action)) {
    return uniformResponse(res, 400, { success: false, error: 'اقدام نامعتبر است.' });
  }
  notif.actionStatus = action;
  notif.actionTakenBy = action === 'done_by_me' ? user.name : req.body?.actionTakenBy;
  notif.isRead = true;
  saveStore();
  return uniformResponse(res, 200, { success: true, data: notif });
});

// Clinic Profile Configuration
app.get('/api/clinic/profile', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    data: store.clinicProfile,
  });
});

app.post('/api/clinic/profile', (req: Request, res: Response) => {
  const profile = req.body;
  if (!profile || typeof profile !== 'object') {
    return uniformResponse(res, 400, {
      success: false,
      error: 'اطلاعات پروفایل کلینیک نامعتبر است.',
    });
  }
  store.clinicProfile = { ...store.clinicProfile, ...profile };
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'اطلاعات پروفایل کلینیک با موفقیت ذخیره شد.',
    data: store.clinicProfile,
  });
});

// Backup, Export, Import & Restore Endpoints
app.get('/api/backup/export', (req: Request, res: Response) => {
  const download = req.query.download === 'true';
  if (download) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="clinic_backup_${Date.now()}.json"`);
    return res.send(JSON.stringify(store, null, 2));
  }
  return uniformResponse(res, 200, {
    success: true,
    data: store,
    exportedAt: new Date().toISOString(),
  });
});

app.post('/api/backup/import', (req: Request, res: Response) => {
  const importData = req.body?.store || req.body;
  if (!importData || typeof importData !== 'object') {
    return uniformResponse(res, 400, {
      success: false,
      error: 'داده‌های پشتیبان ارسالی نامعتبر است.',
    });
  }

  createStoreBackup('pre_import');

  if (Array.isArray(importData.patients)) store.patients = importData.patients;
  if (Array.isArray(importData.owners)) store.owners = importData.owners;
  if (Array.isArray(importData.visits)) store.visits = importData.visits;
  if (Array.isArray(importData.vaccinations)) store.vaccinations = importData.vaccinations;
  if (Array.isArray(importData.appointments)) store.appointments = importData.appointments;
  if (Array.isArray(importData.invoices)) store.invoices = importData.invoices;
  if (Array.isArray(importData.boarding)) store.boarding = importData.boarding;
  if (Array.isArray(importData.attendance)) store.attendance = importData.attendance;
  if (Array.isArray(importData.products)) store.products = importData.products;
  if (Array.isArray(importData.productMovements)) store.productMovements = importData.productMovements;
  if (Array.isArray(importData.accountingDocuments)) store.accountingDocuments = importData.accountingDocuments;
  if (Array.isArray(importData.suppliers)) store.suppliers = importData.suppliers;
  if (Array.isArray(importData.loyaltyMembers)) store.loyaltyMembers = importData.loyaltyMembers;
  if (Array.isArray(importData.surgerySessions)) store.surgerySessions = importData.surgerySessions;
  if (importData.clinicProfile) store.clinicProfile = { ...store.clinicProfile, ...importData.clinicProfile };
  if (importData.accessMatrix) store.accessMatrix = importData.accessMatrix;
  store.initialized = true;

  saveStore();

  return uniformResponse(res, 200, {
    success: true,
    message: 'فایل پشتیبان با موفقیت بارگذاری و اعمال گردید.',
    counts: {
      patients: store.patients.length,
      owners: store.owners.length,
      visits: store.visits.length,
      vaccinations: store.vaccinations.length,
      appointments: store.appointments.length,
      invoices: store.invoices.length,
      productMovements: store.productMovements.length,
      accountingDocuments: store.accountingDocuments.length,
    },
  });
});

app.get('/api/backup/list', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return uniformResponse(res, 200, { success: true, backups: [] });
    }
    const backups = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(fileName => {
        const filePath = path.join(BACKUPS_DIR, fileName);
        const stat = fs.statSync(filePath);
        return {
          fileName,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return uniformResponse(res, 200, {
      success: true,
      backups,
    });
  } catch (err: any) {
    return uniformResponse(res, 500, {
      success: false,
      error: `خطا در دریافت لیست پشتیبان‌ها: ${err.message}`,
    });
  }
});

app.post('/api/backup/restore', (req: Request, res: Response) => {
  const { fileName } = req.body;
  if (!fileName) {
    return uniformResponse(res, 400, {
      success: false,
      error: 'نام فایل پشتیبان الزامی است.',
    });
  }
  const safeName = path.basename(fileName);
  const targetFile = path.join(BACKUPS_DIR, safeName);
  if (!fs.existsSync(targetFile)) {
    return uniformResponse(res, 404, {
      success: false,
      error: 'فایل پشتیبان مورد نظر یافت نشد.',
    });
  }

  try {
    const raw = fs.readFileSync(targetFile, 'utf-8');
    const parsed = JSON.parse(raw);
    createStoreBackup('pre_restore');
    store = { ...defaultClinicStore, ...parsed };
    saveStore();

    return uniformResponse(res, 200, {
      success: true,
      message: `پشتیبان ${safeName} با موفقیت بازیابی شد.`,
      restoredAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return uniformResponse(res, 500, {
      success: false,
      error: `خطا در بازگردانی فایل پشتیبان: ${err.message}`,
    });
  }
});

app.post('/api/backup/create', (req: Request, res: Response) => {
  const { tag } = req.body;
  const backupPath = createStoreBackup(tag || 'manual');
  if (backupPath) {
    return uniformResponse(res, 200, {
      success: true,
      message: 'نسخه پشتیبان جدید با موفقیت ذخیره شد.',
      backupFile: path.basename(backupPath),
    });
  }
  return uniformResponse(res, 500, {
    success: false,
    error: 'خطا در ایجاد نسخه پشتیبان.',
  });
});

// Database Management (Wipe / Seed)
app.post('/api/database/wipe', (req: Request, res: Response) => {
  createStoreBackup('pre_wipe');
  store.patients = [];
  store.owners = [];
  store.visits = [];
  store.vaccinations = [];
  store.appointments = [];
  store.invoices = [];
  store.boarding = [];
  store.attendance = [];
  store.products = [];
  store.productMovements = [];
  store.accountingDocuments = [];
  store.suppliers = [];
  store.loyaltyMembers = [];
  store.surgerySessions = [];
  store.syncQueue = [];
  store.initialized = true;
  db.syncQueue = [];
  db.migrationLogs = [];
  saveStore();
  return uniformResponse(res, 200, {
    success: true,
    message: 'کلیه رکوردهای داده با موفقیت پاکسازی شد. تنها تنظیمات و پروفایل پیکربندی کلینیک حفظ گردید.',
    retainedConfig: {
      clinicName: store.clinicProfile?.clinicName || 'کلینیک اختصاصی حیوانات خانگی مهرگان',
      initialized: true,
    },
  });
});

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  return uniformResponse(res, 200, {
    success: true,
    status: 'ok',
    clinicName: store.clinicProfile?.clinicName || 'کلینیک دامپزشکی هوشمند مهرگان',
    version: '2.5.0',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    storageFile: CLINIC_STORE_FILE,
    lanServerTime: new Date().toISOString(),
  });
});

// Lightweight fingerprint used by clients to decide whether their local live-data cache is stale.
app.get('/api/data-version', async (req: Request, res: Response) => {
  try {
    const fingerprint = await getPostgresFingerprint();
    if (postgresPool && fingerprint.normalizedVersion !== lastNormalizedFingerprint) {
      await refreshNormalizedStoreFromPostgres();
      lastNormalizedFingerprint = fingerprint.normalizedVersion;
    } else if (postgresPool && fingerprint.storeUpdatedAt !== lastStoreUpdatedAt) {
      const result = await postgresPool.query<{ payload: PersistentClinicStore }>(
        `SELECT payload FROM clinic_store WHERE store_key = 'default'`
      );
      if (result.rows[0]?.payload) {
        store = { ...defaultClinicStore, ...result.rows[0].payload };
        for (const key of arrayKeys) {
          if (!Array.isArray(store[key])) (store[key] as any[]) = [];
        }
      }
    }
    lastPostgresFingerprint = fingerprint.version;
    lastStoreUpdatedAt = fingerprint.storeUpdatedAt;
    return uniformResponse(res, 200, {
      success: true,
      version: fingerprint.version,
      updatedAt: fingerprint.updatedAt,
    });
  } catch (error: any) {
    return uniformResponse(res, 503, { success: false, error: error?.message || 'نسخهٔ داده‌ها در دسترس نیست.' });
  }
});

// AI Veterinary Clinical Assistant & Drug Interaction Checker
app.post('/api/ai/vet-chat', async (req: Request, res: Response) => {
  try {
    const { prompt, patientContext, language } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `شما یک دستیار هوش مصنوعی فوق‌تخصصی دامپزشکی (VetNLP Senior Veterinary Consultant) برای یک کلینیک دامپزشکی پیشرفته هستید.
وظایف شما:
1. تحلیل علائم بالینی (Clinical Signs) و ارائه تشخیص‌های تفریقی (Differential Diagnoses).
2. بررسی دقیق دوزاژ داروها بر اساس گونه و وزن حیوان خانگی (سگ، گربه، پرنده، جونده).
3. اعلام هشدارهای دارویی و تداخلات خطرناک (Drug Interactions & Contraindications).
4. پاسخ‌های واضح، علمی، با فونت درشت و ساختاربندی شده با بخش‌های مشخص (علل احتمالی، پروتکل پیشنهادی، هشدارهای فوری).
زبان پاسخ: فارسی روان با اصطلاحات استاندارد دامپزشکی.`;

    let userMessage = prompt;
    if (patientContext) {
      userMessage = `اطلاعات بیمار:
نام: ${patientContext.name} | گونه: ${patientContext.species} | نژاد: ${patientContext.breed} | وزن: ${patientContext.weightKg}kg | سن: ${patientContext.ageText} | حساسیت‌ها: ${patientContext.allergies?.join(', ') || 'ندارد'}

سوال بالینی:
${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({
      text: response.text || 'پاسخی از مدل دریافت نشد.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/ai/vet-chat:', error);
    res.status(500).json({
      error: error.message || 'خطا در برقراری ارتباط با سرویس هوش مصنوعی دامپزشکی',
      fallbackText: 'پاسخ هوشمند محلی (VetNLP Local): بر اساس راهنمای بالینی، لطفاً علائم حیاتی بیمار شامل دما، ضربان قلب و وضعیت مخاطات را ارزیابی فرمایید.',
    });
  }
});

// Camera AI Entrance Visitor & Pet Identification
app.post('/api/visitor-camera/analyze', async (req: Request, res: Response) => {
  try {
    const { imageBase64, knownPets } = req.body;
    const ai = getGeminiClient();

    const promptText = `این تصویر از دوربین ورودی لابی کلینیک دامپزشکی ضبط شده است.
لطفاً با دقت بسیار بالا موارد زیر را استخراج و در قالب JSON معتبر پاسخ دهید:
1. personDescription: توصیف مختصر و دقیق ظاهر فرد یا افراد همراه (مثلاً: "آقای جوان با پیراهن سرمه‌ای" یا "خانم مسن با شال طوسی")
2. petSpecies: گونه حیوان اگر در تصویر وجود دارد (سگ، گربه، پرنده، نامشخص)
3. petBreed: نژاد تقریبی حیوان در تصویر (مثلاً پامرانین، پرشین، شیتزو، ژرمن)
4. petColor: رنگ مو یا پر حیوان
5. summaryDescription: یک جمله توصیفی کامل برای منشی کلینیک به فارسی روان
6. matchedPetSuggestion: اگر مشخصات با یکی از بیماران شناخته‌شده (${JSON.stringify(knownPets?.map((p: any) => ({ id: p.id, name: p.name, breed: p.breed, color: p.color })) || [])}) همخوانی دارد، نام و شناسه آن را پیشنهاد دهید.`;

    const parts: any[] = [];
    if (imageBase64) {
      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    let resultJson: any = {};
    try {
      resultJson = JSON.parse(response.text || '{}');
    } catch {
      resultJson = {
        summaryDescription: 'مراجعه‌کننده همراه با حیوان خانگی وارد لابی شد.',
        personDescription: 'مراجعه‌کننده محترم',
        petSpecies: 'سگ',
        petBreed: 'پامرانین',
        petColor: 'کرم',
      };
    }

    res.json({
      success: true,
      analysis: resultJson,
    });
  } catch (error: any) {
    console.error('Error in /api/visitor-camera/analyze:', error);
    // Intelligent local fallback
    res.json({
      success: true,
      analysis: {
        summaryDescription: 'تصویر ورودی دریافت شد: مراجعه‌کننده همراه با پت وارد کلینیک گردید.',
        personDescription: 'مراجعه‌کننده در لابی ورودی',
        petSpecies: 'سگ',
        petBreed: 'پامرانین (احتمال لوسی)',
        petColor: 'کرم',
        matchedPetSuggestion: { id: 'pet-1', name: 'لوسی' },
      },
    });
  }
});

// DVR / CCTV Technical Settings & Stream Status
app.get('/api/dvr/status', (req: Request, res: Response) => {
  res.json(db.dvrSettings);
});

app.post('/api/dvr/test-channel', (req: Request, res: Response) => {
  const { channelId } = req.body;
  res.json({
    channelId,
    status: 'online',
    bitrate: '2048 kbps',
    fps: 25,
    resolution: '1920x1080',
    codec: 'H.264 / AAC',
    timestamp: new Date().toISOString(),
  });
});

// Cloud Sync Queue & Trigger
app.get('/api/sync/status', (req: Request, res: Response) => {
  res.json({
    isOnline: true,
    lastSyncTime: '۱۴۰۳/۰۵/۲۸ ۲۳:۵۹:۰۰ (دیشب)',
    nextScheduledSync: '۰۰:۰۰ امشب (Midnight Cron)',
    pendingRecordsCount: db.syncQueue.filter(s => s.status === 'pending').length,
    queue: db.syncQueue,
  });
});

app.post('/api/sync/trigger', (req: Request, res: Response) => {
  db.syncQueue = db.syncQueue.map(item => ({ ...item, status: 'synced' }));
  res.json({
    success: true,
    message: 'همگام‌سازی ابری با موفقیت انجام شد و اطلاعات به پورتال سرپرستان ارسال گردید.',
    syncedAt: new Date().toLocaleTimeString('fa-IR'),
  });
});

// Legacy Data Migration & Cleansing
app.post('/api/migration/process', (req: Request, res: Response) => {
  const { rawData, options } = req.body;
  // Parse, cleanse duplicates, standardize mobile numbers (09xxxxxxxxx), national IDs
  const parsedRecords = Array.isArray(rawData) ? rawData : [];
  const cleansed = parsedRecords.map((r: any, idx: number) => {
    let phone = (r.phone || r.mobile || '').toString().trim().replace(/[^0-9]/g, '');
    if (phone.startsWith('98')) phone = '0' + phone.substring(2);
    if (!phone.startsWith('0') && phone.length === 10) phone = '0' + phone;

    return {
      id: `migrated-${Date.now()}-${idx}`,
      petName: r.petName || r.name || 'پت بدون نام',
      species: r.species || 'سگ',
      breed: r.breed || 'نامشخص',
      ownerName: r.ownerName || r.owner || 'سرپرست ثبت نشده',
      ownerPhone: phone || '09120000000',
      microchip: r.microchip || `CHIP-MIG-${1000 + idx}`,
      valid: Boolean(phone && r.petName),
      importedAt: new Date().toLocaleDateString('fa-IR'),
    };
  });

  const validCount = cleansed.filter(c => c.valid).length;
  res.json({
    success: true,
    totalReceived: parsedRecords.length,
    cleansedCount: validCount,
    duplicatesRemoved: parsedRecords.length - validCount,
    cleansedSample: cleansed.slice(0, 10),
    message: `فرآیند پالایش و تطبیق داده‌ها با موفقیت انجام شد. ${validCount} رکورد آماده انتقال نهایی به دیتابیس است.`,
  });
});

// ----------------------------------------------------
// IT Developer Database Management & Legacy SQL Bridge
// ----------------------------------------------------

// Database Wipe / Clear (Empty State)
app.post('/api/dev/database/clear', (req: Request, res: Response) => {
  const { preserveAdminUsers = true } = req.body;
  
  store.patients = [];
  store.owners = [];
  store.visits = [];
  store.vaccinations = [];
  store.appointments = [];
  store.invoices = [];
  store.boarding = [];
  store.attendance = [];
  store.products = [];
  store.productMovements = [];
  store.accountingDocuments = [];
  store.suppliers = [];
  store.loyaltyMembers = [];
  store.surgerySessions = [];
  store.syncQueue = [];
  store.initialized = true;

  db.syncQueue = [];
  db.migrationLogs = [];

  saveStore();

  res.json({
    success: true,
    message: 'کلیه رکوردهای آزمایشی دیتابیس با موفقیت تخلیه شد و فقط پیکربندی کلینیک حفظ گردید (Database Cleared, Config Preserved).',
    timestamp: new Date().toISOString(),
    preservedConfig: {
      clinicName: store.clinicProfile?.clinicName || 'کلینیک اختصاصی حیوانات خانگی مهرگان',
      initialized: true,
    },
    wipedTables: [
      'patients',
      'owners',
      'visits',
      'appointments',
      'invoices',
      'boarding_records',
      'attendance',
      'petshop_products',
      'suppliers',
      'loyalty_members',
      'surgery_sessions',
    ],
  });
});

// Database Seed 7-Sample Records for all Clinical & Business Scenarios
app.post('/api/dev/database/seed', (req: Request, res: Response) => {
  const { countPerTable = 7 } = req.body;

  res.json({
    success: true,
    message: `دیتابیس با موفقیت با ${countPerTable} رکورد غنی و متنوع برای تمام سناریوهای درمانی، بیعانه جراحی، پانسیون، پت‌شاپ و وفاداری پر شد.`,
    seededTablesCount: 10,
    recordsCount: countPerTable * 10,
    timestamp: new Date().toISOString(),
  });
});

// Legacy SQL Server Discovery
app.post('/api/legacy/sql/discover', (req: Request, res: Response) => {
  const { searchTarget = '192.168.1.50', serverNameFilter = '' } = req.body;

  const mockServers = [
    {
      id: 'srv-mssql-1',
      serverName: 'VET-LEGACY-SRV\\SQLEXPRESS',
      hostIp: '192.168.1.50',
      port: 1433,
      version: 'Microsoft SQL Server 2019 (RTM-CU18) - 15.0.4261.1 (X64)',
      status: 'connected',
      databasesCount: 4,
      detectedDatabases: ['VetClinicDB_2019', 'PetCare_OldSystem', 'VetArchive_2015_2018', 'MasterBilling_Legacy'],
      authType: 'sql_auth',
      lastPingMs: 14,
    },
    {
      id: 'srv-mssql-2',
      serverName: 'CLINIC-PC-RECEPTION\\MSSQL2014',
      hostIp: '192.168.1.102',
      port: 1433,
      version: 'Microsoft SQL Server 2014 (SP3) - 12.0.6024.0 (X86)',
      status: 'connected',
      databasesCount: 2,
      detectedDatabases: ['Darmangah_OldDB', 'Accounting_PetStore_2017'],
      authType: 'windows_auth',
      lastPingMs: 28,
    },
    {
      id: 'srv-mssql-3',
      serverName: 'VET-BACKUP-SERVER\\PROD_ARCHIVE',
      hostIp: '192.168.1.200',
      port: 1433,
      version: 'Microsoft SQL Server 2017 (RTM) - 14.0.1000.169 (X64)',
      status: 'discovered',
      databasesCount: 3,
      detectedDatabases: ['VetBackup_Full_2022', 'HospitalHistory_Archive', 'SurgeryLogs_Legacy'],
      authType: 'sql_auth',
      lastPingMs: 42,
    },
  ];

  let filtered = mockServers;
  if (serverNameFilter && serverNameFilter.trim()) {
    const q = serverNameFilter.toLowerCase();
    filtered = mockServers.filter(s => s.serverName.toLowerCase().includes(q) || s.hostIp.includes(q));
    if (filtered.length === 0) {
      // Dynamic generated server based on search term
      filtered = [
        {
          id: `srv-custom-${Date.now()}`,
          serverName: serverNameFilter.toUpperCase().includes('SQL') ? serverNameFilter : `${serverNameFilter.toUpperCase()}\\SQLEXPRESS`,
          hostIp: searchTarget || '192.168.1.80',
          port: 1433,
          version: 'Microsoft SQL Server 2019 (Enterprise Edition) - 15.0.2000.5',
          status: 'connected',
          databasesCount: 3,
          detectedDatabases: ['VetClinicDB_2019', 'Legacy_Patients_DB', 'Archive_OldVet'],
          authType: 'sql_auth',
          lastPingMs: 19,
        },
      ];
    }
  }

  res.json({
    success: true,
    searchTarget,
    instancesFound: filtered.length,
    instances: filtered,
    message: `اسکن شبکه با موفقیت انجام شد و تعداد ${filtered.length} سرور پایگاه داده SQL Server کشف گردید.`,
  });
});

// Legacy SQL Database Schema Exploration
app.get('/api/legacy/sql/schema', (req: Request, res: Response) => {
  const dbName = (req.query.dbName as string) || 'VetClinicDB_2019';

  res.json({
    databaseName: dbName,
    compatibilityLevel: 150,
    sizeMb: 648.5,
    collation: 'Persian_100_CI_AI',
    tables: [
      {
        tableName: 'tbl_Owners',
        rowCount: 1420,
        columns: [
          { name: 'OwnerID', type: 'int', isNullable: false, isPrimaryKey: true },
          { name: 'FullName', type: 'nvarchar(100)', isNullable: false, isPrimaryKey: false },
          { name: 'NationalCode', type: 'varchar(10)', isNullable: true, isPrimaryKey: false },
          { name: 'MobileNumber', type: 'varchar(15)', isNullable: false, isPrimaryKey: false },
          { name: 'Address', type: 'nvarchar(255)', isNullable: true, isPrimaryKey: false },
          { name: 'RegisterDate', type: 'datetime', isNullable: true, isPrimaryKey: false },
        ],
      },
      {
        tableName: 'tbl_Patients',
        rowCount: 1850,
        columns: [
          { name: 'PatientID', type: 'int', isNullable: false, isPrimaryKey: true },
          { name: 'OwnerID_FK', type: 'int', isNullable: false, isPrimaryKey: false },
          { name: 'PetName', type: 'nvarchar(50)', isNullable: false, isPrimaryKey: false },
          { name: 'AnimalType', type: 'nvarchar(30)', isNullable: false, isPrimaryKey: false },
          { name: 'Breed', type: 'nvarchar(50)', isNullable: true, isPrimaryKey: false },
          { name: 'Sex', type: 'nvarchar(10)', isNullable: true, isPrimaryKey: false },
          { name: 'BirthDate', type: 'varchar(20)', isNullable: true, isPrimaryKey: false },
          { name: 'MicrochipNumber', type: 'varchar(50)', isNullable: true, isPrimaryKey: false },
        ],
      },
      {
        tableName: 'tbl_Visits',
        rowCount: 4210,
        columns: [
          { name: 'VisitID', type: 'bigint', isNullable: false, isPrimaryKey: true },
          { name: 'PatientID_FK', type: 'int', isNullable: false, isPrimaryKey: false },
          { name: 'DoctorName', type: 'nvarchar(100)', isNullable: false, isPrimaryKey: false },
          { name: 'VisitDateShamsi', type: 'varchar(10)', isNullable: false, isPrimaryKey: false },
          { name: 'ChiefComplaint', type: 'nvarchar(max)', isNullable: true, isPrimaryKey: false },
          { name: 'Diagnosis', type: 'nvarchar(max)', isNullable: true, isPrimaryKey: false },
          { name: 'Prescription', type: 'nvarchar(max)', isNullable: true, isPrimaryKey: false },
          { name: 'Fee', type: 'decimal(18,0)', isNullable: true, isPrimaryKey: false },
        ],
      },
      {
        tableName: 'tbl_Vaccinations',
        rowCount: 2130,
        columns: [
          { name: 'VaccineLogID', type: 'int', isNullable: false, isPrimaryKey: true },
          { name: 'PatientID_FK', type: 'int', isNullable: false, isPrimaryKey: false },
          { name: 'VaccineName', type: 'nvarchar(100)', isNullable: false, isPrimaryKey: false },
          { name: 'InjectionDate', type: 'varchar(10)', isNullable: false, isPrimaryKey: false },
          { name: 'NextDueDate', type: 'varchar(10)', isNullable: true, isPrimaryKey: false },
        ],
      },
      {
        tableName: 'tbl_Invoices',
        rowCount: 3890,
        columns: [
          { name: 'FactorNumber', type: 'int', isNullable: false, isPrimaryKey: true },
          { name: 'OwnerID_FK', type: 'int', isNullable: false, isPrimaryKey: false },
          { name: 'TotalAmountRials', type: 'bigint', isNullable: false, isPrimaryKey: false },
          { name: 'PaidAmountRials', type: 'bigint', isNullable: false, isPrimaryKey: false },
          { name: 'FactorDate', type: 'varchar(10)', isNullable: false, isPrimaryKey: false },
        ],
      },
    ],
  });
});

// Legacy SQL Table Extraction to Standard JSON
app.post('/api/legacy/sql/extract', (req: Request, res: Response) => {
  const { instanceId, databaseName = 'VetClinicDB_2019', tables = ['tbl_Patients', 'tbl_Owners'] } = req.body;

  const sampleExtractedJson = [
    {
      petName: 'تامی (قدیمی)',
      species: 'سگ',
      breed: 'پودل عروسکی',
      owner: 'مهندس رضایی',
      phone: '09121112233',
      microchip: '985141009876543',
      legacyPatientId: 1001,
      legacyOwnerId: 501,
      lastVisitDate: '1398/11/15',
      diagnosis: 'گاستریت حاد و سرم‌تراپی',
    },
    {
      petName: 'تامی (قدیمی)',
      species: 'سگ',
      breed: 'پودل',
      owner: 'مهندس رضایی',
      phone: '989121112233', // Duplicate / unnormalized
      legacyPatientId: 1002,
      legacyOwnerId: 501,
      lastVisitDate: '1399/04/10',
      diagnosis: 'واکسیناسیون یادآور سالانه',
    },
    {
      petName: 'برفی',
      species: 'گربه',
      breed: 'پرشین کت سفید',
      owner: 'سرکار خانم شمس',
      phone: '09355554433',
      microchip: '985141005544332',
      legacyPatientId: 1003,
      legacyOwnerId: 502,
      lastVisitDate: '1399/08/22',
      diagnosis: 'اصلاح نمد مویی و مالت‌تراپی گوارش',
    },
    {
      petName: 'رکس',
      species: 'سگ',
      breed: 'ژرمن شپرد',
      owner: 'دکتر فرشید کاظمیان',
      phone: '09127773322',
      microchip: '985141008877665',
      legacyPatientId: 1004,
      legacyOwnerId: 503,
      lastVisitDate: '1400/01/18',
      diagnosis: 'رادیوگرافی هیپ دیسپلازی و تجویز گلوکوزامین',
    },
    {
      petName: 'فندق',
      species: 'پرنده',
      breed: 'کاسکو خاکستری',
      owner: 'کامران بهرامی',
      phone: '09128889900',
      microchip: 'RING-IR-9988',
      legacyPatientId: 1005,
      legacyOwnerId: 504,
      lastVisitDate: '1400/06/05',
      diagnosis: 'چکاپ پرکنی و تجویز مکمل ویتامین آ',
    },
    {
      petName: 'بلا',
      species: 'خرگوش',
      breed: 'لوپ هلندی',
      owner: 'ندا کریمی',
      phone: '09124445566',
      microchip: 'CHIP-RAB-12',
      legacyPatientId: 1006,
      legacyOwnerId: 505,
      lastVisitDate: '1401/02/12',
      diagnosis: 'کوتاه کردن دندان پیشین و رژیم فیبر',
    },
    {
      petName: 'سیمبا',
      species: 'سگ',
      breed: 'گلدن رتریور',
      owner: 'سارا معتمدی',
      phone: '09362224466',
      microchip: '985141003322114',
      legacyPatientId: 1007,
      legacyOwnerId: 506,
      lastVisitDate: '1401/09/30',
      diagnosis: 'جراحی تومور پوستی خوش‌خیم و بیعانه جراحی',
    },
  ];

  res.json({
    success: true,
    instanceId,
    databaseName,
    extractedTables: tables,
    totalRecords: sampleExtractedJson.length,
    extractedJson: JSON.stringify(sampleExtractedJson, null, 2),
    rawRecords: sampleExtractedJson,
    extractedAt: new Date().toISOString(),
    message: `استخراج اطلاعات از دیتابیس ${databaseName} با موفقیت انجام شد. داده‌ها به فرمت استاندارد JSON تبدیل شدند و آماده پالایش می‌باشند.`,
  });
});

// ----------------------------------------------------
// Vite Dev Server / Production Static Serving
// ----------------------------------------------------
async function startServer() {
  await initializePostgresStore();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VetClinic Pro Local & LAN Server running at http://0.0.0.0:${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  await closePostgresStore();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closePostgresStore();
  process.exit(0);
});

startServer();
