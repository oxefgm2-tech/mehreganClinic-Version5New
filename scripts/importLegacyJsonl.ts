/**
 * Build a reviewable, normalized migration preview from the read-only JSONL
 * exports produced by migration_tools/export_migration.ps1.
 *
 * Usage:
 *   npm run migration:preview -- ../../migration_export_20260910
 *
 * The script never writes to the legacy database and never imports into the
 * application store. It only creates a preview artifact and a report.
 */
import fs from 'fs';
import path from 'path';

type AnyRecord = Record<string, any>;

interface MigrationIssue {
  file: string;
  line?: number;
  code: string;
  message: string;
  legacyId?: string | number;
}

interface MigrationPreview {
  generatedAt: string;
  sourceDirectory: string;
  sourceManifest?: AnyRecord;
  owners: AnyRecord[];
  patients: AnyRecord[];
  vaccinations: AnyRecord[];
  visits: AnyRecord[];
  products: AnyRecord[];
  productMovements: AnyRecord[];
  accountingDocuments: AnyRecord[];
}

const inputDir = path.resolve(process.argv[2] || '../../../migration_export_20260910');
const outputDir = path.resolve(process.argv[3] || 'data/migration');
const issues: MigrationIssue[] = [];

function clean(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).replace(/\s+/g, ' ').trim();
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).replace(/[٬،]/g, '').replace(/,/g, '').trim();
  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function normalizePhone(value: unknown): string {
  let phone = clean(value).replace(/[^0-9]/g, '');
  if (phone.startsWith('98')) phone = `0${phone.slice(2)}`;
  if (phone.length === 10 && phone.startsWith('9')) phone = `0${phone}`;
  return phone;
}

function legacyId(value: unknown): string {
  return clean(value) || 'missing';
}

function sourceFields(file: string, id: unknown, raw: AnyRecord): AnyRecord {
  return {
    sourceDatabase: file.startsWith('shop_') ? 'db_14052' : 'dam2000',
    sourceFile: file,
    legacyId: id ?? null,
    legacy: raw,
  };
}

function readJsonLines(fileName: string): AnyRecord[] {
  const candidates = [fileName, `${fileName}.txt`];
  const actual = candidates.map((name) => path.join(inputDir, name)).find((filePath) => fs.existsSync(filePath));
  if (!actual) {
    issues.push({ file: fileName, code: 'missing_file', message: `Input file not found: ${fileName}` });
    return [];
  }

  const rows: AnyRecord[] = [];
  const lines = fs.readFileSync(actual, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      rows.push(JSON.parse(line));
    } catch (error: any) {
      issues.push({ file: fileName, line: index + 1, code: 'invalid_json', message: error.message });
    }
  });
  return rows;
}

