import { readFile } from "node:fs/promises";
import process from "node:process";
import pg from "pg";

const [, , sqlPath] = process.argv;
if (!sqlPath) {
  console.error("Uso: node scripts/run-sql.mjs <arquivo.sql>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL ?? "postgres://jufap_one:jufap_one@localhost:5432/jufap_one";
const sql = await readFile(sqlPath, "utf8");
const client = new pg.Client({ connectionString });

try {
  await client.connect();
  await client.query(sql);
  console.log(`SQL aplicado com sucesso: ${sqlPath}`);
} finally {
  await client.end();
}
