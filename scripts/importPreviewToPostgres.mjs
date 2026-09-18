import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Pool } from 'pg';

const previewPath = path.resolve(process.argv[2] || 'data/migration/migration_preview.json');
const commit = process.argv.includes('--commit');
const databaseUrl = process.env.DATABASE_URL;

const preview = JSON.parse(await fs.readFile(previewPath, 'utf8'));
const collections = [
  'owners',
  'patients',
  'vaccinations',
  'visits',
  'products',
  'productMovements',
  'accountingDocuments',
];
const counts = Object.fromEntries(collections.map((key) => [key, Array.isArray(preview[key]) ? preview[key].length : 0]));

console.log(JSON.stringify({ mode: commit ? 'commit' : 'dry-run', previewPath, counts }, null, 2));

if (!commit) {
  console.log('Dry-run completed. Re-run with --commit and DATABASE_URL to write to PostgreSQL.');
  process.exit(0);
}

if (!databaseUrl) {
  console.error('DATABASE_URL is required for --commit. No data was written.');
  process.exit(2);
}

const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();
let migrationRunId;

async function one(sql, values = []) {
  const result = await client.query(sql, values);
  return result.rows[0];
}

try {
  await client.query('BEGIN');
  const run = await one(
    `INSERT INTO migration_runs (status, source_manifest, counts)
     VALUES ('running', $1::jsonb, $2::jsonb)
     RETURNING id`,
    [JSON.stringify(preview.sourceManifest || {}), JSON.stringify(counts)]
  );
  migrationRunId = run.id;

  const ownerIds = new Map();
  for (const owner of preview.owners || []) {
    const legacyId = owner.legacySource?.ownerKey || owner.id;
    const row = await one(
      `INSERT INTO owners (full_name, phone, email, address, legacy_database, legacy_table, legacy_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (legacy_database, legacy_table, legacy_id)
       DO UPDATE SET full_name=EXCLUDED.full_name, phone=EXCLUDED.phone, email=EXCLUDED.email,
                     address=EXCLUDED.address, updated_at=now()
       RETURNING id`,
      [owner.fullName || owner.name || 'مالک ثبت‌نشده', owner.phone || null, owner.email || null, owner.address || null, 'dam2000', 'Parvande', legacyId]
    );
    ownerIds.set(owner.id, row.id);
  }

  const petIds = new Map();
  for (const pet of preview.patients || []) {
    const row = await one(
      `INSERT INTO pets (owner_id, name, species, breed, gender, birth_date_text, microchip_number, notes,
                         is_active, legacy_database, legacy_table, legacy_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (legacy_database, legacy_table, legacy_id)
       DO UPDATE SET owner_id=EXCLUDED.owner_id, name=EXCLUDED.name, species=EXCLUDED.species,
                     breed=EXCLUDED.breed, gender=EXCLUDED.gender, notes=EXCLUDED.notes,
                     is_active=EXCLUDED.is_active, updated_at=now()
       RETURNING id`,
      [ownerIds.get(pet.ownerId) || null, pet.name, pet.species || null, pet.breed || null, pet.gender || null,
       pet.birthDate || null, pet.microchipNumber || null, pet.notes || null, pet.active !== false,
       pet.sourceDatabase, pet.sourceFile.replace(/\.jsonl(?:\.txt)?$/, ''), String(pet.legacyId)]
    );
    petIds.set(pet.id, row.id);
  }

  for (const vaccination of preview.vaccinations || []) {
    await client.query(
      `INSERT INTO vaccinations (pet_id, vaccine_name, administered_date_text, next_due_date_text, price,
                                 is_completed, legacy_database, legacy_table, legacy_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (legacy_database, legacy_table, legacy_id)
       DO UPDATE SET pet_id=EXCLUDED.pet_id, vaccine_name=EXCLUDED.vaccine_name,
                     administered_date_text=EXCLUDED.administered_date_text,
                     next_due_date_text=EXCLUDED.next_due_date_text, price=EXCLUDED.price,
                     is_completed=EXCLUDED.is_completed`,
      [petIds.get(vaccination.patientId) || null, vaccination.vaccineName || null, vaccination.date || null,
       vaccination.nextDueDate || null, vaccination.price, vaccination.completed === true,
       vaccination.sourceDatabase, 'vaksan', String(vaccination.legacyId)]
    );
  }

  for (const visit of preview.visits || []) {
    await client.query(
      `INSERT INTO visits (pet_id, visit_date_text, cost, vital_signs, clinical_findings,
                           legacy_database, legacy_table, legacy_id)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8)
       ON CONFLICT (legacy_database, legacy_table, legacy_id)
       DO UPDATE SET pet_id=EXCLUDED.pet_id, visit_date_text=EXCLUDED.visit_date_text,
                     cost=EXCLUDED.cost, vital_signs=EXCLUDED.vital_signs,
                     clinical_findings=EXCLUDED.clinical_findings`,
      [petIds.get(visit.patientId) || null, visit.date || null, visit.cost,
       JSON.stringify(visit.vitalSigns || {}), JSON.stringify(visit.clinicalFindings || {}),
       visit.sourceDatabase, 'vizit', String(visit.legacyId)]
    );
  }

  const productIds = new Map();
  for (const product of preview.products || []) {
    const row = await one(
      `INSERT INTO products (name, latin_name, barcode, group_code, unit_name, purchase_price, sale_price,
                            stock_quantity, is_active, legacy_database, legacy_table, legacy_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (legacy_database, legacy_table, legacy_id)
       DO UPDATE SET name=EXCLUDED.name, barcode=EXCLUDED.barcode, sale_price=EXCLUDED.sale_price,
                     stock_quantity=EXCLUDED.stock_quantity, is_active=EXCLUDED.is_active,
                     updated_at=now()
       RETURNING id`,
      [product.name || 'کالای بدون نام', product.latinName || null, product.barcode || null,
       product.groupCode == null ? null : String(product.groupCode), product.unit || null,
       product.price, product.salePrice, product.stock, product.active !== false,
       product.sourceDatabase, 'tbl_Goods', String(product.legacyId)]
    );
    productIds.set(String(product.legacyId), row.id);
  }

  for (const movement of preview.productMovements || []) {
    await client.query(
      `INSERT INTO product_movements (product_id, product_legacy_code, factor_number, movement_date_text,
                                      direction, quantity, unit_price, discount, warehouse_code,
                                      legacy_database, legacy_table, legacy_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (legacy_database, legacy_table, legacy_id)
       DO UPDATE SET product_id=EXCLUDED.product_id, direction=EXCLUDED.direction,
                     quantity=EXCLUDED.quantity, unit_price=EXCLUDED.unit_price,
                     discount=EXCLUDED.discount`,
      [productIds.get(String(movement.productLegacyCode)) || null,
       movement.productLegacyCode == null ? null : String(movement.productLegacyCode),
       movement.factorNumber == null ? null : String(movement.factorNumber), movement.date || null,
       movement.direction, movement.quantity, movement.price, movement.discount,
       movement.warehouseCode == null ? null : String(movement.warehouseCode),
       movement.sourceDatabase, 'tbl_Factor', String(movement.legacyId)]
    );
  }

  for (const document of preview.accountingDocuments || []) {
    await client.query(
      `INSERT INTO accounting_documents (document_number, document_date_text, factor_number, debit, credit,
                                         comment, legacy_database, legacy_table, legacy_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (legacy_database, legacy_table, legacy_id)
       DO UPDATE SET document_number=EXCLUDED.document_number,
                     document_date_text=EXCLUDED.document_date_text,
                     debit=EXCLUDED.debit, credit=EXCLUDED.credit, comment=EXCLUDED.comment`,
      [document.documentNumber == null ? null : String(document.documentNumber), document.date || null,
       document.factorNumber == null ? null : String(document.factorNumber), document.debit, document.credit,
       document.comment || null, document.sourceDatabase, 'tbl_Document', String(document.legacyId)]
    );
  }

  await client.query(
    `UPDATE migration_runs SET status='completed', completed_at=now() WHERE id=$1`,
    [migrationRunId]
  );
  await client.query('COMMIT');
  console.log(JSON.stringify({ status: 'completed', migrationRunId, counts }, null, 2));
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  if (migrationRunId) {
    await client.query(`UPDATE migration_runs SET status='failed', completed_at=now() WHERE id=$1`, [migrationRunId]).catch(() => undefined);
  }
  console.error('Migration rolled back:', error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