function main() {
  if (!fs.existsSync(inputDir)) {
    console.error(`Migration export directory not found: ${inputDir}`);
    process.exit(2);
  }

  const manifestPath = [
    path.join(inputDir, 'migration_manifest.json'),
    path.join(inputDir, 'migration_manifest.json.txt'),
  ].find((candidate) => fs.existsSync(candidate));
  const sourceManifest = manifestPath ? JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '')) : undefined;

  const ownerByKey = new Map<string, AnyRecord>();
  const patients: AnyRecord[] = [];
  const patientByLegacyId = new Map<string, AnyRecord>();

  for (const raw of readJsonLines('medical_patients.jsonl')) {
    const patientLegacyId = raw.sh_parvande;
    const phone = normalizePhone(raw.mobile || raw.tel);
    const ownerName = clean(raw.Name_s) || 'مالک ثبت‌نشده';
    const ownerKey = phone ? `phone:${phone}` : `name:${ownerName.toLowerCase()}|address:${clean(raw.Address).toLowerCase()}`;

    let owner = ownerByKey.get(ownerKey);
    if (!owner) {
      owner = {
        id: `legacy-owner-${Buffer.from(ownerKey).toString('hex').slice(0, 24)}`,
        name: ownerName,
        fullName: ownerName,
        phone,
        address: clean(raw.Address),
        email: clean(raw.mail),
        legacySource: { database: 'dam2000', table: 'Parvande', ownerKey },
      };
      ownerByKey.set(ownerKey, owner);
    }

    const patient = {
      id: `legacy-pet-${legacyId(patientLegacyId)}`,
      name: clean(raw.name_h) || `پرونده ${legacyId(patientLegacyId)}`,
      species: clean(raw.type_h),
      breed: clean(raw.nezad),
      gender: clean(raw.sex),
      birthDate: clean(raw.tarikh_t),
      microchipNumber: clean(raw.sh_sh),
      ownerId: owner.id,
      ownerName: owner.name,
      ownerPhone: owner.phone,
      notes: clean(raw.exp),
      active: raw.active === undefined ? true : Boolean(raw.active),
      ...sourceFields('medical_patients.jsonl', patientLegacyId, raw),
    };

    if (patientByLegacyId.has(String(patientLegacyId))) {
      issues.push({ file: 'medical_patients.jsonl', code: 'duplicate_patient_id', message: 'Duplicate sh_parvande', legacyId: patientLegacyId });
    } else {
      patientByLegacyId.set(String(patientLegacyId), patient);
      patients.push(patient);
    }
  }

  const vaccinations: AnyRecord[] = readJsonLines('medical_vaccinations.jsonl').map((raw) => ({
    id: `legacy-vaccination-${legacyId(raw.id)}`,
    patientId: patientByLegacyId.get(String(raw.sh_parvande))?.id || null,
    vaccineName: clean(raw.noe_vaksan),
    date: clean(raw.tarikh),
    nextDueDate: clean(raw.tarikh_next),
    price: numberOrNull(raw.price),
    completed: Boolean(raw.isok),
    ...sourceFields('medical_vaccinations.jsonl', raw.id, raw),
  }));

  vaccinations.forEach((record) => {
    if (!record.patientId) issues.push({ file: 'medical_vaccinations.jsonl', code: 'orphan_vaccination', message: 'No matching patient found', legacyId: record.legacyId });
  });

  const visits: AnyRecord[] = readJsonLines('medical_visits.jsonl').map((raw) => ({
    id: `legacy-visit-${legacyId(raw.id)}`,
    patientId: patientByLegacyId.get(String(raw.sh_parvande))?.id || null,
    date: clean(raw.tarikh),
    cost: numberOrNull(raw.price),
    vitalSigns: {
      weight: clean(raw.v_vazn),
      temperature: numberOrNull(raw.dama),
      heartRate: numberOrNull(raw.ghalb),
      respiratoryRate: numberOrNull(raw.tanafos),
    },
    clinicalFindings: Object.fromEntries(
      Object.entries(raw)
        .filter(([key, value]) => key.startsWith('v_') || key.startsWith('exp_'))
        .map(([key, value]) => [key, clean(value)])
        .filter(([, value]) => value !== '')
    ),
    ...sourceFields('medical_visits.jsonl', raw.id, raw),
  }));

  visits.forEach((record) => {
    if (!record.patientId) issues.push({ file: 'medical_visits.jsonl', code: 'orphan_visit', message: 'No matching patient found', legacyId: record.legacyId });
  });

  const products = readJsonLines('shop_products.jsonl').map((raw) => ({
    id: `legacy-product-${legacyId(raw.Code)}`,
    name: clean(raw.CName),
    latinName: clean(raw.CLatin),
    barcode: clean(raw.Barcode),
    groupCode: raw.GroupCode ?? null,
    unit: clean(raw.UnitName_1),
    price: numberOrNull(raw.Price_1),
    salePrice: numberOrNull(raw.Price_2),
    stock: numberOrNull(raw.CountNumber),
    active: raw.IsActive === undefined ? true : Boolean(raw.IsActive),
    ...sourceFields('shop_products.jsonl', raw.Code, raw),
  }));

  const productMovements = readJsonLines('shop_product_movements.jsonl').map((raw) => ({
    id: `legacy-movement-${legacyId(raw.ID)}`,
    productLegacyCode: raw.GoodsCode ?? null,
    factorNumber: raw.Factor_Num ?? null,
    date: clean(raw.Factor_Date),
    direction: raw['I/O'] === 1 ? 'in' : raw['I/O'] === 2 ? 'out' : 'unknown',
    quantity: numberOrNull(raw.Tedad),
    price: numberOrNull(raw.Price),
    discount: numberOrNull(raw.Discont),
    warehouseCode: raw.StrhCode ?? null,
    ...sourceFields('shop_product_movements.jsonl', raw.ID, raw),
  }));

  const accountingDocuments = readJsonLines('shop_documents.jsonl').map((raw) => ({
    id: `legacy-document-${legacyId(raw.ID)}`,
    documentNumber: raw.Sanad_Num ?? null,
    date: clean(raw.SanadDate),
    factorNumber: raw.Factor_Num ?? null,
    debit: numberOrNull(raw.Bed),
    credit: numberOrNull(raw.Bes),
    comment: clean(raw.Comment),
    ...sourceFields('shop_documents.jsonl', raw.ID, raw),
  }));

  const preview: MigrationPreview = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: inputDir,
    sourceManifest,
    owners: [...ownerByKey.values()],
    patients,
    vaccinations,
    visits,
    products,
    productMovements,
    accountingDocuments,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'migration_preview.json'), JSON.stringify(preview, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(outputDir, 'migration_report.json'),
    JSON.stringify({ generatedAt: preview.generatedAt, counts: Object.fromEntries(Object.entries(preview).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])), issueCount: issues.length, issues }, null, 2),
    'utf8'
  );

  console.log(JSON.stringify({ outputDir, counts: { owners: preview.owners.length, patients: preview.patients.length, vaccinations: preview.vaccinations.length, visits: preview.visits.length, products: preview.products.length, productMovements: preview.productMovements.length, accountingDocuments: preview.accountingDocuments.length }, issueCount: issues.length }, null, 2));
}

main();
