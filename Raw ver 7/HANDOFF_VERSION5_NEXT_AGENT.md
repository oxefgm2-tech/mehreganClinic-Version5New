# Handoff: Mehregan Vet Clinic Version 5

## Workspace boundary

Use only this project root:

```text
Z:\Projects\vps_remote\4Sites\mehreganpetclinic\_____4NewVersion4\Version5New
```

Do not use sibling folders such as `____NewVersion`, `_____4NewVersion4\Version5New` from another location, the old root project, or any previous version as the active source. The only external data source to use later is the read-only export directory:

```text
Z:\Projects\vps_remote\4Sites\mehreganpetclinic\migration_export_20260910
```

Do not modify the legacy SQL Server or the migration export.

## Current state

The project is a React/Vite + Express application. It currently supports a transitional JSON store and now has a PostgreSQL adapter behind the same API surface.

Important files:

- `server.ts`: Express API, JSON persistence, PostgreSQL JSONB adapter.
- `db/schema.sql`: PostgreSQL schema for clinic data and migration tracking.
- `scripts/importLegacyJsonl.ts`: read-only JSONL normalization and preview generation.
- `scripts/applyPostgresSchema.mjs`: applies `db/schema.sql` using `DATABASE_URL`.
- `scripts/importPreviewToPostgres.mjs`: dry-run by default; transactional import with `--commit`.
- `scripts/smoke_test.ts`: backend persistence and API smoke tests.
- `package-lock.json`: generated after dependency installation.

## Changes already made

- `PORT` is read from `process.env.PORT`.
- `DATA_DIR` is configurable.
- Added storage collections for vaccinations, product movements, and accounting documents.
- Added API endpoints for those collections.
- Added `pg` and `@types/pg`.
- Added PostgreSQL adapter using the `clinic_store` JSONB table.
- Added PostgreSQL configuration variables:
  - `DATABASE_URL`
  - `DATABASE_PROVIDER=json|postgres`
- Added migration preview and transactional PostgreSQL importer.
- Added deploy environment support for PostgreSQL variables.
- Fixed smoke test to respect `DATA_DIR`.

## Validation already completed

From the exact project root:

```bash
npm run lint
npm run build
```

Both pass. The frontend bundle emits a non-blocking large-chunk warning.

The isolated JSON-mode smoke test passed:

```text
16 passed, 0 failed
```

The migration preview was executed against the real read-only export and produced:

- 7,761 owners
- 9,181 patients
- 56,801 vaccinations
- 13 visits
- 778 products
- 11,940 product movements
- 26,615 accounting documents
- 0 parsing/orphan issues

No real clinic store was changed by those tests.

## Current blocker

The project root does not currently contain `.env`. PostgreSQL is installed and accepting connections locally, but authentication requires a password. Do not guess or extract credentials.

Create this file locally, without committing it:

```text
Z:\Projects\vps_remote\4Sites\mehreganpetclinic\_____4NewVersion4\Version5New\.env
```

Required values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
DATABASE_PROVIDER=postgres
```

## Next exact steps

1. From the exact project root, verify `.env` exists without printing its contents.
2. Run `npm run db:apply-schema`.
3. Generate a preview:

   ```bash
   npm run migration:preview -- ..\..\migration_export_20260910 data\migration\staging
   ```

4. Run the importer in dry-run mode:

   ```bash
   npm run migration:import -- data\migration\staging\migration_preview.json
   ```

5. Review counts and `migration_report.json`.
6. Only after staging approval, run:

   ```bash
   npm run migration:import -- data\migration\staging\migration_preview.json --commit
   ```

7. Query PostgreSQL counts and compare them to the preview counts.
8. Run the application with `DATABASE_PROVIDER=postgres` and repeat smoke/API checks against a separate test data directory or staging database.

Do not run `--commit` against production or the legacy database until the staging counts and relationships are approved.
