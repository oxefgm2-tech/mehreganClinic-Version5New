import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required. No schema was applied.');
  process.exit(2);
}

const schemaPath = path.resolve('db/schema.sql');
const schema = await fs.readFile(schemaPath, 'utf8');
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(schema);
  console.log(`Applied PostgreSQL schema from ${schemaPath}`);
} catch (error) {
  console.error('Failed to apply PostgreSQL schema:', error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
