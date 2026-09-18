/**
 * scripts/seedDatabase.ts
 * Usage:
 *   npx tsx scripts/seedDatabase.ts seed/seed_clinic_master_data.json
 *
 * This script reads the seed JSON and writes a sanitized copy to data/clinic_seed.json
 * and emits a simple SQL file in output/seed.sql for an initial manual import to PostgreSQL.
 */
import fs from "fs";
import path from "path";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: ts-node scripts/seedDatabase.ts <path-to-json>");
    process.exit(1);
  }
  const inPath = path.resolve(args[0]);
  if (!fs.existsSync(inPath)) {
    console.error("Input file not found:", inPath);
    process.exit(2);
  }
  const raw = JSON.parse(await fs.promises.readFile(inPath, "utf8"));
  // shallow validation
  if (!raw.clinic || !Array.isArray(raw.staff) || !Array.isArray(raw.pets)) {
    console.error("Invalid seed format: missing clinic/staff/pets");
    process.exit(3);
  }
  await fs.promises.mkdir("data", { recursive: true });
  const outPath = path.resolve("data/clinic_seed.json");
  await fs.promises.writeFile(outPath, JSON.stringify(raw, null, 2), "utf8");
  console.log("Wrote seed JSON to", outPath);

  // produce a simple SQL
  await fs.promises.mkdir("output", { recursive: true });
  const sqlPath = path.resolve("output/seed.sql");
  const lines: string[] = [];

  if (Array.isArray(raw.owners)) {
    lines.push("-- owners");
    for (const o of raw.owners) {
      lines.push(
        `INSERT INTO owners(id,name,email,phone,address) VALUES (${quote(
          o.id
        )}, ${quote(o.name)}, ${quote(o.email)}, ${quote(o.phone)}, ${quote(
          o.address
        )});`
      );
    }
  }

  if (Array.isArray(raw.pets)) {
    lines.push("\n-- pets");
    for (const p of raw.pets) {
      lines.push(
        `INSERT INTO pets(id,name,owner_id,breed,description,birth_date) VALUES (${quote(
          p.id
        )}, ${quote(p.name)}, ${quote(p.owner_id)}, ${quote(
          p.breed
        )}, ${quote(p.description)}, ${p.birth_date ? quote(p.birth_date) : "NULL"});`
      );
    }
  }

  await fs.promises.writeFile(sqlPath, lines.join("\n"), "utf8");
  console.log("Wrote example SQL to", sqlPath);
  console.log("Done.");
}

function quote(s: any) {
  if (s === null || s === undefined) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

main().catch((err) => {
  console.error(err);
  process.exit(99);
});
